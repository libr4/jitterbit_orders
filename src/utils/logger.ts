import { inspect } from 'util';

const env = process.env.NODE_ENV || 'development';

type LogMeta = Record<string, unknown> | undefined;

function format(level: string, msg: string, meta?: LogMeta) {
  if (env === 'development') {
    const time = new Date().toISOString();
    const metaStr = meta ? inspect(meta, { depth: null, colors: true }) : '';
    // Human-friendly console output in dev
    return `${time} [${level.toUpperCase()}] ${msg} ${metaStr}`;
  }

  // Structured JSON for production and CI
  const entry: any = {
    timestamp: new Date().toISOString(),
    level,
    message: msg
  };
  if (meta) entry.meta = meta;
  return JSON.stringify(entry);
}

function output(line: string) {
  // Use console methods as the final sink, but keep usage centralized here
  // so no other file calls console directly.
  // eslint-disable-next-line no-console
  console.log(line);
}

const logger = {
  debug: (msg: string, meta?: LogMeta) => output(format('debug', msg, meta)),
  info: (msg: string, meta?: LogMeta) => output(format('info', msg, meta)),
  warn: (msg: string, meta?: LogMeta) => output(format('warn', msg, meta)),
  error: (msg: string, meta?: LogMeta) => output(format('error', msg, meta))
};

export default logger;
