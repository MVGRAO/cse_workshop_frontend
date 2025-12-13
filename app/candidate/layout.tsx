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
  // Hide sidebar when student is taking a course (course player page)
  const isCoursePlayerPage = pathname?.match(/^\/candidate\/courses\/[^/]+$/);

  return (
    <SidebarProvider>
      <CandidateProfileProvider>
        {!isSignInPage && !isCoursePlayerPage && <CandidateNavbar />}
        {!isSignInPage && !isCoursePlayerPage && <CandidateSidebar />}
        <div className={isSignInPage || isCoursePlayerPage ? '' : 'ml-[280px] mr-6 mt-[90px] mb-6'}>
          {children}
        </div>
      </CandidateProfileProvider>
    </SidebarProvider>
  );
}

