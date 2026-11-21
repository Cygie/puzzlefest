import { useEffect, useState } from 'react';

import { readStored, writeStored } from '@/shared/storage';

import {
  DEFAULT_SETTINGS,
  isSetupSettings,
  SETTINGS_KEY,
  SETTINGS_VERSION,
  type SetupSettings,
} from '../logic/setupSettings';

/** Setup settings, remembered between sessions in localStorage. */
export function useSetupSettings() {
  const [settings, setSettings] = useState<SetupSettings>(
    () => readStored(SETTINGS_KEY, SETTINGS_VERSION, isSetupSettings) ?? DEFAULT_SETTINGS,
  );

  useEffect(() => {
    writeStored(SETTINGS_KEY, SETTINGS_VERSION, settings);
  }, [settings]);

  const update = (changes: Partial<SetupSettings>) =>
    setSettings((current) => ({ ...current, ...changes }));

  return [settings, update] as const;
}
