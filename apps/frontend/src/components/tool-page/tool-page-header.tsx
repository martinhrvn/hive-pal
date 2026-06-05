import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BackLink {
  readonly to: string;
  readonly label: string;
}

interface ToolPageHeaderProps {
  readonly title: string;
  readonly eyebrow?: string;
  readonly badge?: React.ReactNode;
  readonly description?: string;
  readonly intro?: string;
  readonly backLink?: BackLink;
  readonly className?: string;
}

export function ToolPageHeader({
  title,
  eyebrow,
  badge,
  description,
  intro,
  backLink,
  className = 'mb-6',
}: ToolPageHeaderProps) {
  return (
    <div className={className}>
      {backLink && (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-3 h-auto px-2 py-1"
          asChild
        >
          <Link to={backLink.to}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLink.label}
          </Link>
        </Button>
      )}
      {eyebrow && (
        <Badge variant="outline" className="mb-2">
          {eyebrow}
        </Badge>
      )}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {badge}
      </div>
      {description && (
        <p className="mt-2 text-muted-foreground">{description}</p>
      )}
      {intro && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {intro}
        </p>
      )}
    </div>
  );
}
