import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { 
  CheckCircle, XCircle, Eye, ShieldCheck, MapPin, Briefcase, 
  GraduationCap, Clock, User, MessageSquare, AlertCircle, 
  Search, Filter, Calendar, DollarSign, Heart, Sparkles, BookOpen, Trash2, ShieldAlert,
  ChevronLeft, ChevronRight, Star, Quote, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const getPageNumbers = (currentPage, totalPages) => {
  const pages = [];
  const maxVisiblePages = 5;
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage <= 2) {
      end = 4;
    } else if (currentPage >= totalPages - 1) {
      start = totalPages - 3;
    }
    if (start > 2) {
      pages.push('...');
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages - 1) {
      pages.push('...');
    }
    pages.push(totalPages);
  }
  return pages;
};

export default function AdminReviewTab() {
  const { cvs, setCvs, showAlert, addNotification, userReviews } = useAppContext();
  const [reviewingCv, setReviewingCv] = useState(null);
  const [modalTab, setModalTab] = useState('personal'); // 'personal', 'profession', 'religious', 'criteria'
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved'

  const handleApprove = async (id, alias, userId) => {
    try {
      const { error } = await supabase.from('cv_profiles').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      
      setCvs(cvs.map(cv => cv.id === id ? { ...cv, status: 'approved' } : cv));
      showAlert('Disetujui', 'CV Berhasil Disetujui & Dipublikasikan', 'success');
      addNotification(`Alhamdulillah! CV Taaruf Anda (${alias}) telah disetujui ustadz dan kini aktif di galeri pencarian.`, userId);
      setReviewingCv(null);
    } catch (err) { 
      console.error(err);
      showAlert('Gagal', 'Gagal menyetujui CV.', 'error');
    }
  };

  const handleReject = async (id, alias, userId) => {
    try {
      const { error } = await supabase.from('cv_profiles').delete().eq('id', id);
      if (error) throw error;

      setCvs(cvs.filter(cv => cv.id !== id));
      showAlert('Ditolak', 'CV Berhasil Ditolak & Dihapus', 'success');
      addNotification(`Mohon maaf, CV Taaruf Anda (${alias}) belum dapat kami setujui saat ini. Silakan koreksi data Anda.`, userId);
      setReviewingCv(null);
    } catch (err) { 
      console.error(err);
      showAlert('Gagal', 'Gagal menolak CV.', 'error');
    }
  };

  const handleRetract = async (id, alias, userId) => {
    try {
      const { error } = await supabase.from('cv_profiles').update({ status: 'pending' }).eq('id', id);
      if (error) throw error;
      
      setCvs(cvs.map(cv => cv.id === id ? { ...cv, status: 'pending' } : cv));
      showAlert('Ditarik', 'CV berhasil dikembalikan ke antrean review.', 'success');
      addNotification(`CV Taaruf Anda (${alias}) telah ditarik kembali ke status review oleh admin.`, userId);
      setReviewingCv(null);
    } catch (err) { 
      console.error(err);
      showAlert('Gagal', 'Gagal menarik status CV.', 'error');
    }
  };

  // Stats calculation
  const totalCvsCount = cvs.length;
  const pendingCvsCount = cvs.filter(cv => cv.status === 'pending').length;
  const approvedCvsCount = cvs.filter(cv => cv.status === 'approved').length;

  // Filtered CVs
  const filteredCvs = useMemo(() => {
    return cvs.filter(cv => {
      // 1. Status Filter
      if (statusFilter !== 'all' && cv.status !== statusFilter) {
        return false;
      }
      // 2. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const aliasMatch = cv.alias?.toLowerCase().includes(query);
        const jobMatch = cv.job?.toLowerCase().includes(query);
        const locationMatch = cv.location?.toLowerCase().includes(query);
        const eduMatch = cv.education?.toLowerCase().includes(query);
        return aliasMatch || jobMatch || locationMatch || eduMatch;
      }
      return true;
    });
  }, [cvs, statusFilter, searchQuery]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(filteredCvs.length / itemsPerPage);

  const paginatedCvs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCvs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCvs, currentPage, itemsPerPage]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        .admin-stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .admin-stat-card {
          background: white;
          border: 1px solid #E4EDE8;
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .admin-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .admin-stat-value {
          font-size: 1.75rem;
          fontWeight: 900;
          color: #134E39;
          line-height: 1;
          margin-bottom: 4px;
        }
        .admin-stat-label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .admin-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
          background: white;
          padding: 1.25rem;
          border-radius: 16px;
          border: 1px solid #E4EDE8;
        }
        .search-container {
          position: relative;
          min-width: 280px;
          flex: 1;
        }
        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border-radius: 10px;
          border: 1px solid #E4EDE8;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s;
        }
        .search-input:focus {
          border-color: #134E39;
        }
        .filter-tabs {
          display: flex;
          gap: 6px;
          background: #F8FAF9;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #E4EDE8;
        }
        .filter-tab {
          border: none;
          background: transparent;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 800;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-tab.active {
          background: white;
          color: #134E39;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .admin-table-container {
          background: white;
          border: 1px solid #E4EDE8;
          border-radius: 16px;
          overflow: hidden;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table th {
          background: #F8FAF9;
          padding: 1rem 1.5rem;
          font-size: 0.75rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #E4EDE8;
        }
        .admin-table td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #F1F5F9;
          font-size: 0.9rem;
          color: #334155;
        }
        .admin-table tbody tr:hover {
          background: rgba(19, 78, 57, 0.01);
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .status-badge.pending {
          background: #FEFCE8;
          color: #A16207;
          border: 1px solid #FEF08A;
        }
        .status-badge.approved {
          background: #ECFDF5;
          color: #047857;
          border: 1px solid #A7F3D0;
        }
        .detail-tabs {
          display: flex;
          border-bottom: 1px solid #E2E8F0;
          margin-bottom: 1.5rem;
          gap: 1.5rem;
        }
        .detail-tab-btn {
          border: none;
          background: transparent;
          padding: 0.75rem 0.25rem;
          font-weight: 850;
          font-size: 0.85rem;
          color: #64748b;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        .detail-tab-btn.active {
          color: #134E39;
        }
        .detail-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: #134E39;
          border-radius: 99px;
        }
        .grid-data {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .data-item {
          background: #F8FAF9;
          padding: 1rem;
          border-radius: 10px;
          border: 1px solid #E4EDE8;
        }
        .data-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .data-value {
          font-weight: 700;
          color: #1C2B22;
          font-size: 0.95rem;
          line-height: 1.4;
        }
        .full-width-data {
          grid-column: 1 / -1;
        }
        
        .admin-desktop-table-view {
          display: block;
        }
        .admin-mobile-card-list-view {
          display: none;
        }
        
        @media (max-width: 768px) {
          .admin-desktop-table-view {
            display: none;
          }
          .admin-mobile-card-list-view {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding: 1rem 0.5rem;
          }
          .cv-review-mobile-card {
            background: white;
            border: 1px solid #E4EDE8;
            border-radius: 12px;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.01);
          }
          .cv-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .cv-avatar-title {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .cv-avatar {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: rgba(19, 78, 57, 0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            color: #134E39;
          }
          .cv-alias {
            font-weight: 800;
            color: #1e293b;
            font-size: 0.95rem;
          }
          .cv-meta {
            font-size: 0.75rem;
            color: #64748b;
            font-weight: 600;
            margin-top: 2px;
          }
          .cv-card-details {
            display: flex;
            flex-direction: column;
            gap: 8px;
            border-top: 1px solid #f1f5f9;
            border-bottom: 1px solid #f1f5f9;
            padding: 10px 0;
          }
          .cv-detail-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
          }
          .cv-label {
            color: #64748b;
            font-weight: 600;
          }
          .cv-val {
            color: #1e293b;
            font-weight: 700;
            text-align: right;
            max-width: 70%;
          }
          .cv-card-footer {
            display: flex;
            justify-content: flex-end;
          }
          .cv-detail-btn {
            background: #F0FDF4;
            color: #134E39;
            border: 1px solid #DCFCE7;
            padding: 0.65rem 1.25rem;
            border-radius: 8px;
            font-weight: 800;
            font-size: 0.8rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            width: 100%;
            justify-content: center;
            transition: all 0.2s;
          }
          .cv-detail-btn:hover {
            background: #DCFCE7;
          }
        }
      `}</style>

      {/* Stats Cards */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(19, 78, 57, 0.08)', color: '#134E39' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="admin-stat-value">{totalCvsCount}</div>
            <div className="admin-stat-label">Total CV Terdaftar</div>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(212, 175, 55, 0.08)', color: '#D4AF37' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="admin-stat-value">{pendingCvsCount}</div>
            <div className="admin-stat-label">Menunggu Review</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10B981' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="admin-stat-value">{approvedCvsCount}</div>
            <div className="admin-stat-label">Telah Disetujui</div>
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="admin-toolbar">
        <div className="search-container">
          <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan alias, pekerjaan, kota..." 
            className="search-input"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="filter-tabs">
          <button onClick={() => { setStatusFilter('all'); setCurrentPage(1); }} className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}>Semua CV</button>
          <button onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }} className={`filter-tab ${statusFilter === 'pending' ? 'active' : ''}`}>Menunggu Review ({pendingCvsCount})</button>
          <button onClick={() => { setStatusFilter('approved'); setCurrentPage(1); }} className={`filter-tab ${statusFilter === 'approved' ? 'active' : ''}`}>Telah Disetujui</button>
        </div>
      </div>

      {/* Main CVs Table */}
      <div className="admin-table-container">
        {filteredCvs.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="admin-desktop-table-view">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Kandidat (Alias)</th>
                    <th>Usia / Gender</th>
                    <th>Domisili</th>
                    <th>Pekerjaan & Pendidikan</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCvs.map(cv => (
                    <tr key={cv.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(19, 78, 57, 0.05)', display: 'flex', alignItems: 'center', justifyContext: 'center', fontWeight: '900', color: '#134E39', justifyContent: 'center' }}>
                            {cv.alias?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: '800', color: '#1E293B' }}>{cv.alias}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700' }}>{cv.age} Tahun</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize', fontWeight: '600' }}>{cv.gender}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700' }}>{cv.domisili_kota || cv.location?.split(',')[0]}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{cv.domisili_provinsi || 'Indonesia'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700' }}>{cv.job || 'Belum bekerja'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{cv.education}</div>
                      </td>
                      <td>
                        <span className={`status-badge ${cv.status}`}>
                          {cv.status === 'pending' ? 'Menunggu Review' : 'Telah Disetujui'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button 
                            onClick={() => { setReviewingCv(cv); setModalTab('personal'); }}
                            style={{ background: '#F0FDF4', color: '#134E39', border: '1px solid #DCFCE7', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={14} /> Detail Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="admin-mobile-card-list-view">
              {paginatedCvs.map(cv => (
                <div key={cv.id} className="cv-review-mobile-card">
                  <div className="cv-card-header">
                    <div className="cv-avatar-title">
                      <div className="cv-avatar">{cv.alias?.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="cv-alias">{cv.alias}</div>
                        <div className="cv-meta">{cv.age} Tahun • <span style={{ textTransform: 'capitalize' }}>{cv.gender}</span></div>
                      </div>
                    </div>
                    <span className={`status-badge ${cv.status}`} style={{ margin: 0 }}>
                      {cv.status === 'pending' ? 'Review' : 'Setuju'}
                    </span>
                  </div>
                  
                  <div className="cv-card-details">
                    <div className="cv-detail-row">
                      <span className="cv-label">Domisili</span>
                      <span className="cv-val">{cv.domisili_kota || cv.location?.split(',')[0]}, {cv.domisili_provinsi || 'Indonesia'}</span>
                    </div>
                    <div className="cv-detail-row">
                      <span className="cv-label">Pekerjaan</span>
                      <span className="cv-val">{cv.job || 'Belum bekerja'} ({cv.education})</span>
                    </div>
                  </div>
                  
                  <div className="cv-card-footer">
                    <button 
                      onClick={() => { setReviewingCv(cv); setModalTab('personal'); }}
                      className="cv-detail-btn"
                    >
                      <Eye size={14} /> Detail Review
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem', paddingBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); }}
                  disabled={currentPage === 1}
                  style={{ 
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '38px', height: '38px', borderRadius: '8px', border: '1px solid #e2e8f0', 
                    background: 'white', color: currentPage === 1 ? '#cbd5e1' : '#134E39', 
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' 
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                
                {getPageNumbers(currentPage, totalPages).map((page, idx) => {
                  if (page === '...') {
                    return (
                      <span 
                        key={`dots-${idx}`} 
                        style={{ 
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '38px', height: '38px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '800' 
                        }}
                      >
                        ...
                      </span>
                    );
                  }
                  const isActive = page === currentPage;
                  return (
                    <button
                      key={page}
                      onClick={() => { setCurrentPage(page); }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '38px', height: '38px', borderRadius: '8px', 
                        border: isActive ? '1px solid #134E39' : '1px solid #e2e8f0',
                        background: isActive ? '#134E39' : 'white',
                        color: isActive ? 'white' : '#134E39',
                        fontWeight: '800', fontSize: '0.85rem',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = '#f4f7f5';
                          e.currentTarget.style.borderColor = '#134E39';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }
                      }}
                    >
                      {page}
                    </button>
                  );
                })}

                <button 
                  onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                  disabled={currentPage === totalPages}
                  style={{ 
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '38px', height: '38px', borderRadius: '8px', border: '1px solid #e2e8f0', 
                    background: 'white', color: currentPage === totalPages ? '#cbd5e1' : '#134E39', 
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s' 
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F8FAF9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid #E4EDE8' }}>
              <ShieldAlert size={32} color="#64748b" />
            </div>
            <h3 style={{ fontWeight: '950', color: '#134E39', margin: '0 0 8px' }}>Tidak Ada CV Ditemukan</h3>
            <p style={{ color: '#64748b', margin: 0, fontWeight: '500', fontSize: '0.9rem' }}>Silakan sesuaikan filter status atau kata kunci pencarian Anda.</p>
          </div>
        )}
      </div>

      {/* Tabbed Interactive Detail Modal */}
      {reviewingCv && (
      <>
        <div className="modal-overlay" onClick={() => setReviewingCv(null)} style={{ zIndex: 10002 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', width: '95%', borderRadius: '20px', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '2rem', background: '#134E39', color: 'white', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
                <ShieldCheck size={20} color="#D4AF37" />
                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Detail Portofolio CV</span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '950', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                {reviewingCv.alias} 
                <span className={`status-badge ${reviewingCv.status}`} style={{ fontSize: '0.65rem', border: 'none', background: reviewingCv.status === 'pending' ? '#D4AF37' : '#10B981', color: 'white' }}>
                  {reviewingCv.status === 'pending' ? 'Menunggu Review' : 'Telah Disetujui'}
                </span>
              </h2>
              <button onClick={() => setReviewingCv(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', width: 40, height: 40, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                <XCircle size={24} />
              </button>
            </div>
            
            {/* Modal Content Tabs */}
            <div className="modal-body" style={{ padding: '2rem 2.5rem', textAlign: 'left', maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="detail-tabs">
                <button onClick={() => setModalTab('personal')} className={`detail-tab-btn ${modalTab === 'personal' ? 'active' : ''}`}>Profil & Karakter</button>
                <button onClick={() => setModalTab('profession')} className={`detail-tab-btn ${modalTab === 'profession' ? 'active' : ''}`}>Pendidikan & Keluarga</button>
                <button onClick={() => setModalTab('religious')} className={`detail-tab-btn ${modalTab === 'religious' ? 'active' : ''}`}>Keagamaan & Visi</button>
                <button onClick={() => setModalTab('criteria')} className={`detail-tab-btn ${modalTab === 'criteria' ? 'active' : ''}`}>Kriteria Pasangan</button>
              </div>

              {/* Tab Content: Personal & Character */}
              {modalTab === 'personal' && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <div className="grid-data">
                    <div className="data-item"><div className="data-label">Nama Alias</div><div className="data-value">{reviewingCv.alias}</div></div>
                    <div className="data-item"><div className="data-label">Jenis Kelamin</div><div className="data-value" style={{ textTransform: 'capitalize' }}>{reviewingCv.gender}</div></div>
                    <div className="data-item"><div className="data-label">Usia</div><div className="data-value">{reviewingCv.age} Tahun</div></div>
                    <div className="data-item"><div className="data-label">Suku Bangsa</div><div className="data-value">{reviewingCv.suku || '-'}</div></div>
                    <div className="data-item"><div className="data-label">Kota Asal / Domisili</div><div className="data-value">{reviewingCv.domisili_kota || reviewingCv.location}</div></div>
                    <div className="data-item"><div className="data-label">Provinsi Domisili</div><div className="data-value">{reviewingCv.domisili_provinsi || '-'}</div></div>
                    <div className="data-item"><div className="data-label">Status Pernikahan</div><div className="data-value">{reviewingCv.marital_status || 'Lajang'}</div></div>
                    <div className="data-item"><div className="data-label">Fisik (Tinggi / Berat)</div><div className="data-value">{reviewingCv.tinggi_badan ? `${reviewingCv.tinggi_badan} cm / ${reviewingCv.berat_badan} kg` : reviewingCv.tinggi_berat || '-'}</div></div>
                    <div className="data-item className=full-width-data" style={{ gridColumn: '1 / -1' }}><div className="data-label">Ciri Fisik Khusus</div><div className="data-value">{reviewingCv.ciri_fisik || '-'}</div></div>
                    <div className="data-item"><div className="data-label">Riwayat Kesehatan</div><div className="data-value">{reviewingCv.kesehatan || 'Sehat'}</div></div>
                    <div className="data-item"><div className="data-label">Hobi & Kegemaran</div><div className="data-value">{reviewingCv.hobi || '-'}</div></div>
                    <div className="data-item" style={{ gridColumn: '1 / -1' }}><div className="data-label">Karakter Positif</div><div className="data-value">{reviewingCv.karakter_positif || reviewingCv.karakter || '-'}</div></div>
                    <div className="data-item" style={{ gridColumn: '1 / -1' }}><div className="data-label">Karakter Negatif / Kekurangan</div><div className="data-value">{reviewingCv.karakter_negatif || '-'}</div></div>
                    <div className="data-item" style={{ gridColumn: '1 / -1' }}><div className="data-label">Hal-hal yang Disukai</div><div className="data-value">{reviewingCv.hal_disukai || '-'}</div></div>
                    <div className="data-item" style={{ gridColumn: '1 / -1' }}><div className="data-label">Hal-hal yang Dibenci</div><div className="data-value">{reviewingCv.hal_benci || '-'}</div></div>
                  </div>
                </div>
              )}

              {/* Tab Content: Profession & Education */}
              {modalTab === 'profession' && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <div className="grid-data">
                    <div className="data-item"><div className="data-label">Pendidikan Terakhir</div><div className="data-value">{reviewingCv.education || '-'}</div></div>
                    <div className="data-item" style={{ gridColumn: '1 / -1' }}><div className="data-label">Riwayat Pendidikan</div><div className="data-value" style={{ whiteSpace: 'pre-wrap' }}>{reviewingCv.riwayat_pendidikan || '-'}</div></div>
                    <div className="data-item"><div className="data-label">Pekerjaan Saat Ini</div><div className="data-value">{reviewingCv.job || '-'}</div></div>
                    <div className="data-item"><div className="data-label">Estimasi Pendapatan</div><div className="data-value">{reviewingCv.salary || '-'}</div></div>
                    <div className="data-item" style={{ gridColumn: '1 / -1' }}><div className="data-label">Pengalaman Kerja</div><div className="data-value" style={{ whiteSpace: 'pre-wrap' }}>{reviewingCv.pengalaman_kerja || '-'}</div></div>
                    
                    <div className="data-item" style={{ gridColumn: '1 / -1', background: '#FFFDF5', borderColor: '#FEF08A' }}>
                      <div className="data-label" style={{ color: '#A16207' }}>Keluarga & Orang Tua</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '8px' }}>
                        <div><div className="data-label">Kondisi Keluarga</div><div className="data-value" style={{ fontSize: '0.85rem' }}>{reviewingCv.kondisi_keluarga || '-'}</div></div>
                        <div><div className="data-label">Pekerjaan Orang Tua</div><div className="data-value" style={{ fontSize: '0.85rem' }}>{reviewingCv.pekerjaan_ortu || '-'}</div></div>
                        <div><div className="data-label">Posisi Anak</div><div className="data-value" style={{ fontSize: '0.85rem' }}>{reviewingCv.anak_ke_dari ? `Anak ke-${reviewingCv.anak_ke_dari}` : '-'}</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Religious & Vision */}
              {modalTab === 'religious' && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <div className="grid-data">
                    <div className="data-item" style={{ gridColumn: '1 / -1' }}><div className="data-label">Visi Pernikahan</div><div className="data-value" style={{ whiteSpace: 'pre-wrap' }}>{reviewingCv.marriage_vision || '-'}</div></div>
                    <div className="data-item" style={{ gridColumn: '1 / -1' }}><div className="data-label">Pandangan Hak & Ketaatan (Peran Suami/Istri)</div><div className="data-value" style={{ whiteSpace: 'pre-wrap' }}>{reviewingCv.role_view || '-'}</div></div>
                    <div className="data-item"><div className="data-label">Rencana Nafkah</div><div className="data-value">{reviewingCv.rencana_nafkah || '-'}</div></div>
                    <div className="data-item"><div className="data-label">Target Menikah</div><div className="data-value">{reviewingCv.target_menikah || '-'}</div></div>
                    <div className="data-item"><div className="data-label">Ketersediaan Poligami</div><div className="data-value">{reviewingCv.poligami || '-'}</div></div>
                    
                    <div className="data-item" style={{ gridColumn: '1 / -1', background: '#ECFDF5', borderColor: '#A7F3D0' }}>
                      <div className="data-label" style={{ color: '#047857' }}>Pemahaman Agama & Ibadah</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '8px' }}>
                        <div><div className="data-label">Ibadah Wajib</div><div className="data-value" style={{ fontSize: '0.85rem' }}>{reviewingCv.worship_wajib || reviewingCv.worship || '-'}</div></div>
                        <div><div className="data-label">Ibadah Sunnah</div><div className="data-value" style={{ fontSize: '0.85rem' }}>{reviewingCv.worship_sunnah || '-'}</div></div>
                        <div><div className="data-label">Kemampuan Baca Al-Qur'an</div><div className="data-value" style={{ fontSize: '0.85rem' }}>{reviewingCv.baca_quran || '-'}</div></div>
                        <div><div className="data-label">Kajian yang Diikuti</div><div className="data-value" style={{ fontSize: '0.85rem' }}>{reviewingCv.kajian || '-'}</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Partner Criteria */}
              {modalTab === 'criteria' && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <div className="grid-data">
                    <div className="data-item" style={{ gridColumn: '1 / -1' }}><div className="data-label">Harapan Terhadap Pasangan</div><div className="data-value" style={{ whiteSpace: 'pre-wrap' }}>{reviewingCv.harapan_pasangan || reviewingCv.about || '-'}</div></div>
                    <div className="data-item" style={{ gridColumn: '1 / -1' }}><div className="data-label">Kriteria Fisik Pasangan</div><div className="data-value" style={{ whiteSpace: 'pre-wrap' }}>{reviewingCv.kriteria_fisik || reviewingCv.criteria || '-'}</div></div>
                    <div className="data-item" style={{ gridColumn: '1 / -1' }}><div className="data-label">Kriteria Non-Fisik Pasangan</div><div className="data-value" style={{ whiteSpace: 'pre-wrap' }}>{reviewingCv.kriteria_non_fisik || '-'}</div></div>
                  </div>
                </div>
              )}
            </div>

              {/* ═══ DEDICATED REVIEW & KESAN BUTTON ═══ */}
              <div style={{
                margin: '0 2.5rem',
                padding: '1.5rem',
                border: '2px dashed rgba(212, 175, 55, 0.3)',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.03) 0%, rgba(19,78,57,0.02) 100%)',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(212,175,55,0.15)'
                  }}>
                    <Star size={18} color="#D4AF37" fill="#D4AF37" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: '#134E39' }}>Review & Kesan Kandidat</h4>
                    <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8', fontWeight: '600' }}>Pendapat jujur dari kandidat lainnya</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (reviewingCv?.user_id) {
                      window.location.href = `/dashboard/reviews/${reviewingCv.user_id}`;
                    }
                  }}
                  style={{
                    width: '100%', maxWidth: '320px',
                    padding: '0.75rem 1.5rem', borderRadius: '12px',
                    background: 'white', color: '#D4AF37',
                    border: '1.5px solid rgba(212,175,55,0.3)',
                    fontWeight: '900', fontSize: '0.75rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 4px 15px rgba(212,175,55,0.08)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.03em',
                    margin: '0 auto'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(212,175,55,0.15)';
                    e.currentTarget.style.borderColor = '#D4AF37';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(212,175,55,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)';
                  }}
                >
                  <Eye size={16} /> LIHAT REVIEW & KESAN
                </button>
              </div>
            
            {/* Modal Actions Footer */}
            <div style={{ padding: '2rem', display: 'flex', gap: '1rem', background: '#F8FAF9', borderTop: '1px solid #E4EDE8' }}>
              <button 
                onClick={() => handleReject(reviewingCv.id, reviewingCv.alias, reviewingCv.user_id)}
                style={{ flex: 1, background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', padding: '0.85rem', borderRadius: '12px', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
              >
                <XCircle size={18} /> Tolak & Hapus CV
              </button>
              
              {reviewingCv.status === 'approved' ? (
                <button 
                  onClick={() => handleRetract(reviewingCv.id, reviewingCv.alias, reviewingCv.user_id)}
                  style={{ flex: 2, background: '#FFFBEB', color: '#D97706', border: '1px solid #FCD34D', padding: '0.85rem', borderRadius: '12px', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FEF3C7'}
                  onMouseLeave={e => e.currentTarget.style.background = '#FFFBEB'}
                >
                  <AlertCircle size={18} /> Tarik (Jadikan Pending)
                </button>
              ) : (
                <button 
                  onClick={() => handleApprove(reviewingCv.id, reviewingCv.alias, reviewingCv.user_id)}
                  style={{ flex: 2, background: '#134E39', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '12px', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1E6B52'}
                  onMouseLeave={e => e.currentTarget.style.background = '#134E39'}
                >
                  <CheckCircle size={18} /> Setujui & Publish
                </button>
              )}
            </div>
          </div>
        </div>
      </>
      )}
    </div>
  );
}
