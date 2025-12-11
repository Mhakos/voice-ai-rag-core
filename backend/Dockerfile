FROM node:18-alpine

WORKDIR /usr/src/app

# CAMBIO: Copiamos explícitamente ambos archivos, sin asteriscos
COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]