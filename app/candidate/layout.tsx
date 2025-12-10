'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider } from '@/context/SidebarContext';
import { CandidateProfileProvider } from '@/context/CandidateProfileContext';
import CandidateSidebar from '@/components/CandidateSidebar';
import CandidateNavbar from '@/components/CandidateNavbar';

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSignInPage = pathname === '/candidate';

  return (
    <SidebarProvider>
      <CandidateProfileProvider>
        {!isSignInPage && <CandidateNavbar />}
        {!isSignInPage && <CandidateSidebar />}
        <div className={isSignInPage ? '' : 'ml-[280px] mr-6 mt-[90px] mb-6'}>
          {children}
        </div>
      </CandidateProfileProvider>
    </SidebarProvider>
  );
}

