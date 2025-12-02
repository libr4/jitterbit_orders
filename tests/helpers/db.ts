import prisma from '../../src/db/prismaClient';

export async function resetDb() {
  // Order of deletion matters due to FK constraints
  await prisma.item.deleteMany();
  await prisma.order.deleteMany();
}

export async function disconnectDb() {
  await prisma.$disconnect();
}
