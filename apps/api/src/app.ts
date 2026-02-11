import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import { config } from './config.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import { createConversationsRouter } from './routes/conversations.js';
import { createMessagesRouter } from './routes/messages.js';

export const createApp = (io: Server) => {
  const app = express();
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());

  app.get('/health', (_, res) => res.json({ ok: true }));
  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/conversations', createConversationsRouter(io));
  app.use('/messages', createMessagesRouter(io));

  return app;
};
