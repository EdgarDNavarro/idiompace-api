# --- Etapa 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias primero
COPY package*.json tsconfig.json ./
RUN npm install

# Copiar el resto del código
COPY src ./src

# Compilar a JS (a carpeta dist/)
RUN npm run build

# --- Etapa 2: Runtime ---
FROM node:20-alpine

WORKDIR /app

# Copiar solo lo necesario desde el builder
COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/build ./build

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "build/index.js"]
