import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface TipItem {
  readonly title: string;
  readonly description: string;
}

interface TipsCardProps {
  readonly title: string;
  readonly description?: string;
  readonly icon?: React.ReactNode;
  readonly items: readonly TipItem[];
  readonly className?: string;
}

export function TipsCard({
  title,
  description,
  icon,
  items,
  className,
}: TipsCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          {items.map(item => (
            <div key={item.title}>
              <h4 className="font-semibold">{item.title}</h4>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
