'use client';

import NextLink from 'next/link';
import { notFound, useParams as useNextParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function stateKey(pathname) {
  return `aries11_next_nav_state:${pathname}`;
}

function saveState(pathname, state) {
  if (!state || typeof window === 'undefined') return;
  window.sessionStorage.setItem(stateKey(pathname), JSON.stringify(state));
}

function readState(pathname) {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(stateKey(pathname));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function Link({ to, href, state, onClick, children, ...props }) {
  const target = to || href || '#';
  return (
    <NextLink
      href={target}
      onClick={(event) => {
        saveState(typeof target === 'string' ? target : target.pathname, state);
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </NextLink>
  );
}

export function NavLink({ to, href, end = false, style, children, ...props }) {
  const pathname = usePathname();
  const target = to || href || '#';
  const targetPath = typeof target === 'string' ? target : target.pathname;
  const isActive = end ? pathname === targetPath : pathname === targetPath || pathname.startsWith(`${targetPath}/`);
  const resolvedStyle = typeof style === 'function' ? style({ isActive }) : style;
  return <Link to={targetPath} style={resolvedStyle} {...props}>{children}</Link>;
}

export function useNavigate() {
  const router = useRouter();
  return (to, options = {}) => {
    if (options.replace) {
      saveState(to, options.state);
      router.replace(to);
    } else {
      saveState(to, options.state);
      router.push(to);
    }
  };
}

export function useLocation() {
  const pathname = usePathname();
  const search = typeof window === 'undefined' ? '' : window.location.search;
  return {
    pathname,
    search,
    state: readState(pathname),
  };
}

export function useSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(() => (typeof window === 'undefined' ? '' : window.location.search));
  const writable = useMemo(() => new URLSearchParams(search.startsWith('?') ? search.slice(1) : search), [search]);
  const setParams = (nextParams, options = {}) => {
    const next = new URLSearchParams(nextParams);
    const url = next.toString() ? `${pathname}?${next.toString()}` : pathname;
    if (options.replace) {
      window.history.replaceState(null, '', url);
      setSearch(window.location.search);
    } else {
      router.push(url);
    }
  };
  return [writable, setParams];
}

export function useParams() {
  return useNextParams();
}

export function Navigate({ to, replace = false }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [replace, router, to]);
  return null;
}

export function Outlet() {
  return null;
}

export function BrowserRouter({ children }) {
  return children;
}

export function Routes({ children }) {
  return children;
}

export function Route() {
  return null;
}

export function redirectToNotFound() {
  notFound();
}
