import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useApiary } from '@/hooks/use-apiary';
import { useHives } from '@/api/hooks';

// Per-apiary localStorage flag so a nudge never re-fires once dismissed or
// acted on. The nudge also resolves naturally once its condition is met
// (location filled / hive created), so this only suppresses the "seen but
// not yet resolved" case.
const seenKey = (kind: string, apiaryId: string) => `nudge:${kind}:${apiaryId}`;
const hasSeen = (key: string) => localStorage.getItem(key) === 'true';
const markSeen = (key: string) => localStorage.setItem(key, 'true');

/**
 * Soft-onboarding nudges. Called once from the home page. Fires a persistent
 * Sonner toast per unmet, unseen condition. Each toast uses a stable `id` so
 * repeated renders update rather than stack it.
 */
export const useOnboardingNudges = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('onboarding');
  const { activeApiary, activeApiaryId } = useApiary();
  const { data: hives, isLoading: hivesLoading } = useHives();

  // Nudge: add a location so weather updates can be fetched.
  useEffect(() => {
    if (!activeApiary || !activeApiaryId) return;
    if (activeApiary.latitude != null) return;
    const key = seenKey('apiary-location', activeApiaryId);
    if (hasSeen(key)) return;

    toast(t('nudges.addLocation.title'), {
      id: key,
      duration: Infinity,
      description: t('nudges.addLocation.description'),
      action: {
        label: t('nudges.addLocation.action'),
        onClick: () => {
          markSeen(key);
          navigate(`/apiaries/${activeApiaryId}/edit`);
        },
      },
      onDismiss: () => markSeen(key),
    });
  }, [activeApiary, activeApiaryId, navigate, t]);

  // Nudge: add the first hive.
  useEffect(() => {
    if (!activeApiary || !activeApiaryId || hivesLoading) return;
    if (!hives || hives.length > 0) return;
    const key = seenKey('add-hive', activeApiaryId);
    if (hasSeen(key)) return;

    toast(t('nudges.addHive.title'), {
      id: key,
      duration: Infinity,
      description: t('nudges.addHive.description'),
      action: {
        label: t('nudges.addHive.action'),
        onClick: () => {
          markSeen(key);
          navigate('/hives/create');
        },
      },
      onDismiss: () => markSeen(key),
    });
  }, [activeApiary, activeApiaryId, hives, hivesLoading, navigate, t]);
};
