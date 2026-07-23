'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Layout } from './Layout';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active tab from pathname
  const getTabFromPath = (path: string) => {
    if (path === '/tasks') return 'tasks';
    if (path === '/calendar') return 'calendar';
    if (path === '/preferences') return 'preferences';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(pathname));

  useEffect(() => {
    setActiveTab(getTabFromPath(pathname));
  }, [pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'overview') router.push('/');
    else if (tab === 'tasks') router.push('/tasks');
    else if (tab === 'calendar') router.push('/calendar');
    else if (tab === 'preferences') router.push('/preferences');
  };

  // If on signin page, don't show sidebar layout
  if (pathname.startsWith('/auth/signin')) {
    return <>{children}</>;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={handleTabChange}>
      {children}
    </Layout>
  );
}
