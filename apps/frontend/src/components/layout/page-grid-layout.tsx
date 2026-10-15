import { PropsWithChildren } from 'react';

// Page scaffold: a two-thirds MainContent beside a one-third PageAside on md+
// screens, stacked into a single column on mobile.
export const PageGrid: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className={'grid md:grid-cols-3 grid-cols-1 gap-4'}>{children}</div>
  );
};

export const MainContent: React.FC<PropsWithChildren> = ({ children }) => {
  // `min-w-0` lets this grid column shrink below its content's intrinsic width,
  // so a wide child (e.g. a table with many/optional columns) scrolls inside its
  // own `overflow-x-auto` container instead of pushing its last column off the
  // edge / under the aside.
  return <div className={'md:col-span-2 min-w-0'}>{children}</div>;
};

// The one-third aside column — page-level actions / secondary content.
export const PageAside: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className={'col-span-1 min-w-0'}>{children}</div>;
};

// Detail-page scaffold (hive, queen): a wide main column beside a narrower
// action sidebar on lg+ screens, stacked on smaller ones.
export const DetailGrid: React.FC<PropsWithChildren> = ({ children }) => (
  <div className="p-2 sm:p-4">
    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
      {children}
    </div>
  </div>
);

export const DetailMain: React.FC<PropsWithChildren> = ({ children }) => (
  <div className="min-w-0 lg:col-span-8 xl:col-span-9">{children}</div>
);

export const DetailAside: React.FC<PropsWithChildren> = ({ children }) => (
  <div className="min-w-0 space-y-4 lg:col-span-4 xl:col-span-3">
    {children}
  </div>
);
