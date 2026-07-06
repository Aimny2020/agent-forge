import { invoke } from '@tauri-apps/api/core';

import type { CommandFailure, HealthReport } from './types';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function isCommandFailure(value: unknown): value is CommandFailure {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof value.code === 'string' &&
    'message' in value &&
    typeof value.message === 'string'
  );
}

function normalizeError(error: unknown): AppError {
  if (isCommandFailure(error)) {
    return new AppError(
      error.code,
      error.message,
      typeof error.details === 'string' ? error.details : undefined,
    );
  }

  return new AppError('unknown_error', '发生未知错误，请重试。');
}

export async function getHealth(): Promise<HealthReport> {
  try {
    return await invoke<HealthReport>('health_check');
  } catch (error) {
    throw normalizeError(error);
  }
}
