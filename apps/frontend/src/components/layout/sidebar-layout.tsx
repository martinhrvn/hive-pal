import { PropsWithChildren } from 'react';

export const Page: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className={'grid md:grid-cols-3 grid-cols-1 gap-4'}>{children}</div>
  );
};

export const MainContent: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className={'md:col-span-2'}>{children}</div>;
};

export const Sidebar: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className={'col-span-1'}>{children}</div>;
};
