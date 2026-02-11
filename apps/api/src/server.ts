import http from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config.js';
import { configureSocket } from './ws/socket.js';

const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: config.clientUrl,
    credentials: true,
  },
});

const app = createApp(io);
httpServer.removeAllListeners('request');
httpServer.on('request', app);
configureSocket(io);

httpServer.listen(config.port, () => {
  console.log(`API started on http://localhost:${config.port}`);
});
