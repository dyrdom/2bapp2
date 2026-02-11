import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../utils/prisma.js';

export const configureSocket = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') return next(new Error('Unauthorized'));

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId as string;
    socket.join(userId);

    const memberships = await prisma.conversationMember.findMany({ where: { userId } });
    memberships.forEach((m) => socket.join(m.conversationId));

    await prisma.user.update({ where: { id: userId }, data: { status: 'online' } });
    io.emit('presence', { userId, status: 'online' });

    socket.on('typing', (payload: { conversationId: string; isTyping: boolean }) => {
      io.to(payload.conversationId).emit('typing', {
        conversationId: payload.conversationId,
        userId,
        isTyping: payload.isTyping,
      });
    });

    socket.on('presence', async (payload: { status: 'online' | 'idle' | 'dnd' | 'invisible' }) => {
      await prisma.user.update({ where: { id: userId }, data: { status: payload.status } });
      io.emit('presence', { userId, status: payload.status });
    });

    socket.on('disconnect', async () => {
      await prisma.user.update({ where: { id: userId }, data: { status: 'invisible' } });
      io.emit('presence', { userId, status: 'invisible' });
    });
  });
};
