import { HeadContent, Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import '../index.css';

export const Route = createRootRouteWithContext()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: 'Checkers Game',
      },
      {
        name: 'description',
        content: 'Checkers Game',
      },
    ],
    links: [
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <Outlet />
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
