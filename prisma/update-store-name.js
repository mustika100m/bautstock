const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.storeSetting.updateMany({
    data: {
      storeName: 'MUSTIKA BAUT',
    },
  });
  console.log('Successfully updated database storeName to MUSTIKA BAUT!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
