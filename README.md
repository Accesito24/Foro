# Foro de Mensajes - Guía de Despliegue

Esta documentación explica cómo desplegar y ejecutar el proyecto del Foro de Mensajes utilizando Docker y Docker Compose.

## 📋 Requisitos Previos

Asegúrate de tener instalado lo siguiente en tu sistema:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (o usar `docker compose` integrado en Docker Desktop)

## 🚀 Cómo desplegar la aplicación

El proyecto consta de dos servicios integrados y orquestados por Docker Compose:
- **Backend (API)**: Node.js con Express y base de datos SQLite.
- **Frontend (Web)**: Servidor web Nginx que entrega los archivos estáticos (HTML, CSS, JS).

Para iniciar la aplicación, abre una terminal en la raíz del proyecto (donde se encuentra el archivo `docker-compose.yml`) y ejecuta el siguiente comando:

```bash
docker-compose up --build
```
*(Nota: El flag `--build` fuerza la reconstrucción de la imagen para asegurar que tienes las últimas dependencias o cambios del backend).*

Si prefieres ejecutarlo en segundo plano (para que no bloquee tu terminal), añade el flag `-d`:

```bash
docker-compose up -d --build
```

## 🌐 Acceso a la aplicación

Una vez que los contenedores se hayan iniciado correctamente, abre tu navegador web y visita las siguientes direcciones:

- **Frontend (Interfaz de Usuario)**: [http://localhost:8080](http://localhost:8080)
- **Backend (API)**: [http://localhost:3000](http://localhost:3000)

## 🛑 Cómo detener la aplicación

Si ejecutaste el proyecto en primer plano, puedes detenerlo pulsando `Ctrl + C` en la terminal.

Si lo ejecutaste en segundo plano (con `-d`), debes detener los contenedores ejecutando:

```bash
docker-compose down
```

### 💾 Persistencia de Datos (Base de Datos SQLite)
El archivo `docker-compose.yml` está configurado con un **volumen persistente** (`sqlite_data`). Esto significa que al ejecutar `docker-compose down`, tus datos (usuarios, hilos y mensajes creados) estarán a salvo y seguirán allí la próxima vez que inicies el proyecto.

Si deseas **borrar por completo la base de datos** y empezar desde cero, puedes destruir los contenedores junto con sus volúmenes asociados con:

```bash
docker-compose down -v
```

## 🛠️ Modo de Desarrollo Ágil (Hot Reload)

El entorno de Docker está preparado específicamente para facilitar el desarrollo durante el Hackathon:

1. **Backend**: Los archivos de tu carpeta local `./backend` están vinculados al contenedor. Gracias a `nodemon`, si guardas un cambio en el código Node.js, el servidor reiniciará automáticamente sin necesidad de reiniciar Docker.
2. **Frontend**: Los archivos de tu carpeta `./frontend` están vinculados directamente al servicio Nginx. Cualquier cambio en HTML, CSS o JS se actualizará instantáneamente; solo necesitas recargar la página en tu navegador (`F5`).

---

## 💻 Alternativa: Ejecución Local (Sin Docker)

Si no tienes Docker instalado o prefieres correr los servicios directamente en tu sistema operativo, puedes hacerlo fácilmente. Únicamente necesitarás tener instalado [Node.js](https://nodejs.org/) (versión 16 o superior).

### 1. Iniciar el Backend (API)

Abre una terminal, navega a la carpeta del backend, instala las dependencias y arranca el servidor:

```bash
cd backend
npm install
npm run dev
```

El backend se iniciará y estará escuchando peticiones en **http://localhost:3000**.
*(Nota: La base de datos SQLite se creará y guardará de forma local en un archivo dentro de la carpeta del backend).*

### 2. Iniciar el Frontend (Web)

Abre **otra** terminal distinta (sin cerrar la del backend). Como el frontend son archivos estáticos (HTML/CSS/JS), puedes servirlos levantando un servidor web ligero.

Usando el propio Node.js que ya tienes instalado, ejecuta:

```bash
cd frontend
npx serve -l 8080 .
```

*(`npx serve` descarga y ejecuta al vuelo un servidor estático. El parámetro `-l 8080` asegura que se levante en el puerto 8080, para copiar exactamente el mismo comportamiento que en Docker).*

Finalmente, abre en tu navegador **http://localhost:8080**.

*(💡 **Tip para VS Code**: Si usas Visual Studio Code, otra opción rapidísima es instalar la extensión **Live Server**, hacer clic derecho sobre el archivo `frontend/index.html` y seleccionar "Open with Live Server").*
