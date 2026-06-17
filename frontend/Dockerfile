# Use Node.js to install dependencies and run the development server
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Expose React's default development server port
EXPOSE 3000

CMD ["npm", "start"]