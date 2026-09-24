import * as winston from 'winston';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, service, requestId, stack, ...meta }) => {
  const reqPart = requestId ? ` [${requestId}]` : '';
  const servicePart = service ? `[${service}]` : '';
  const metaPart = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const stackPart = stack ? `\n${stack}` : '';
  return `${timestamp} ${level} ${servicePart}${reqPart}: ${message}${metaPart}${stackPart}`;
});

export function createServiceLogger(serviceName: string): winston.Logger {
  const isProduction = process.env.NODE_ENV === 'production';

  return winston.createLogger({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    defaultMeta: { service: serviceName },
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      errors({ stack: true }),
      isProduction ? json() : combine(colorize(), consoleFormat)
    ),
    transports: [
      new winston.transports.Console()
    ]
  });
}
