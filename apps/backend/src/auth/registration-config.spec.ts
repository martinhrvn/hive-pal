import { isRegistrationDisabled } from './registration-config';
import { buildEnvConfig } from '../env.controller';

describe('isRegistrationDisabled', () => {
  it('keeps registration open by default', () => {
    expect(isRegistrationDisabled({})).toBe(false);
    expect(isRegistrationDisabled({ DISABLE_REGISTRATION: '' })).toBe(false);
  });

  it.each(['true', 'TRUE', '1', 'yes', 'on'])(
    'closes registration for %s',
    (value) => {
      expect(isRegistrationDisabled({ DISABLE_REGISTRATION: value })).toBe(
        true,
      );
    },
  );

  it('keeps registration open for false', () => {
    expect(isRegistrationDisabled({ DISABLE_REGISTRATION: 'false' })).toBe(
      false,
    );
  });
});

describe('buildEnvConfig registration flag', () => {
  it('reports registration as enabled by default', () => {
    expect(buildEnvConfig({}).VITE_REGISTRATION_ENABLED).toBe('true');
  });

  it('reports registration as disabled when DISABLE_REGISTRATION is set', () => {
    expect(
      buildEnvConfig({ DISABLE_REGISTRATION: 'true' })
        .VITE_REGISTRATION_ENABLED,
    ).toBe('false');
  });
});
