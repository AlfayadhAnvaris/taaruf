import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { 
  Search, Filter, MapPin, Mail, ChevronLeft, ChevronRight, 
  Users, UserCheck, Eye, FileText, CheckCircle, XCircle, AlertCircle,
  Clock, Heart, User, Briefcase, GraduationCap, Globe, Ruler, Activity, ShieldCheck
} from 'lucide-react';
import { supabase } from '../supabase';
import AdminReportsTab from '../components/dashboard/AdminReportsTab';

export default function ManageUsersPage() {
  const { usersDb, cvs, setUsersDb, showAlert } = useContext(AppContext);
  const [activeSubTab, setActiveSubTab] = useState('users'); // 'users' or 'reports'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterEducation, setFilterEducation] = useState('all');
  const [filterAge, setFilterAge] = useState('all');
  const [filterProvince, setFilterProvince] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingUser, setViewingUser] = useState(null);
  const itemsPerPage = 5;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Merge User Data with CV data for rich display
  const usersWithCv = useMemo(() => {
    return usersDb.map(u => {
      const userCv = cvs.find(c => c.user_id === u.id);
      
      // Robust completeness check
      const hasCv = !!userCv;
      const hasGender = userCv?.gender && userCv.gender !== 'unknown';
      const hasLocation = userCv?.location && userCv.location !== '- , -' && userCv.location !== '';
      const hasBasicInfo = userCv?.age && userCv?.education;
      
      const trulyComplete = u.profile_complete && hasCv && hasGender && hasLocation && hasBasicInfo;

      return {
        ...u,
        gender: userCv?.gender || 'unknown',
        location: userCv?.location || '- , -',
        education: userCv?.education || null,
        age: userCv?.age || null,
        isTrulyComplete: trulyComplete,
        hasCvRecord: hasCv
      };
    });
  }, [usersDb, cvs]);

  // Combined Filtering
  const filteredUsers = useMemo(() => {
    return usersWithCv.filter(u => {
      // Hanya tampilkan pendaftar (user), bukan sesama admin
      if (u.role === 'admin') return false;

      const matchSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGender = filterGender === 'all' || u.gender === filterGender;
      const matchEdu = filterEducation === 'all' || u.education === filterEducation;
      
      // Age Filter Logic
      let matchAge = true;
      if (filterAge !== 'all' && u.age) {
        const age = parseInt(u.age);
        if (filterAge === '<25') matchAge = age < 25;
        else if (filterAge === '25-30') matchAge = age >= 25 && age <= 30;
        else if (filterAge === '31-35') matchAge = age >= 31 && age <= 35;
        else if (filterAge === '36-40') matchAge = age >= 36 && age <= 40;
        else if (filterAge === '>40') matchAge = age > 40;
      } else if (filterAge !== 'all' && !u.age) {
        matchAge = false;
      }

      // Province Filter Logic
      const matchProvince = filterProvince === 'all' || u.location?.toLowerCase().includes(filterProvince.toLowerCase());

      return matchSearch && matchGender && matchEdu && matchAge && matchProvince;
    });
  }, [usersWithCv, searchTerm, filterGender, filterEducation, filterAge, filterProvince]);

  // Pagination Logic
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (user) => {
    if (!user.isTrulyComplete) {
      return (
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '6px', 
          background: '#fef2f2', color: '#991b1b', padding: '8px 16px', 
          borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #fee2e2' 
        }}>
          <AlertCircle size={14} /> BELUM LENGKAP
        </div>
      );
    }
    return (
      <div style={{ 
        display: 'inline-flex', alignItems: 'center', gap: '6px', 
        background: '#f0fdf4', color: '#166534', padding: '8px 16px', 
        borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #bbf7d0' 
      }}>
        <CheckCircle size={14} /> LENGKAP
      </div>
    );
  };

  // Helper for CV Data Items
  const CvDataItem = ({ Icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(212,175,55,0.08)', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '1rem', fontWeight: '900', color: '#1e293b' }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div className="manage-users-container" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      {/* 🟢 PREMIUM PORTAL HEADER 🟢 */}
      <div className="admin-portal-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
        <div style={{ animation: 'slideRight 0.8s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
             <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#134E39', opacity: 0.6 }}>ADMIN PORTAL</span>
             <ChevronRight size={14} color="#134E39" style={{ opacity: 0.4 }} />
             <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#134E39' }}>MANAJEMEN PENGGUNA</span>
          </div>
          
          <h2 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#134E39', margin: 0, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Ahlan wa Sahlan, Admin
          </h2>
          <p style={{ color: '#64748b', fontWeight: '500', fontSize: '1rem', marginTop: '6px', maxWidth: '600px', lineHeight: '1.6' }}>
            {activeSubTab === 'users' 
              ? 'Kelola seluruh basis data pendaftar, pantau kelengkapan profil, dan lakukan verifikasi data kandidat secara menyeluruh.'
              : 'Pantau laporan pelanggaran yang dikirimkan oleh user terhadap kandidat lainnya.'}
          </p>
        </div>
      </div>

      {/* 🧭 NAVIGATION TABS 🧭 */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1px' }}>
         <button 
           onClick={() => setActiveSubTab('users')}
           style={{ 
             padding: '1rem 2rem', border: 'none', background: 'none', 
             color: activeSubTab === 'users' ? '#134E39' : '#94a3b8',
             fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer',
             borderBottom: activeSubTab === 'users' ? '3px solid #134E39' : '3px solid transparent',
             transition: 'all 0.3s'
           }}
         >
           DAFTAR PENGGUNA ({usersWithCv.filter(u => u.role !== 'admin').length})
         </button>
         <button 
           onClick={() => setActiveSubTab('reports')}
           style={{ 
             padding: '1rem 2rem', border: 'none', background: 'none', 
             color: activeSubTab === 'reports' ? '#ef4444' : '#94a3b8',
             fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer',
             borderBottom: activeSubTab === 'reports' ? '3px solid #ef4444' : '3px solid transparent',
             transition: 'all 0.3s'
           }}
         >
           LAPORAN PELANGGARAN
         </button>
      </div>

      {activeSubTab === 'users' ? (
        <>
          {/* 🟢 FILTER BAR SECTION 🟢 */}
          <div style={{ 
            background: 'white', border: '1px solid #f1f5f9', borderRadius: '24px', 
            padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '12px', 
            flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' 
          }}>
            <select 
              className="premium-select"
              style={{ flex: 1, minWidth: '160px' }}
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
            >
              <option value="all">Semua Gender</option>
              <option value="ikhwan">Ikhwan</option>
              <option value="akhwat">Akhwat</option>
            </select>

            <select 
              className="premium-select"
              style={{ flex: 1, minWidth: '160px' }}
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
            >
              <option value="all">Semua Usia</option>
              <option value="<25">&lt; 25 Tahun</option>
              <option value="25-30">25 - 30 Tahun</option>
              <option value="31-35">31 - 35 Tahun</option>
              <option value="36-40">36 - 40 Tahun</option>
              <option value=">40">&gt; 40 Tahun</option>
            </select>
            
            <select 
              className="premium-select"
              style={{ flex: 1, minWidth: '160px' }}
              value={filterEducation}
              onChange={(e) => setFilterEducation(e.target.value)}
            >
              <option value="all">Pendidikan</option>
              <option value="S1">Sarjana (S1)</option>
              <option value="S2">Magister (S2)</option>
              <option value="S3">Doktor (S3)</option>
              <option value="SMA/SMK">SMA/SMK</option>
            </select>

            <select 
              className="premium-select"
              style={{ flex: 1, minWidth: '160px' }}
              value={filterProvince}
              onChange={(e) => setFilterProvince(e.target.value)}
            >
              <option value="all">Provinsi</option>
              <option value="Jakarta">DKI Jakarta</option>
              <option value="Jawa Barat">Jawa Barat</option>
              <option value="Jawa Tengah">Jawa Tengah</option>
              <option value="Jawa Timur">Jawa Timur</option>
              <option value="Banten">Banten</option>
              <option value="Yogyakarta">DI Yogyakarta</option>
              <option value="Luar Jawa">Luar Pulau Jawa</option>
            </select>

            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Cari nama atau kota..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', padding: '0.9rem 1rem 0.9rem 3.2rem', borderRadius: '16px', 
                  border: '1.5px solid #f1f5f9', background: '#f8fafc', outline: 'none', 
                  fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', transition: 'all 0.2s'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#134E39'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(19,78,57,0.05)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* 🟢 LIST TABLE SECTION 🟢 */}
          <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1.5px solid #f8fafc' }}>
                   <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pengguna</th>
                   <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: isMobile ? 'right' : 'left' }}>
                     {isMobile ? 'DETAIL' : 'Detail Kontak'}
                   </th>
                   {!isMobile && (
                     <>
                       <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Status</th>
                       <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Aksi</th>
                     </>
                   )}
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user, idx) => (
                  <tr 
                    key={user.id} 
                    className="row-hover" 
                    onClick={() => setViewingUser(user)}
                    style={{ borderBottom: '1px solid #f8fafc', transition: 'all 0.2s', cursor: 'pointer' }}
                  >
                    <td style={{ padding: '1.75rem 2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ 
                          width: '52px', height: '52px', borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', 
                          color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.1rem', fontWeight: '900', flexShrink: 0
                        }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '900', color: '#1e293b', fontSize: '1.05rem', marginBottom: '2px' }}>{user.name}</div>
                          {user.age && <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>{user.age}</div>}
                          <div style={{ 
                            display: 'inline-flex', padding: '4px 10px', 
                            background: user.gender === 'ikhwan' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(236, 72, 153, 0.1)',
                            color: user.gender === 'ikhwan' ? '#0ea5e9' : '#ec4899',
                            borderRadius: '8px', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em'
                          }}>
                            {user.gender || 'Bukan Pendaftar'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: isMobile ? '1rem' : '1.75rem 2rem' }}>
                      {isMobile ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setViewingUser(user); }}
                            style={{ 
                              width: '40px', height: '40px', borderRadius: '12px', border: '1.5px solid #134E39', 
                              background: 'transparent', color: '#134E39', display: 'flex', alignItems: 'center', 
                              justifyContent: 'center', cursor: 'pointer'
                            }}
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>
                            <MapPin size={15} style={{ opacity: 0.6 }} /> {user.location}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '500' }}>
                            <Mail size={15} style={{ opacity: 0.6 }} /> {user.email}
                          </div>
                        </div>
                      )}
                    </td>
                    {!isMobile && (
                      <>
                        <td style={{ padding: '1.75rem 2rem', textAlign: 'center' }}>
                          {getStatusBadge(user)}
                        </td>
                        <td style={{ padding: '1.75rem 2rem', textAlign: 'right' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setViewingUser(user); }}
                              style={{ 
                                width: '44px', height: '44px', borderRadius: '12px', border: '1.5px solid #134E39', 
                                background: 'transparent', color: '#134E39', display: 'flex', alignItems: 'center', 
                                justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', marginLeft: 'auto'
                              }} 
                              className="action-view-btn"
                              title="Lihat Detail"
                            >
                              <Eye size={20} />
                            </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 🟢 FOOTER / PAGINATION SECTION 🟢 */}
            <div className="manage-users-footer">
              <div className="footer-stats">
                Menampilkan <span className="stat-highlight">{startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalUsers)}</span> dari <span className="stat-highlight">{totalUsers}</span> User
              </div>

              <div className="pagination-controls">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => { setCurrentPage(currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="pagination-btn arrow-btn"
                >
                  Sebelumnya
                </button>

                <div className="page-numbers-wrapper">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Logic to show fewer pages on mobile
                    const isNearCurrent = Math.abs(pageNum - currentPage) <= 1;
                    const isEdge = pageNum === 1 || pageNum === totalPages;
                    
                    if (!isNearCurrent && !isEdge && totalPages > 5) {
                       if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="pagination-ellipsis">...</span>;
                       return null;
                    }

                    return (
                      <button 
                        key={pageNum}
                        onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={`pagination-btn num-btn ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => { setCurrentPage(currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="pagination-btn arrow-btn"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <AdminReportsTab showAlert={showAlert} setViewingUser={setViewingUser} usersDb={usersDb} />
      )}

      {/* 🟢 USER DETAIL MODAL 🟢 */}
      {viewingUser && (
        <div className="modal-overlay" onClick={() => setViewingUser(null)}>
          <div className="modal-content user-detail-modal" onClick={e => e.stopPropagation()}>
             {/* Header Section */}
             <div className="detail-modal-header" style={{ padding: '2rem 2.5rem', background: '#134E39', position: 'relative' }}>
                 <div className="header-badge" style={{ display: 'inline-block', background: '#D4AF37', color: '#134E39', padding: '4px 12px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '900', marginBottom: '1.25rem' }}>
                    DATA CV TAARUF
                 </div>
                 
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="header-text">
                       <h2 style={{ fontSize: '2.25rem', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
                          {viewingUser.name} <span style={{ fontSize: '1.5rem', opacity: 0.7, fontWeight: '700' }}>({viewingUser.gender === 'ikhwan' ? 'Ikhwan' : 'Akhwat'})</span>
                       </h2>
                       
                       <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', color: 'white' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
                             <MapPin size={16} color="#D4AF37" /> <span style={{ textTransform: 'uppercase' }}>{viewingUser.location}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
                             <Clock size={16} color="#D4AF37" /> {viewingUser.age || '--'} TAHUN
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
                             <Heart size={16} color="#D4AF37" /> LAJANG
                          </div>
                       </div>
                    </div>
                    
                    <div className="detail-profile-icon" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                       <User size={48} />
                    </div>
                 </div>
                 
                 <button onClick={() => setViewingUser(null)} className="close-modal-btn" style={{ top: '1.5rem', right: '1.5rem' }}>
                    <XCircle size={24} />
                 </button>
              </div>

              {/* Body Section */}
              <div className="detail-modal-body" style={{ padding: '2.5rem', background: 'white' }}>
                 {(() => {
                    const userCv = cvs.find(c => c.user_id === viewingUser.id);
                    if (!userCv) return (
                      <div className="profile-alert incomplete">
                         <AlertCircle size={20} />
                         <span>User ini belum melengkapi profil kandidat. Detail CV belum tersedia.</span>
                      </div>
                    );

                    return (
                      <div className="cv-modern-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                         {/* LEFT COL: DATA PRIBADI */}
                         <div className="cv-left-col">
                            <div style={{ 
                               borderLeft: '4px solid #D4AF37', paddingLeft: '1rem', marginBottom: '2rem' 
                            }}>
                               <h3 style={{ fontSize: '0.85rem', fontWeight: '900', color: '#134E39', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Data Pribadi</h3>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                               <CvDataItem Icon={Briefcase} label="Pekerjaan" value={userCv.job || '-'} />
                               <CvDataItem Icon={GraduationCap} label="Pendidikan" value={viewingUser.education || '-'} />
                               <CvDataItem Icon={Globe} label="Suku Bangsa" value={userCv.tribe || '-'} />
                               <CvDataItem Icon={Ruler} label="Tinggi / Berat" value={`${userCv.height || '-'}/${userCv.weight || '-'}`} />
                               <CvDataItem Icon={Activity} label="Kesehatan" value={userCv.health_history || '-'} />
                               <CvDataItem Icon={Heart} label="Hobi" value={userCv.hobby || '-'} />
                            </div>
                         </div>
                         
                         {/* RIGHT COL: CARDS */}
                         <div className="cv-right-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="cv-bubble-card" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: '#D4AF37' }}>
                                  <Heart size={16} fill="#D4AF37" /> <span style={{ fontSize: '0.75rem', fontWeight: '950', color: '#134E39', textTransform: 'uppercase' }}>Visi Pernikahan</span>
                               </div>
                               <p style={{ margin: 0, fontSize: '0.95rem', fontStyle: 'italic', color: '#475569', lineHeight: 1.6 }}>"{userCv.about || '...'}"</p>
                            </div>
                            
                            <div className="cv-bubble-card" style={{ border: '2px dashed #f1f5f9', padding: '1.5rem', borderRadius: '24px' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: '#134E39' }}>
                                  <ShieldCheck size={18} /> <span style={{ fontSize: '0.75rem', fontWeight: '950', color: '#134E39', textTransform: 'uppercase' }}>Kriteria Pasangan</span>
                               </div>
                               <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: 1.6 }}>{userCv.criteria || '...'}</p>
                            </div>
                            
                            <div style={{ marginTop: '1rem' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem', color: '#D4AF37' }}>
                                  <ShieldCheck size={16} /> <span style={{ fontSize: '0.75rem', fontWeight: '950', color: '#134E39', textTransform: 'uppercase' }}>Pandangan Poligami</span>
                               </div>
                               <div style={{ background: '#f8fafc', padding: '0.6rem 1.25rem', borderRadius: '12px', display: 'inline-block', fontSize: '0.85rem', fontWeight: '700', color: '#134E39' }}>
                                  {userCv.polygamy_view || 'Tidak Berkenan'}
                                </div>
                            </div>
                         </div>
                      </div>
                    );
                 })()}
              </div>

              {/* Footer Section */}
              <div className="detail-modal-footer" style={{ padding: '2rem', justifyContent: 'center', background: 'white' }}>
                 <button onClick={() => setViewingUser(null)} style={{ 
                    padding: '1rem 3rem', borderRadius: '16px', background: '#134E39', color: 'white', 
                    border: 'none', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 8px 24px rgba(19, 78, 57, 0.25)' 
                 }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    Tutup Pratinjau
                 </button>
              </div>
          </div>
        </div>
      )}

      <style>{`
        .manage-users-container { padding: 0.5rem; }
        .premium-select {
          padding: 0.9rem 1.25rem;
          border-radius: 16px;
          border: 1.5px solid #f1f5f9;
          background: white;
          outline: none;
          font-size: 0.85rem;
          font-weight: 700;
          color: #1e293b;
          cursor: pointer;
          transition: all 0.2s;
          box-sizing: border-box;
          flex: 1;
          min-width: 160px;
        }
        @media (max-width: 640px) {
          .premium-select { min-width: 100%; }
        }
        .premium-select:hover { border-color: #134E39; }
        .row-hover:hover { 
          background: #f8fafc !important; 
          transform: translateX(4px);
        }
        .row-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        .action-view-btn {
           transition: all 0.2s;
        }
        .action-view-btn:hover {
           background: #134E39 !important;
           color: white !important;
           box-shadow: 0 4px 12px rgba(19,78,57,0.2);
        }

        .manage-users-footer {
          padding: 2rem;
          background: #fcfcfc;
          border-top: 1.5px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
        }
        .footer-stats {
          fontSize: 0.85rem;
          color: #64748b;
          font-weight: 600;
        }
        .stat-highlight {
          color: #1e293b;
          font-weight: 800;
        }
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .page-numbers-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pagination-btn {
          padding: 10px 18px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .num-btn {
          width: 40px;
          height: 40px;
          padding: 0;
          border: none;
          background: transparent;
        }
        .num-btn.active {
          background: #134E39;
          color: white;
          font-weight: 800;
        }
        .pagination-ellipsis {
          color: #cbd5e1;
          font-weight: 800;
          padding: 0 4px;
        }

        @media (max-width: 1024px) {
           .manage-users-container { padding: 0; }
           .manage-users-footer {
              flex-direction: column;
              text-align: center;
              padding: 2rem 1rem;
           }
           .pagination-controls {
              width: 100%;
              justify-content: center;
              flex-wrap: wrap;
           }
        }

        @media (max-width: 640px) {
           .page-numbers-wrapper {
              display: none; /* Hide individual numbers on very small screens */
           }
           .arrow-btn {
              flex: 1;
              padding: 14px;
           }
        }

        /* --- User Detail Modal Styles --- */
        .user-detail-modal {
           max-width: 650px;
           width: 95%;
           max-height: 90vh;
           display: flex;
           flex-direction: column;
           padding: 0;
           border-radius: 32px;
           overflow: hidden;
           box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .detail-modal-header {
           background: #134E39;
           padding: 2.5rem;
           position: relative;
           overflow: hidden;
           color: white;
        }
        .header-glow {
           position: absolute;
           top: -20%;
           right: -10%;
           width: 250px;
           height: 250px;
           background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
           border-radius: 50%;
        }
        .header-content {
           display: flex;
           align-items: center;
           gap: 24px;
           position: relative;
           z-index: 1;
        }
        .detail-avatar {
           width: 80px;
           height: 80px;
           border-radius: 24px;
           background: white;
           display: flex;
           align-items: center;
           justify-content: center;
           color: #134E39;
           font-size: 2rem;
           font-weight: 900;
           box-shadow: 0 10px 30px rgba(0,0,0,0.15);
           flex-shrink: 0;
        }
        .detail-name {
           margin: 0;
           font-size: 1.5rem;
           font-weight: 900;
           letter-spacing: -0.01em;
        }
        .detail-email {
           font-size: 0.9rem;
           opacity: 0.8;
           margin-top: 4px;
        }
        .detail-badges {
           display: flex;
           flex-wrap: wrap;
           gap: 8px;
           margin-top: 12px;
        }
        .badge-gender, .badge-status {
           padding: 4px 12px;
           border-radius: 99px;
           font-size: 0.7rem;
           font-weight: 800;
           text-transform: uppercase;
           letter-spacing: 0.02em;
        }
        .badge-gender.ikhwan { background: rgba(14, 165, 233, 0.2); color: #7dd3fc; }
        .badge-gender.akhwat { background: rgba(236, 72, 153, 0.2); color: #f9a8d4; }
        .badge-status.complete { background: rgba(74, 222, 128, 0.2); color: #86efac; }
        .badge-status.incomplete { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }

        .close-modal-btn {
           position: absolute;
           top: 24px;
           right: 24px;
           background: rgba(255,255,255,0.1);
           border: none;
           border-radius: 12px;
           color: white;
           width: 40px;
           height: 40px;
           cursor: pointer;
           display: flex;
           align-items: center;
           justify-content: center;
           transition: all 0.2s;
           z-index: 10;
        }
        .close-modal-btn:hover { background: rgba(255,255,255,0.2); transform: rotate(90deg); }

        .detail-modal-body {
           flex: 1;
           padding: 2.5rem;
           overflow-y: auto;
           background: white;
           scrollbar-width: auto; /* Standard scrollbar for better visibility */
           scrollbar-color: #cbd5e1 transparent;
        }
        .detail-modal-body::-webkit-scrollbar {
           width: 8px; /* Slightly wider for easier grabbing */
        }
        .detail-modal-body::-webkit-scrollbar-track {
           background: #f1f5f9;
        }
        .detail-modal-body::-webkit-scrollbar-thumb {
           background-color: #cbd5e1;
           border-radius: 10px;
           border: 2px solid #f1f5f9;
        }
        .detail-modal-body::-webkit-scrollbar-thumb:hover {
           background-color: #94a3b8;
        }
        .detail-sections-grid {
           display: grid;
           grid-template-columns: 1fr 1fr;
           gap: 2.5rem;
           margin-bottom: 2.5rem;
        }
        .section-title {
           font-size: 0.75rem;
           font-weight: 800;
           color: #94a3b8;
           text-transform: uppercase;
           letter-spacing: 0.1em;
           margin-bottom: 1.25rem;
           padding-bottom: 8px;
           border-bottom: 1px solid #f1f5f9;
        }
        .info-list {
           display: flex;
           flex-direction: column;
           gap: 14px;
        }
        .info-item {
           display: flex;
           justify-content: space-between;
           align-items: center;
           font-size: 0.9rem;
        }
        .info-label { color: #64748b; font-weight: 600; }
        .info-value { color: #1e293b; font-weight: 800; }
        
        .cv-summary-card {
           background: #f8fafc;
           border-radius: 24px;
           border: 1px solid #f1f5f9;
           padding: 1.5rem;
        }
        .cv-card-header {
           display: flex;
           align-items: center;
           gap: 10px;
           margin-bottom: 1.5rem;
           color: #134E39;
        }
        .cv-card-header h4 { margin: 0; font-size: 1rem; font-weight: 900; }
        .cv-card-content { display: flex; flex-direction: column; gap: 1.5rem; }
        .cv-block h5 {
           margin: 0 0 6px;
           font-size: 0.8rem;
           color: #94a3b8;
           text-transform: uppercase;
           letter-spacing: 0.05em;
        }
        .cv-block p {
           margin: 0;
           font-size: 0.95rem;
           line-height: 1.6;
           color: #334155;
           font-weight: 500;
        }
        .cv-missing { font-style: italic; color: #94a3b8; margin: 0; font-size: 0.9rem; }
        
        .profile-alert {
           display: flex;
           align-items: center;
           gap: 12px;
           padding: 1.25rem;
           border-radius: 18px;
           font-size: 0.85rem;
           font-weight: 600;
        }
        .profile-alert.incomplete {
           background: #fff1f2;
           border: 1px solid #ffe4e6;
           color: #be123c;
        }

        .detail-modal-footer {
           padding: 1.5rem 2.5rem;
           border-top: 1px solid #f1f5f9;
           display: flex;
           justify-content: flex-end;
           background: #fcfcfc;
        }
        .btn-modal-close {
           padding: 0.8rem 2.5rem;
           border-radius: 14px;
           background: #134E39;
           color: white;
           border: none;
           font-weight: 800;
           font-size: 0.9rem;
           cursor: pointer;
           transition: all 0.2s;
           box-shadow: 0 4px 12px rgba(19, 78, 57, 0.2);
        }
        .btn-modal-close:hover { transform: translateY(-2px); background: #0c3124; }

        @media (max-width: 768px) {
           .user-detail-modal {
              width: 100%;
              height: 100%;
              border-radius: 0;
           }
           .detail-modal-header { padding: 1.5rem; }
           .detail-modal-body { padding: 1.5rem; }
           .cv-modern-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
