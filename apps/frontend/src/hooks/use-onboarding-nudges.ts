import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useApiary } from '@/hooks/use-apiary';

// Per-apiary localStorage flag so a nudge never re-fires once dismissed or
// acted on. The nudge also resolves naturally once its condition is met
// (location filled), so this only suppresses the "seen but not yet resolved"
// case.
const seenKey = (kind: string, apiaryId: string) => `nudge:${kind}:${apiaryId}`;
const hasSeen = (key: string) => localStorage.getItem(key) === 'true';
const markSeen = (key: string) => localStorage.setItem(key, 'true');

/**
 * Soft-onboarding nudges. Called once from the home page. Fires a persistent
 * Sonner toast per unmet, unseen condition. Each toast uses a stable `id` so
 * repeated renders update rather than stack it.
 *
 * Note: there is intentionally no "add your first hive" nudge here — the hive
 * list already renders a "No hives yet" empty state with its own CTA, so a
 * toast on top of that is redundant.
 */
export const useOnboardingNudges = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('onboarding');
  const { activeApiary, activeApiaryId } = useApiary();

  // Keys we dismiss programmatically (apiary switched, or condition met).
  // sonner fires `onDismiss` even for programmatic dismissals, so we track
  // these to avoid marking a still-unmet nudge as "seen" when it was only
  // hidden because the user navigated to a different apiary.
  const programmaticDismissals = useRef<Set<string>>(new Set());

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
      onDismiss: () => {
        // Ignore dismissals we triggered ourselves (see ref above).
        if (programmaticDismissals.current.delete(key)) return;
        markSeen(key);
      },
    });

    // Dismiss when the apiary changes / the location is filled in / on unmount,
    // so the toast never lingers on top of an apiary it no longer applies to.
    return () => {
      programmaticDismissals.current.add(key);
      toast.dismiss(key);
    };
  }, [activeApiary, activeApiaryId, navigate, t]);
};
