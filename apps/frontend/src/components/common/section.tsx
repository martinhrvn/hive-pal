import { PropsWithChildren } from 'react';

type SectionProps = {
  title: string;
  action?: React.ReactNode;
};
export const Section: React.FC<PropsWithChildren<SectionProps>> = ({
  children,
  title,
  action,
}) => {
  return (
    <div>
      <section className="border-b border-b-gray-800 pb-5">
        <div className={'flex items-center justify-between'}>
          <h3 className="text-base font-semibold text-primary">{title}</h3>
          {action}
        </div>
      </section>
      <div className="mt-4">{children}</div>
    </div>
  );
};
