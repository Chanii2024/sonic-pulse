FROM node:20

# Install system dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg curl python3 ca-certificates && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
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

# Expose Hugging Face default port
EXPOSE 7860

# Start command
CMD ["node", "server.js"]
