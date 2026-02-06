FROM node:18-slim

# Install system dependencies (Python for yt-dlp, FFmpeg for conversion)
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy app source
COPY . .

# Expose Render port
EXPOSE 10000

# Start command
CMD ["node", "server.js"]
