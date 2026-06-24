"use client";
import React from 'react';
import { 
  BookOpen, LayoutDashboard, FileText, Activity, 
  MessageSquare, Settings, Sparkles, ChevronRight
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import dynamic from 'next/dynamic';
import CourseManagerTab from './CourseManagerTab';
const AdminHomeTab = dynamic(() => import('./AdminHomeTab'), { ssr: false });
import AdminMediateTab from './AdminMediateTab';
const AdminFeedbackTab = dynamic(() => import('./AdminFeedbackTab'), { ssr: false });
import AdminReviewsTab from './AdminReviewsTab';
import AdminAccountTab from './AdminAccountTab';
import AdminTestimonialsTab from './AdminTestimonialsTab';
import AdminReviewTab from './AdminReviewTab';
import AdminReportsTab from './AdminReportsTab';

export default function AdminDashboard({ activeTab }) {
  const { user, showAlert } = useAppContext();
  const isAdminAcademy = activeTab === 'courses';
  const adminName = user?.name || 'Ustadz';

  const getTabTitle = () => {
    switch(activeTab) {
      case 'home': return 'Dashboard Utama';
      case 'cv_review': return 'Review CV Baru';
      case 'mediate': return 'Mediasi & Chat';
      case 'courses': return 'Manajemen Academy';
      case 'feedback': return 'Saran & Masukan';
      case 'reviews': return 'Log Review & Komentar';
      case 'reports': return 'Laporan Pelanggaran';
      case 'testimonials': return 'Manajemen Testimoni';
      case 'admin': return 'Pengaturan Admin';
      default: return 'Portal Admin';
    }
  };

  return (
    <div className="admin-dashboard-container" style={{ animation: 'dashboardFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)', padding: '0.5rem' }}>
      {!isAdminAcademy && (
        <div className="admin-portal-header">
          <div style={{ animation: 'slideRight 0.8s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
               <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#134E39', opacity: 0.6 }}>ADMIN PORTAL</span>
               <ChevronRight size={14} color="#134E39" style={{ opacity: 0.4 }} />
               <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#134E39' }}>{getTabTitle().toUpperCase()}</span>
            </div>
            
            {activeTab === 'home' && (
              <>
                <h2 className="admin-welcome-text">
                  Ahlan wa Sahlan, {adminName}
                </h2>
                <p className="admin-subtitle">
                  Pantau ringkasan data, pertumbuhan kandidat, dan statistik pendaftar Separuh Agama secara real-time.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ animation: 'contentFloat 0.8s ease' }}>
        {activeTab === 'home' && <AdminHomeTab />}
        {activeTab === 'cv_review' && <AdminReviewTab />}
        {activeTab === 'mediate' && <AdminMediateTab />}
        {activeTab === 'courses' && <CourseManagerTab />}
        {activeTab === 'feedback' && <AdminFeedbackTab />}
        {activeTab === 'reviews' && <AdminReviewsTab />}
        {activeTab === 'reports' && <AdminReportsTab showAlert={showAlert} />}
        {activeTab === 'testimonials' && <AdminTestimonialsTab />}
        {activeTab === 'admin' && <AdminAccountTab />}
      </div>
    </div>
  );
}
