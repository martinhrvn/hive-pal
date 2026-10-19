import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, ClipboardPlus, ScanLine, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QrScannerDialog } from './qr-scanner-dialog';

interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
  show?: boolean;
}

export const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const getContextualActions = (): FABAction[] => {
    const actions: FABAction[] = [];

    // Always show these three main actions
    actions.push(
      {
        id: 'add-inspection',
        label: t('fab.addInspection'),
        icon: <ClipboardPlus className="h-4 w-4" />,
        onClick: () => {
          navigate('/inspections/create');
          setIsOpen(false);
        },
        color: 'bg-blue-600 hover:bg-blue-700',
      },
      {
        id: 'schedule-inspection',
        label: t('actions.scheduleInspection'),
        icon: <Calendar className="h-4 w-4" />,
        onClick: () => {
          navigate('/inspections/schedule');
          setIsOpen(false);
        },
        color: 'bg-purple-600 hover:bg-purple-700',
      },
      {
        id: 'add-actions',
        label: t('navigation.actions'),
        icon: <Plus className="h-4 w-4" />,
        onClick: () => {
          navigate('/actions/bulk');
          setIsOpen(false);
        },
        color: 'bg-green-600 hover:bg-green-700',
      },
      {
        id: 'scan-qr-code',
        label: t('qrScanner.title'),
        icon: <ScanLine className="h-4 w-4" />,
        onClick: () => {
          setScannerOpen(true);
          setIsOpen(false);
        },
        color: 'bg-amber-600 hover:bg-amber-700',
      },
    );

    return actions;
  };

  const actions = getContextualActions();

  return (
    <>
      <QrScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} />

      {/* Backdrop: a click outside closes the menu */}
      {isOpen && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="fixed inset-0 bg-black/20 md:bg-transparent z-40 cursor-default"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        data-testid="fab"
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none"
      >
        {/* Action buttons */}
        <div
          data-testid="fab-actions"
          inert={!isOpen}
          className={cn(
            'flex flex-col items-end gap-3 mb-3 bg-background/95 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-border transition-all duration-300',
            isOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none',
          )}
        >
          {actions.map((action, index) => (
            <div
              key={action.id}
              className={cn(
                'transform transition-all duration-300 ease-out',
                isOpen
                  ? 'translate-y-0 opacity-100 scale-100'
                  : 'translate-y-4 opacity-0 scale-95 pointer-events-none',
              )}
              style={{
                transitionDelay: isOpen
                  ? `${index * 75}ms`
                  : `${(actions.length - index - 1) * 50}ms`,
              }}
            >
              <div className="flex items-center justify-end gap-3">
                <span className="text-sm font-medium whitespace-nowrap text-foreground">
                  {action.label}
                </span>
                <Button
                  size="sm"
                  className={cn(
                    'h-12 w-12 rounded-full shadow-lg border-0',
                    action.color || 'bg-primary hover:bg-primary/90',
                  )}
                  aria-label={action.label}
                  onClick={action.onClick}
                >
                  {action.icon}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Main FAB button */}
        <Button
          className={cn(
            'h-14 w-14 rounded-full shadow-lg transition-all duration-300 pointer-events-auto',
            'bg-primary hover:bg-primary/90',
            isOpen && 'rotate-45',
          )}
          aria-label={t(isOpen ? 'fab.close' : 'fab.open')}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(open => !open)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </div>
    </>
  );
};
