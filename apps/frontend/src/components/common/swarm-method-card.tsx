import { ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type SwarmMethodCardProps = Readonly<{
  title: string;
  description: string;
  badge: React.ReactNode;
  icon: React.ReactNode;
  disabled?: boolean;
  detail?: string;
  cta: string;
  onClick?: () => void;
  className?: string;
}>;

export function SwarmMethodCard({
  title,
  description,
  badge,
  icon,
  disabled = false,
  detail,
  cta,
  onClick,
  className,
}: SwarmMethodCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {badge}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={detail ? 'space-y-4' : undefined}>
        {detail && (
          <p className="text-sm text-muted-foreground">{detail}</p>
        )}
        <Button
          variant={disabled ? 'outline' : 'default'}
          disabled={disabled}
          onClick={onClick}
        >
          {disabled && <Lock className="mr-2 h-4 w-4" />}
          {cta}
          {!disabled && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  );
}
