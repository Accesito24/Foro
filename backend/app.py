import sqlite3
import jwt
import datetime
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

SECRET_KEY = 'super-secreto-hackathon'

def init_db():
    conn = sqlite3.connect('foro.db')
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS mensajes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, username TEXT NOT NULL, texto TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES usuarios (id))''')
    conn.commit()
    conn.close()

init_db()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        if not token:
            return jsonify({'error': 'No se proporcionó token'}), 401
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user_id = data['user_id']
            current_username = data['username']
        except Exception:
            return jsonify({'error': 'Token inválido o expirado'}), 401
        return f(current_user_id, current_username, *args, **kwargs)
    return decorated

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'API Python funcionando'})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    confirm_password = data.get('confirmPassword', '')
    if not username or not email or not password:
        return jsonify({'error': 'Todos los campos son obligatorios'}), 400
    if password != confirm_password:
        return jsonify({'error': 'Las contraseñas no coinciden'}), 400
    hashed_password = generate_password_hash(password)
    try:
        conn = sqlite3.connect('foro.db')
        cursor = conn.cursor()
        cursor.execute('INSERT INTO usuarios (username, email, password) VALUES (?, ?, ?)', (username, email, hashed_password))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Usuario registrado con éxito'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'El nombre de usuario o email ya están en uso'}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    identifier = data.get('identifier', '').strip()
    password = data.get('password', '')
    if not identifier or not password:
        return jsonify({'error': 'Faltan credenciales'}), 400
    conn = sqlite3.connect('foro.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, password FROM usuarios WHERE username = ? OR email = ?', (identifier, identifier))
    user = cursor.fetchone()
    conn.close()
    if not user or not check_password_hash(user[2], password):
        return jsonify({'error': 'Credenciales inválidas'}), 401
    token = jwt.encode({'user_id': user[0], 'username': user[1], 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)}, SECRET_KEY, algorithm='HS256')
    return jsonify({'message': 'Login exitoso', 'token': token, 'username': user[1]}), 200

@app.route('/api/messages', methods=['GET'])
def get_messages():
    conn = sqlite3.connect('foro.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, username as autor, texto, created_at FROM mensajes ORDER BY created_at DESC')
    mensajes = [{'id': row[0], 'autor': row[1], 'texto': row[2], 'created_at': row[3]} for row in cursor.fetchall()]
    conn.close()
    return jsonify(mensajes)

@app.route('/api/messages', methods=['POST'])
@token_required
def create_message(current_user_id, current_username):
    data = request.json
    texto = data.get('texto', '').strip()
    if not texto: return jsonify({'error': 'El mensaje no puede estar vacío'}), 400
    if len(texto) > 500: return jsonify({'error': 'El mensaje excede los 500 caracteres'}), 400
    conn = sqlite3.connect('foro.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO mensajes (user_id, username, texto) VALUES (?, ?, ?)', (current_user_id, current_username, texto))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Mensaje publicado'}), 201

@app.errorhandler(Exception)
def handle_exception(e):
    return jsonify({'error': 'Error interno del servidor'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)
