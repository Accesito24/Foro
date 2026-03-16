// URL Base de la API. Asumiendo que Docker Compose mapea el backend al puerto 3000
const API_URL = 'http://localhost:3000/api';

// Elementos del DOM
const alertBox = document.getElementById('alert-box');
const sectionWall = document.getElementById('section-wall');
const sectionLogin = document.getElementById('section-login');
const sectionRegister = document.getElementById('section-register');

// Estado de autenticación
function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

// Navegación Básica Ocultando/Mostrando Secciones
function showSection(sectionId) {
    sectionRegister.style.display = 'none';
    sectionLogin.style.display = 'none';
    sectionWall.style.display = 'none';

    if (sectionId === 'register') sectionRegister.style.display = 'block';
    if (sectionId === 'login') sectionLogin.style.display = 'block';
    if (sectionId === 'wall') {
        sectionWall.style.display = 'block';
        loadMessages();
    }
}

// Manejo de la interfaz respecto a la sesión
function updateNav() {
    const navAuth = document.getElementById('nav-auth');
    const navUnauth = document.getElementById('nav-unauth');
    const postBox = document.getElementById('post-box');
    const noAuthMsg = document.getElementById('no-auth-message');
    const userGreeting = document.getElementById('user-greeting');

    if (isAuthenticated()) {
        navAuth.style.display = 'flex';
        navUnauth.style.display = 'none';
        postBox.style.display = 'block';
        noAuthMsg.style.display = 'none';
        userGreeting.textContent = `Hola, ${localStorage.getItem('username')}`;
    } else {
        navAuth.style.display = 'none';
        navUnauth.style.display = 'flex';
        postBox.style.display = 'none';
        noAuthMsg.style.display = 'block';
    }
}

// Mostrar Alertas Unificadas (Survival Checklist: Mensajes claros y amigables)
function showAlert(message, isError = true) {
    alertBox.textContent = message;
    alertBox.className = isError ? 'alert error' : 'alert success';
    alertBox.style.display = 'block';
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 4000);
}

// ===================================
// LÓGICA DE LA API
// ===================================

async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Si tenemos token, lo inyectamos (Authorización)
    if (isAuthenticated()) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
    }

    const options = {
        method,
        headers,
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error inesperado');
    }

    return data;
}

// Registro
document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        username: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        confirmPassword: document.getElementById('reg-confirm').value,
    };

    try {
        await apiCall('/register', 'POST', data);
        showAlert('Registro exitoso. Ahora puedes iniciar sesión.', false);
        e.target.reset();
        showSection('login');
    } catch (error) {
        showAlert(error.message);
    }
});

// Login
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        identifier: document.getElementById('login-identifier').value,
        password: document.getElementById('login-password').value,
    };

    try {
        const result = await apiCall('/login', 'POST', data);
        // Guardamos JWT seguro en localStorage (no es perfecto vs XSS pero ágil en hackathon)
        localStorage.setItem('token', result.token);
        localStorage.setItem('username', result.username);
        
        showAlert('Sesión iniciada correctamente', false);
        e.target.reset();
        updateNav();
        showSection('wall');
    } catch (error) {
        showAlert(error.message);
    }
});

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    updateNav();
    showSection('wall');
}

// Cargar Mensajes
async function loadMessages() {
    const container = document.getElementById('messages-container');
    container.innerHTML = 'Cargando...';

    try {
        const messages = await apiCall('/messages');
        
        if (messages.length === 0) {
            container.innerHTML = '<p>No hay mensajes aún. ¡Sé el primero!</p>';
            return;
        }

        container.innerHTML = messages.map(msg => `
            <article class="message-card">
                <div class="message-header">
                    <strong>@${escapeHtml(msg.autor)}</strong>
                    <span>${new Date(msg.created_at).toLocaleString()}</span>
                </div>
                <div class="message-body">${escapeHtml(msg.texto)}</div>
            </article>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Error al cargar mensajes. Verifica la conexión con el servidor.</p>';
        console.error(error);
    }
}

// Enviar Nuevo Mensaje
document.getElementById('form-post').addEventListener('submit', async (e) => {
    e.preventDefault();
    const textarea = document.getElementById('post-text');
    const texto = textarea.value;

    try {
        await apiCall('/messages', 'POST', { texto });
        textarea.value = '';
        loadMessages(); // Recargamos muro
        showAlert('Mensaje publicado', false);
    } catch (error) {
        showAlert(error.message);
    }
});

// Función básica para proteger contra XSS reflejado al mostrar datos en el HTML
function escapeHtml(unsafe) {
    if(!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Inicialización de la aplicación Web
updateNav();
showSection('wall');
