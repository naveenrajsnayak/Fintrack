FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN mkdir -p /app/data
ENV PORT=3000
ENV JWT_SECRET=change-this-in-production
EXPOSE 3000
CMD ["node", "server.js"]
