'use strict';

const { PrismaClient } = require('@prisma/client');
const { NODE_ENV } = require('./env');

const prisma = new PrismaClient({
  log: NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
});

const prismaWithRetry = prisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        const maxRetries = 2;
        let lastErr = null;
        for (let i = 0; i <= maxRetries; i++) {
          try {
            return await query(args);
          } catch (err) {
            lastErr = err;
            if (err.message && (err.message.includes('Closed') || err.message.includes('pool'))) {
              console.warn(`[Prisma] Connection error on ${model}.${operation}, retrying (${i + 1}/${maxRetries})...`);
              if (i === maxRetries) throw err;
              await new Promise(res => setTimeout(res, 500));
            } else {
              throw err;
            }
          }
        }
        throw lastErr;
      }
    }
  }
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prismaWithRetry;
