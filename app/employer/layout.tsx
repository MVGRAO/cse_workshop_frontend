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

  const hideLayout =
    pathname === '/employer' ||                          // Sign-in page
    pathname === '/employer/privacy-policy' ||
    pathname === '/employer/terms' ||
    pathname === '/employer/request';

  return (
   <SidebarProvider>
      {!hideLayout && <EmployerNavbar />}
      {!hideLayout && <EmployerSidebar />}
      <div className={hideLayout ? 'min-h-screen bg-gray-50' : 'ml-[280px] mt-[80px] p-8'}>
        {children}
      </div>
    </SidebarProvider>
  );
}


