import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}));

import {
  AppError,
  checkSkillUpdates,
  getCodeWorkModules,
  getCodeWorkSharedFiles,
  getHarnessPresets,
  getHealth,
  inspectSkillImport,
  trustSkill,
  updateSkill,
} from './tauriClient';

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

  it('uses package lifecycle command payloads', async () => {
    invokeMock.mockResolvedValue([]);
    await checkSkillUpdates();
    expect(invokeMock).toHaveBeenLastCalledWith('check_skill_updates');

    invokeMock.mockResolvedValue({ skill_id: 'pack' });
    await updateSkill('pack');
    expect(invokeMock).toHaveBeenLastCalledWith('update_skill', { skillId: 'pack' });

    invokeMock.mockResolvedValue(undefined);
    await trustSkill('pack');
    expect(invokeMock).toHaveBeenLastCalledWith('trust_skill', { skillId: 'pack' });

    invokeMock.mockResolvedValue({ name: 'Pack', member_count: 5 });
    await inspectSkillImport('https://github.com/example/pack', 'git');
    expect(invokeMock).toHaveBeenLastCalledWith('inspect_skill_import', {
      source: 'https://github.com/example/pack',
      importType: 'git',
    });
  });

  it('loads the backend-owned Harness preset registry', async () => {
    invokeMock.mockResolvedValue([]);

    await expect(getHarnessPresets()).resolves.toEqual([]);
    expect(invokeMock).toHaveBeenCalledWith('get_harness_presets');
  });

  it('loads the backend-owned Code Work module registry', async () => {
    invokeMock.mockResolvedValue([]);

    await expect(getCodeWorkModules()).resolves.toEqual([]);
    expect(invokeMock).toHaveBeenCalledWith('get_code_work_modules');
  });

  it('loads the backend-owned Code Work shared file library', async () => {
    invokeMock.mockResolvedValue([]);

    await expect(getCodeWorkSharedFiles()).resolves.toEqual([]);
    expect(invokeMock).toHaveBeenCalledWith('get_code_work_shared_files');
  });
});
