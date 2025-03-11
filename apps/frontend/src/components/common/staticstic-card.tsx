import React from 'react';
type StatisticCardProps = {
  title: string;
  value: React.ReactNode;
  afterValue?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  emphasized?: boolean;
};
export const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  afterValue,
  icon,
  emphasized,
}) => {
  return (
    <div
      className={`flex border shadow-sm p-4 rounded-md hover:border-accent items-center gap-4 ${emphasized ? 'border-amber-400 bg-amber-50 shadow-lg' : ''}`}
    >
      <div>{icon}</div>
      <div className={'flex flex-col justify-center'}>
        <span className={'text-sm text text-muted-foreground'}>{title}</span>
        <div className={'wrap-none'}>
          <span className={'text-4xl font-bold'}>{value}</span>
          <span className={'text-sm text-muted-foreground/80'}>
            {afterValue}
          </span>
        </div>
      </div>
    </div>
  );
};
