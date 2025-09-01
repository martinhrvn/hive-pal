import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Calendar, 
  ClipboardPlus,
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const navigate = useNavigate();

  const getContextualActions = (): FABAction[] => {
    const actions: FABAction[] = [];
    
    // Always show these three main actions
    actions.push(
      {
        id: 'add-inspection',
        label: 'Add Inspection',
        icon: <ClipboardPlus className="h-4 w-4" />,
        onClick: () => {
          navigate('/inspections/create');
          setIsOpen(false);
        },
        color: 'bg-blue-600 hover:bg-blue-700',
      },
      {
        id: 'schedule-inspection',
        label: 'Schedule Inspection',
        icon: <Calendar className="h-4 w-4" />,
        onClick: () => {
          navigate('/inspections/schedule');
          setIsOpen(false);
        },
        color: 'bg-purple-600 hover:bg-purple-700',
      },
      {
        id: 'add-actions',
        label: 'Add Actions',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => {
          navigate('/actions/bulk');
          setIsOpen(false);
        },
        color: 'bg-green-600 hover:bg-green-700',
      }
    );

    return actions;
  };

  const actions = getContextualActions();

  const handleMainClick = () => {
    if (actions.length === 1) {
      actions[0].onClick();
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleBackdropClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 md:bg-transparent z-40"
          onClick={handleBackdropClick}
        />
      )}
      
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Action buttons */}
        <div className="flex flex-col items-end gap-3 mb-3">
          {actions.map((action, index) => (
            <div
              key={action.id}
              className={cn(
                "transform transition-all duration-300 ease-out",
                isOpen && actions.length > 1
                  ? "translate-y-0 opacity-100 scale-100" 
                  : "translate-y-4 opacity-0 scale-95 pointer-events-none"
              )}
              style={{
                transitionDelay: isOpen ? `${index * 75}ms` : `${(actions.length - index - 1) * 50}ms`
              }}
            >
              <div className="flex items-center justify-end gap-3">
                <span className="bg-black/80 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap hidden md:block">
                  {action.label}
                </span>
                <Button
                  size="sm"
                  className={cn(
                    "h-12 w-12 rounded-full shadow-lg border-0",
                    action.color || "bg-primary hover:bg-primary/90"
                  )}
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
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
            "bg-primary hover:bg-primary/90",
            isOpen && actions.length > 1 && "rotate-45"
          )}
          onClick={handleMainClick}
        >
          {isOpen && actions.length > 1 ? (
            <X className="h-6 w-6" />
          ) : actions.length === 1 ? (
            actions[0].icon
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </div>
    </>
  );
};