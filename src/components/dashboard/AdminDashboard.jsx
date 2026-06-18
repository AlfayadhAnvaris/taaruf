"use client";
import React from 'react';
import { 
  BookOpen, LayoutDashboard, FileText, Activity, 
  MessageSquare, Settings, Sparkles, ChevronRight
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import CourseManagerTab from './CourseManagerTab';
import AdminHomeTab from './AdminHomeTab';
import AdminMediateTab from './AdminMediateTab';
import AdminFeedbackTab from './AdminFeedbackTab';
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
    <div style={{ animation: 'dashboardFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)', padding: '0.5rem' }}>
      {!isAdminAcademy && (
        <div className="admin-portal-header">
          <div style={{ animation: 'slideRight 0.8s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
               <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#134E39', opacity: 0.6 }}>ADMIN PORTAL</span>
               <ChevronRight size={14} color="#134E39" style={{ opacity: 0.4 }} />
               <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#134E39' }}>{getTabTitle().toUpperCase()}</span>
            </div>
            
            <h2 className="admin-welcome-text">
              Ahlan wa Sahlan, {adminName}
            </h2>
            <p className="admin-subtitle">
              {activeTab === 'home' && 'Pantau ringkasan data, pertumbuhan kandidat, dan statistik pendaftar Separuh Agama secara real-time.'}
              {activeTab === 'mediate' && 'Fasilitasi proses taaruf dengan memantau dan memoderasi ruang obrolan mediasi yang aktif.'}
              {activeTab === 'feedback' && 'Evaluasi saran, masukan, dan ide pengembangan platform dari para pengguna.'}
              {activeTab === 'reviews' && 'Pantau dan moderasi ulasan serta komentar yang diberikan antar kandidat untuk menjaga adab.'}
              {activeTab === 'testimonials' && 'Kelola cerita sukses dan testimoni dari para kandidat yang telah berhasil melalui platform Separuh Agama.'}
              {activeTab === 'admin' && 'Kelola identitas profil, kata sandi, dan parameter keamanan akun administrator Anda.'}
            </p>
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
