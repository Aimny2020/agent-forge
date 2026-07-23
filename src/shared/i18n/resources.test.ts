import { describe, expect, it } from 'vitest';

import { resources } from './resources';

function leafKeys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === 'object' && child !== null
      ? leafKeys(child as Record<string, unknown>, path)
      : [path];
  });
}

describe('i18n resources', () => {
  it('keeps Chinese and English translation keys aligned', () => {
    expect(leafKeys(resources['zh-CN'].translation).sort())
      .toEqual(leafKeys(resources.en.translation).sort());
  });
});
