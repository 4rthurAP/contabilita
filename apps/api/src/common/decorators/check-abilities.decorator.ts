import { SetMetadata } from '@nestjs/common';
import type { AppAction, AppSubject } from '@contabilita/shared';

export type RequiredAbility = [AppAction, AppSubject];

export const ABILITIES_KEY = 'check_abilities';

/**
 * Decorator que define as abilities CASL necessarias para acessar o endpoint.
 * Usado junto com AbilitiesGuard.
 *
 * @example @CheckAbilities(['create', 'Account'], ['update', 'Account'])
 */
export const CheckAbilities = (...abilities: RequiredAbility[]) =>
  SetMetadata(ABILITIES_KEY, abilities);
