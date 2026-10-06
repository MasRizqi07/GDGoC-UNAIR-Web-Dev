import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const userId = crypto.randomUUID();
  await prisma.todo.create({
    data: {
      text: 'Seed task',
      userId,
    },
  });
  console.log('Seeded database');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
