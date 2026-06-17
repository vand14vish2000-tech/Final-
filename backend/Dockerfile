# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files first to leverage Docker cache caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy the rest of the backend application source code
COPY . .

# Expose the port the backend runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]