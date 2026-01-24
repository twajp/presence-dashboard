FROM node:25-slim

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

RUN npm install

# Copy project files to the Docker image
COPY . .

# Run the development server
CMD [ "npm", "run", "dev" ]
