"use client";
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import UserDashboard from '@/components/dashboard/UserDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

export default function DashboardTab() {
  const params = useParams();
  const { user, isAdmin, isInitializing } = useAppContext();
  const router = useRouter();

  const tabArray = params.tab || [];
  const tab = tabArray[0] || 'home';
  const subId = tabArray[1] || null;

  const adminOnlyTabs = React.useMemo(() => ['mediate', 'reviews', 'testimonials', 'courses'], []);
  const isUnauthorizedAdmin = adminOnlyTabs.includes(tab) && !isAdmin;

  React.useEffect(() => {
    if (isInitializing) return;

    if (!user) {
      router.push('/login');
    } else if (isUnauthorizedAdmin) {
      router.push('/dashboard/home');
    }
  }, [user, isAdmin, isInitializing, isUnauthorizedAdmin, router]);

  if (isInitializing || !user || isUnauthorizedAdmin) {
    return null;
  }

  return isAdmin ? <AdminDashboard activeTab={tab} subId={subId} /> : <UserDashboard activeTab={tab} subId={subId} />;
}
