'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Settings, BookOpen, GraduationCap, MessageSquare, Home, Award } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useCandidateProfile } from '@/context/CandidateProfileContext';
import styles from '@/styles/sidebar.module.scss';

const CandidateSidebar: React.FC = () => {
  const pathname = usePathname();
  const { profileUrl, userName } = useCandidateProfile();
  const { isExpanded, setIsExpanded } = useSidebar();

  const menuItems = [
    { icon: <BookOpen size={20} />, label: 'Courses', path: '/candidate/courses' },
    { icon: <GraduationCap size={20} />, label: 'My Courses', path: '/candidate/my-courses' },
    { icon: <Home size={20} />, label: 'Dashboard', path: '/candidate/dashboard' },
    { icon: <Award size={20} />, label: 'Certificates', path: '/candidate/certificates' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/candidate/settings' },
    { icon: <MessageSquare size={20} />, label: 'Contact Us', path: '/candidate/feedback' },
  ];

  return (
    <div className={`${styles.sidebarContainer} ${isExpanded ? '' : styles.isCollapsed}`}>
      {/* Toggle Button */}
      <div
        className={`${styles.sidebarToggle} ${isExpanded ? '' : styles.isCollapsed}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronLeft size={20} color="#fff" /> : <ChevronRight size={20} color="#fff" />}
      </div>

      {/* Sidebar Header */}
      <div className={styles.sidebarHeader}>
        {isExpanded && <div className={styles.sidebarBadge}>STUDENT</div>}
        <div className={styles.sidebarAvatar}>
          <img
            src={profileUrl || 'https://toppng.com//public/uploads/preview/donna-picarro-dummy-avatar-115633298255iautrofxa.png'}
            alt="User Avatar"
          />
        </div>
      </div>

      {/* Username */}
      <p className={styles.sidebarName}>{isExpanded && userName}</p>

      {/* Sidebar Menu */}
      <div className={styles.sidebarMenu}>
        {menuItems.map((item, index) => (
          <React.Fragment key={index}>
            <Link
              href={item.path}
              className={`${styles.sidebarItem} ${pathname === item.path ? styles.active : ''}`}
            >
              {item.icon}
              {isExpanded && <span>{item.label}</span>}
            </Link>
            {index < menuItems.length - 1 && <hr className={styles.divider} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CandidateSidebar;

