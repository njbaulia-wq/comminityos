import { maskSensitiveData } from './masking';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogPayload {
  level?: LogLevel;
  module: string;
  action?: string;
  message: string;
  requestId?: string;
  organizationId?: string;
  userId?: string;
  context?: Record<string, unknown>;
  error?: unknown;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function getCurrentMinLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
  if (envLevel && LOG_LEVEL_PRIORITY[envLevel]) {
    return envLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function serializeError(err: unknown): Record<string, unknown> | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(err as unknown as Record<string, unknown>),
    };
  }
  return { message: String(err) };
}

function writeLog(level: LogLevel, payload: LogPayload): void {
  const minLevel = getCurrentMinLevel();
  if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[minLevel]) {
    return;
  }

  try {
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      module: payload.module,
      message: payload.message,
    };

    if (payload.action) entry.action = payload.action;
    if (payload.requestId) entry.requestId = payload.requestId;
    if (payload.organizationId) entry.organizationId = payload.organizationId;
    if (payload.userId) entry.userId = payload.userId;

    if (payload.context !== undefined) {
      entry.context = maskSensitiveData(payload.context);
    }

    if (payload.error !== undefined) {
      entry.error = serializeError(payload.error);
    }

    const serialized = JSON.stringify(entry) + '\n';

    if (level === 'error') {
      process.stderr.write(serialized);
    } else {
      process.stdout.write(serialized);
    }
  } catch (serializationErr) {
    // Fail-safe emergency fallback
    const fallback = `{"timestamp":"${new Date().toISOString()}","level":"error","module":"logger","message":"Failed to serialize log entry"}\n`;
    process.stderr.write(fallback);
  }
}

export const logger = {
  debug: (payload: Omit<LogPayload, 'level'>) => writeLog('debug', payload),
  info: (payload: Omit<LogPayload, 'level'>) => writeLog('info', payload),
  warn: (payload: Omit<LogPayload, 'level'>) => writeLog('warn', payload),
  error: (payload: Omit<LogPayload, 'level'>) => writeLog('error', payload),
};
