import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { BookOpen, LayoutDashboard, FileText, Activity } from 'lucide-react';
import CourseManagerTab from '../components/dashboard/CourseManagerTab';
import AdminHomeTab from '../components/dashboard/AdminHomeTab';
import AdminReviewTab from '../components/dashboard/AdminReviewTab';
import AdminMediateTab from '../components/dashboard/AdminMediateTab';
import AdminFeedbackTab from '../components/dashboard/AdminFeedbackTab';
import AdminAccountTab from '../components/dashboard/AdminAccountTab';
import { MessageSquare, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const { user, showAlert } = useContext(AppContext);
  const { tab } = useParams();
  const activeTab = tab || 'home';
  const isAdminAcademy = activeTab === 'courses';
  const adminName = user?.name || 'Ustadz';

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Portal Header */}
      {!isAdminAcademy && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Ahlan wa Sahlan, {adminName}!
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {activeTab === 'home' && 'Ringkasan data dan statistik pendaftar Mawaddah Match.'}
            {activeTab === 'mediate' && 'Pantau dan moderasi ruang obrolan mediasi taaruf.'}
            {activeTab === 'feedback' && 'Lihat saran, masukan, dan laporan bug dari para pengguna.'}
            {activeTab === 'admin' && 'Kelola identitas publik dan keamanan akun administrator Anda.'}
          </p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'home' && <AdminHomeTab />}
      
      {activeTab === 'mediate' && <AdminMediateTab />}

      {activeTab === 'courses' && (
        <CourseManagerTab />
      )}

      {activeTab === 'feedback' && <AdminFeedbackTab showAlert={showAlert} />}

      {activeTab === 'admin' && <AdminAccountTab user={user} showAlert={showAlert} />}
    </div>
  );
}
