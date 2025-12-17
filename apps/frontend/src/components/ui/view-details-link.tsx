import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewDetailsLinkProps = {
  to: string;
  children: React.ReactNode;
  className?: string;
};

export const ViewDetailsLink: React.FC<ViewDetailsLinkProps> = ({
  to,
  children,
  className,
}) => {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline',
        className,
      )}
    >
      {children}
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
};
