import React, { useContext } from 'react';
import { AppContext } from '../App';
import { BookOpen, LayoutDashboard, FileText, Activity } from 'lucide-react';
import CourseManagerTab from '../components/dashboard/CourseManagerTab';
import AdminHomeTab from '../components/dashboard/AdminHomeTab';
import AdminReviewTab from '../components/dashboard/AdminReviewTab';
import AdminMediateTab from '../components/dashboard/AdminMediateTab';

export default function AdminDashboard({ activeTab, setActiveTab }) {
  const { user } = useContext(AppContext);
  const adminName = user?.name || 'Ustadz';

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          Ahlan wa Sahlan, {adminName}!
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          {activeTab === 'home' && 'Ringkasan data dan statistik pendaftar Mawaddah.'}
          {activeTab === 'review' && 'Evaluasi dan validasi CV yang masuk dari para kandidat.'}
          {activeTab === 'mediate' && 'Pantau dan moderasi ruang obrolan mediasi taaruf.'}
          {activeTab === 'courses' && 'Kelola materi belajar dan kuis untuk para kandidat.'}
        </p>
      </div>

      {/* Tab Content */}
      {activeTab === 'home' && <AdminHomeTab />}
      
      {activeTab === 'review' && <AdminReviewTab />}

      {activeTab === 'mediate' && <AdminMediateTab />}

      {activeTab === 'courses' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} /> Manajemen Kursus LMS
            </h3>
          </div>
          <CourseManagerTab />
        </div>
      )}
    </div>
  );
}
