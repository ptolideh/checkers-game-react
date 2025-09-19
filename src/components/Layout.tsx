import React from 'react';
import type { PropsWithChildren } from 'react';

const CONTAINER_WIDTH = 'w-full sm:max-w-lg mx-auto px-3 sm:px-4';

const Layout = React.memo<PropsWithChildren>(({ children }) => {
  const logoNode = (
    <>
      <div className="flex items-center">
        <span
          aria-hidden="true"
          className="relative z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500"
        />
        <span
          aria-hidden="true"
          className="relative -left-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-950"
        />
      </div>
      <h1 className="-ml-4 text-xl font-semibold tracking-wide select-none">Checkers</h1>
    </>
  );

  return (
    <div className="flex flex-1 flex-col h-full w-full bg-slate-800/95">
      <header className="flex bg-slate-800/90 text-white shadow h-[4rem] fixed z-100 w-full backdrop-blur">
        <div className={`${CONTAINER_WIDTH} flex items-center justify-center gap-3 py-4`}>
          {logoNode}
        </div>
      </header>
      <main
        className={`${CONTAINER_WIDTH} flex flex-col justify-center items-center pt-[calc(4rem+1.5rem)] pb-16  h-auto min-h-screen gap-6 `}
      >
        {children}
      </main>
    </div>
  );
});

export { Layout };
