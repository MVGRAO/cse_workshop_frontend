'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider } from '@/context/SidebarContext';
import EmployerSidebar from '@/components/EmployerSidebar';
import EmployerNavbar from '@/components/EmployerNavbar';

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSignInPage = pathname === '/employer';

  return (
    <SidebarProvider>
      {!isSignInPage && <EmployerNavbar />}
      {!isSignInPage && <EmployerSidebar />}
      <div className={isSignInPage ? '' : 'ml-[280px] mr-6 mt-[90px] mb-6'}>
        {children}
      </div>
    </SidebarProvider>
  );
}

