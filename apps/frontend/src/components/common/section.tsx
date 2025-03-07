import { PropsWithChildren } from 'react';

type SectionProps = {
  title: string;
  titleExtra?: React.ReactNode;
  action?: React.ReactNode;
};
export const Section: React.FC<PropsWithChildren<SectionProps>> = ({
  children,
  title,
  titleExtra,
  action,
}) => {
  return (
    <div>
      <section className="border-b border-b-gray-200 pb-4">
        <div className={'flex items-center justify-between'}>
          <div className="flex flex-col">
            <h3 className="text-base font-semibold text-primary">{title}</h3>
            {titleExtra && <div className="mt-1">{titleExtra}</div>}
          </div>
          {action}
        </div>
      </section>
      <div className="mt-4">{children}</div>
    </div>
  );
};
