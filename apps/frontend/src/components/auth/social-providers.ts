import type { ComponentType, SVGProps } from 'react';
import { FacebookIcon } from '@/components/icons/facebook-icon';
import { GoogleIcon } from '@/components/icons/google-icon';
import type { SocialProviderId } from '@/lib/auth-config';

interface SocialProvider {
  /** Brand name; not translated. */
  name: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Sign-in button colours from the provider's branding guidelines. */
  buttonClassName: string;
}

export const SOCIAL_PROVIDERS: Record<SocialProviderId, SocialProvider> = {
  google: {
    name: 'Google',
    Icon: GoogleIcon,
    buttonClassName: 'bg-white text-gray-800 hover:bg-gray-100',
  },
  facebook: {
    name: 'Facebook',
    Icon: FacebookIcon,
    buttonClassName: 'bg-[#1877F2] text-white hover:bg-[#166FE5]',
  },
};
