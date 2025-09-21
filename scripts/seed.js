const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.slip.create({
    data: {
      code: 'SLIP-TEST-001',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      metadata: { source: 'seed' }
    }
  });
  console.log('Created SLIP-TEST-001');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
