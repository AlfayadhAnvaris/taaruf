import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { 
  BookOpen, LayoutDashboard, FileText, Activity, 
  MessageSquare, Settings, Sparkles, ChevronRight
} from 'lucide-react';
import CourseManagerTab from '../components/dashboard/CourseManagerTab';
import AdminHomeTab from '../components/dashboard/AdminHomeTab';
import AdminReviewTab from '../components/dashboard/AdminReviewTab';
import AdminMediateTab from '../components/dashboard/AdminMediateTab';
import AdminFeedbackTab from '../components/dashboard/AdminFeedbackTab';
import AdminReviewsTab from '../components/dashboard/AdminReviewsTab';
import AdminAccountTab from '../components/dashboard/AdminAccountTab';
import AdminTestimonialsTab from '../components/dashboard/AdminTestimonialsTab';
import AdminVerificationTab from '../components/dashboard/AdminVerificationTab';

export default function AdminDashboard() {
  const { user, showAlert } = useContext(AppContext);
  const { tab } = useParams();
  const activeTab = tab || 'home';
  const isAdminAcademy = activeTab === 'courses';
  const adminName = user?.name || 'Ustadz';

  const getTabTitle = () => {
    switch(activeTab) {
      case 'home': return 'Dashboard Utama';
      case 'mediate': return 'Mediasi & Chat';
      case 'courses': return 'Manajemen Academy';
      case 'feedback': return 'Saran & Masukan';
      case 'reviews': return 'Log Review & Komentar';
      case 'testimonials': return 'Manajemen Testimoni';
      case 'admin': return 'Pengaturan Admin';
      default: return 'Portal Admin';
    }
  };

  return (
    <div style={{ animation: 'dashboardFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)', padding: '0.5rem' }}>
      {/* 🟢 PREMIUM PORTAL HEADER 🟢 */}
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
        {activeTab === 'mediate' && <AdminMediateTab />}
        {activeTab === 'courses' && <CourseManagerTab />}
        {activeTab === 'feedback' && <AdminFeedbackTab showAlert={showAlert} />}
        {activeTab === 'reviews' && <AdminReviewsTab showAlert={showAlert} />}
        {activeTab === 'testimonials' && <AdminTestimonialsTab showAlert={showAlert} />}
        {activeTab === 'admin' && <AdminAccountTab user={user} showAlert={showAlert} />}
      </div>

      <style>{`
        .admin-portal-header {
          margin-bottom: 2.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
        }
        .admin-welcome-text {
          font-size: 2.25rem;
          font-weight: 900;
          color: #134E39;
          margin: 0;
          letter-spacing: -0.03em;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .admin-subtitle {
          color: #64748b;
          font-weight: 500;
          font-size: 1rem;
          margin-top: 6px;
          max-width: 600px;
          line-height: 1.6;
        }
        
        @media (max-width: 768px) {
          .admin-portal-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .admin-welcome-text {
            font-size: 1.5rem;
            flex-wrap: wrap;
          }
          .admin-sparkle { width: 20px; height: 20px; }
          .admin-subtitle {
            font-size: 0.85rem;
          }
        }

        @keyframes dashboardFadeIn {
          from { opacity: 0; filter: blur(4px); }
          to { opacity: 1; filter: blur(0); }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes contentFloat {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 1280px) {
          .xl-flex { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
