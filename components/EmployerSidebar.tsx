'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Settings, BookOpen, CheckCircle, MessageSquare, Home } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { getCurrentUser, getAuthToken } from '@/lib/api';
import styles from '@/styles/sidebar.module.scss';

const EmployerSidebar: React.FC = () => {
  const pathname = usePathname();
  const { isExpanded, setIsExpanded } = useSidebar();
  const [userName, setUserName] = useState('Verifier');
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = getAuthToken('verifier');
        if (!token) {
          return;
        }
        const user = await getCurrentUser('verifier');
        if (user?.data) {
          setUserName(user.data.name || 'Verifier');
          setProfileUrl(user.data.avatarUrl || '');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  const menuItems = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/employer/dashboard' },
    { icon: <BookOpen size={20} />, label: 'Courses', path: '/employer/courses' },
    { icon: <CheckCircle size={20} />, label: 'Verification', path: '/employer/verification' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/employer/settings' },
    { icon: <MessageSquare size={20} />, label: 'Contact Us', path: '/employer/contact' },
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
        {isExpanded && <div className={styles.sidebarBadge} style={{ backgroundColor: '#10b981' }}>VERIFIER</div>}
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

export default EmployerSidebar;


