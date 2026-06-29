import { HelpCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

/**
 * Builds an `FAQPage` schema.org node from the same items shown on the page.
 * Google requires FAQ structured data to match visible content, so the visible
 * `ToolFaq` and this JSON-LD must always be generated from one source.
 */
export function buildFaqJsonLd(items: readonly FaqItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

interface ToolFaqProps {
  readonly title: string;
  readonly items: readonly FaqItem[];
  readonly icon?: React.ReactNode;
  readonly className?: string;
}

/**
 * Visible FAQ section for tool pages. Renders unique, indexable prose and pairs
 * with `buildFaqJsonLd` for matching structured data.
 */
export function ToolFaq({
  title,
  items,
  icon,
  className = 'mt-4',
}: ToolFaqProps) {
  if (items.length === 0) return null;
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon ?? <HelpCircle className="h-5 w-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          {items.map(item => (
            <div key={item.question}>
              <dt className="text-sm font-semibold">{item.question}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
