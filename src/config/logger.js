import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';
const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  base: { service: 'automation-hub' },
  transport: !isProd
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard', singleLine: false },
      }
    : undefined,
});

export default logger;
