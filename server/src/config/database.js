'use strict';

const { PrismaClient } = require('@prisma/client');
const { NODE_ENV } = require('./env');

const prisma = new PrismaClient({
  log: NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
