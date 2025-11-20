# Use Node.js 18 as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install git to clone the repo
RUN apk add --no-cache git

# Clone the repository
RUN git clone https://github.com/tech-rohitjadhav/guidmcp .

# Install dependencies
RUN npm install

# Build the project
RUN npm run build

# Set the entrypoint to run the server
ENTRYPOINT ["node", "dist/server.js"]
