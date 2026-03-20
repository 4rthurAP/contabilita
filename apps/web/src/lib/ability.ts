import { createContext, useContext } from 'react';
import { createMongoAbility } from '@casl/ability';
import type { AppAbility } from '@contabilita/shared';

export const AbilityContext = createContext<AppAbility>(createMongoAbility());

export function useAppAbility(): AppAbility {
  return useContext(AbilityContext);
}
