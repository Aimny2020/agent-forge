import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}));

import { AppError, getHealth } from './tauriClient';

describe('tauriClient', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('returns a typed health report', async () => {
    invokeMock.mockResolvedValue({
      version: '0.1.0',
      platform: 'macos',
      database: 'ready',
      ready: true,
    });

    await expect(getHealth()).resolves.toEqual({
      version: '0.1.0',
      platform: 'macos',
      database: 'ready',
      ready: true,
    });
    expect(invokeMock).toHaveBeenCalledWith('health_check');
  });

  it('maps command failures to AppError', async () => {
    invokeMock.mockRejectedValue({
      code: 'database_unavailable',
      message: '本地数据库暂时不可用，请重试。',
      details: 'file is locked',
    });

    const failure = await getHealth().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({
      code: 'database_unavailable',
      message: '本地数据库暂时不可用，请重试。',
      details: 'file is locked',
    });
  });
});
