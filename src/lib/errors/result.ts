import { AppError, ValidationError } from './index';
import { logger } from '../logger';

export interface ActionErrorPayload {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId: string;
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionErrorPayload };

const GENERIC_INTERNAL_ERROR_MESSAGE =
  'Terjadi kesalahan internal pada sistem. Silakan coba beberapa saat lagi.';

export function successResult<T>(data: T): ActionResult<T> {
  return {
    success: true,
    data,
  };
}

export function errorResult(error: unknown, requestId: string): ActionResult<never> {
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        fieldErrors: error.fieldErrors,
        requestId,
      },
    };
  }

  if (error instanceof AppError && error.isOperational) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        requestId,
      },
    };
  }

  // Non-operational or untrusted error: NEVER leak technical details to user
  return {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: GENERIC_INTERNAL_ERROR_MESSAGE,
      requestId,
    },
  };
}

export interface HandleServiceErrorParams {
  error: unknown;
  module: string;
  action?: string;
  requestId: string;
  organizationId?: string;
  userId?: string;
}

export function handleServiceError(params: HandleServiceErrorParams): ActionResult<never> {
  logger.error({
    module: params.module,
    action: params.action,
    requestId: params.requestId,
    organizationId: params.organizationId,
    userId: params.userId,
    message: params.error instanceof Error ? params.error.message : 'Service error occurred',
    error: params.error,
  });

  return errorResult(params.error, params.requestId);
}
