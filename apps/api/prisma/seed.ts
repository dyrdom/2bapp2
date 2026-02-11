import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.reaction.deleteMany();
  await prisma.readReceipt.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();

  const [alice, bob, charlie] = await Promise.all([
    prisma.user.create({ data: { email: 'alice@example.com', username: 'alice', passwordHash, status: 'online' } }),
    prisma.user.create({ data: { email: 'bob@example.com', username: 'bob', passwordHash, status: 'idle' } }),
    prisma.user.create({ data: { email: 'charlie@example.com', username: 'charlie', passwordHash, status: 'dnd' } }),
  ]);

  const convo1 = await prisma.conversation.create({
    data: {
      members: { createMany: { data: [{ userId: alice.id }, { userId: bob.id }] } },
    },
  });

  const convo2 = await prisma.conversation.create({
    data: {
      members: { createMany: { data: [{ userId: alice.id }, { userId: charlie.id }] } },
    },
  });

  await prisma.message.createMany({
    data: [
      { conversationId: convo1.id, senderId: alice.id, content: 'Привет, Bob 👋' },
      { conversationId: convo1.id, senderId: bob.id, content: 'Привет! Готов к MVP?' },
      { conversationId: convo2.id, senderId: charlie.id, content: 'Не забудь про websocket события.' },
    ],
  });

  console.log('Seed complete');
}

main().finally(() => prisma.$disconnect());
