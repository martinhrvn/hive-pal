import { useTranslation } from 'react-i18next';

/** Maps the `?error=` code Better Auth appends after a failed SSO round-trip. */
export const useSsoErrorMessage = (code: string | null): string => {
  const { t } = useTranslation('auth');
  if (!code) return '';
  switch (code) {
    case 'signup_disabled':
      return t('sso.errors.signupDisabled');
    case 'account_not_linked':
    case 'unable_to_link_account':
      return t('sso.errors.notLinked');
    case "email_doesn't_match":
      return t('sso.errors.emailMismatch');
    case 'account_already_linked_to_different_user':
      return t('sso.errors.alreadyLinked');
    case 'email_is_missing':
      return t('sso.errors.emailMissing');
    default:
      return t('sso.errors.generic');
  }
};
