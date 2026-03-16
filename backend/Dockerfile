# Usamos una imagen ligera de Node.js versión 20
FROM node:20-alpine

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos el package.json y package-lock.json primero
# (Esto aprovecha la caché de Docker para acelerar los builds)
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código del backend
COPY . .

# Exponemos el puerto que usará Express
EXPOSE 3000

# Comando por defecto para arrancar
CMD ["npm", "start"]
