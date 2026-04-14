export type UserRole = 'listener' | 'radio_admin' | 'super_admin';

export const ROLES = {
  LISTENER: 'listener',
  RADIO_ADMIN: 'radio_admin',
  SUPER_ADMIN: 'super_admin',
} as const;