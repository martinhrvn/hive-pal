import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ListPaginationProps {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly onPageChange: (page: number) => void;
  readonly className?: string;
}

/** Previous / next pager for server-paginated admin lists. */
export function ListPagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: ListPaginationProps) {
  const { t } = useTranslation('common');
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav
      aria-label={t('pagination.label')}
      className={cn('flex items-center justify-end gap-2', className)}
    >
      <span className="mr-2 text-sm text-muted-foreground tabular-nums">
        {t('pagination.pageOf', { page, pages })}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" aria-hidden />
        {t('actions.previous')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        {t('actions.next')}
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </nav>
  );
}
