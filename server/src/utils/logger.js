'use strict';

const winston = require('winston');
const { NODE_ENV } = require('../config/env');

const formats = [
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
];

const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'warn' : 'debug',
  format: NODE_ENV === 'production'
    ? winston.format.combine(...formats, winston.format.json())
    : winston.format.combine(...formats, winston.format.colorize(), winston.format.printf(
        ({ timestamp, level, message, stack }) =>
          stack ? `${timestamp} ${level}: ${message}\n${stack}` : `${timestamp} ${level}: ${message}`
      )),
  transports: [
    new winston.transports.Console(),
    ...(NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

module.exports = logger;
