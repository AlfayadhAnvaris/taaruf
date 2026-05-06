import React from 'react';
import { 
  Search, Users, Heart, MapPin, User, ChevronRight, 
  Sparkles, ShieldAlert, BadgeCheck
} from 'lucide-react';
import MyCvTab from './MyCvTab';
import { supabase } from '../../supabase';

export default function FindTab({ 
  user, cvs, myExistingCv, viewingCv, setViewingCv, 
  filters, setFilters, searchQuery, setSearchQuery, 
  provinces, candidateCount, bookmarks, setBookmarks,
  academyLevels, getAcademyBadge, takenUserIds,
  currentPage, setCurrentPage, itemsPerPage,
  handleAjukanTaaruf, navigate, setActiveTab, setReportModalState
}) {
  return (
    <div key="tab-find" className="dashboard-tab-container" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {!myExistingCv ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'white', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
            <ShieldAlert size={64} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#134E39' }}>Fitur Pencarian Terkunci</h2>
            <p style={{ color: '#64748b', maxWidth: '450px', margin: '0 auto 2rem', lineHeight: 1.6 }}>Sesuai aturan keamanan Separuh Agama, Anda harus memiliki CV yang valid sebelum dapat melihat calon pasangan.</p>
            <button onClick={() => setActiveTab('my_cv')} style={{ background: '#134E39', color: 'white', border: 'none', borderRadius: '10px', padding: '1rem 3rem', fontWeight: '800', cursor: 'pointer' }}>Buat CV Sekarang</button>
          </div>
        ) : viewingCv ? (
          <div style={{ width: '100%', margin: '0', position: 'relative' }}>
            <MyCvTab 
              user={user}
              targetCv={viewingCv}
              onAjukanTaaruf={handleAjukanTaaruf}
              onBack={() => setViewingCv(null)}
            />
          </div>
        ) : (
          <>
            <div style={{ 
              marginBottom: '2rem', 
              display: 'flex', 
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between', 
              alignItems: 'center', 
              paddingTop: '1.5rem',
              gap: '1rem'
            }}>
              <div style={{ flex: '1 1 300px' }}>
                <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '900', color: '#134E39', margin: '0 0 1rem', lineHeight: 1.2 }}>Cari Calon Pasangan</h2>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setFilters({...filters, onlyBookmarked: false})}
                    style={{ 
                      padding: '10px 20px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800', 
                      background: !filters.onlyBookmarked ? '#134E39' : 'white',
                      color: !filters.onlyBookmarked ? 'white' : '#64748b',
                      border: '1px solid ' + (!filters.onlyBookmarked ? '#134E39' : '#e2e8f0'),
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >SEMUA KANDIDAT</button>
                  <button 
                    onClick={() => setFilters({...filters, onlyBookmarked: true})}
                    style={{ 
                      padding: '10px 20px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800', 
                      background: filters.onlyBookmarked ? '#134E39' : 'white',
                      color: filters.onlyBookmarked ? 'white' : '#64748b',
                      border: '1px solid ' + (filters.onlyBookmarked ? '#134E39' : '#e2e8f0'),
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  ><Heart size={14} /> TERSIMPAN ({bookmarks.length})</button>
                </div>
              </div>
              <div style={{ 
                fontSize: '0.75rem', fontWeight: '800', color: '#134E39', 
                background: 'rgba(19,78,57,0.05)', padding: '10px 18px', 
                borderRadius: '8px', border: '1px solid rgba(19,78,57,0.1)',
                whiteSpace: 'nowrap'
              }}>
                TOTAL: {candidateCount} KANDIDAT
              </div>
            </div>

            {/* Filters */}
            <div style={{ 
              background: 'white', borderRadius: '12px', padding: '1.75rem', marginBottom: '3rem',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem',
              border: '1px solid #f1f5f9', boxShadow: '0 10px 40px rgba(0,0,0,0.02)',
              alignItems: 'end'
            }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Kata Kunci</label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" className="form-control" placeholder="Cari alias, hobi..." 
                    style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Rentang Usia</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="number" className="form-control" placeholder="Min" 
                    style={{ fontSize: '0.85rem', padding: '0.6rem' }}
                    value={filters.minAge} onChange={e => setFilters({...filters, minAge: e.target.value})} 
                  />
                  <span style={{ color: '#cbd5e1' }}>-</span>
                  <input 
                    type="number" className="form-control" placeholder="Max" 
                    style={{ fontSize: '0.85rem', padding: '0.6rem' }}
                    value={filters.maxAge} onChange={e => setFilters({...filters, maxAge: e.target.value})} 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Provinsi</label>
                <select className="form-control" style={{ fontSize: '0.85rem' }} value={filters.province} onChange={e => setFilters({...filters, province: e.target.value, city: ''})}>
                  <option value="">Semua Provinsi</option>
                  {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Pendidikan</label>
                <select className="form-control" style={{ fontSize: '0.85rem' }} value={filters.education} onChange={e => setFilters({...filters, education: e.target.value})}>
                  <option value="">Semua Jenjang</option>
                  {['SMA/SMK', 'Diploma', 'S1', 'S2', 'S3'].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <button 
                  onClick={() => {
                    setFilters({ province: '', city: '', suku: '', minAge: '', maxAge: '', education: '' });
                    setSearchQuery('');
                  }}
                  style={{ 
                    width: '100%', padding: '0.75rem', borderRadius: '12px', background: '#f8fafc',
                    border: '1px solid #e2e8f0', color: '#64748b', fontWeight: '800', 
                    cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                >
                  RESET FILTER
                </button>
              </div>
            </div>

            {/* ✨ BEST RECOMMENDATION SECTION ✨ */}
            {myExistingCv && (
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Sparkles size={18} /></div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', margin: 0 }}>Rekomendasi Terdekat </h3>
                </div>
                <div className="recommendation-scroll-container" style={{ position: 'relative' }}>
                  <div className="recommendation-scroll" style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', padding: '0.5rem 0.5rem 1.5rem', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}>
                    {cvs
                      .filter(cv => cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender && !takenUserIds.has(cv.user_id))
                      .filter(cv => cv.location && myExistingCv.location && (
                        cv.location.toLowerCase().includes(myExistingCv.location.split(' ')[0].toLowerCase()) ||
                        myExistingCv.location.toLowerCase().includes(cv.location.split(' ')[0].toLowerCase())
                      ))
                      .map(cv => (
                    <div key={cv.id} onClick={() => navigate(`/app/find/${cv.id}`)} style={{ minWidth: '300px', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '2px solid rgba(19,78,57,0.1)', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', scrollSnapAlign: 'start' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                           <div style={{ background: '#134E39', color: 'white', fontSize: '0.65rem', fontWeight: '900', padding: '4px 10px', borderRadius: '99px' }}>LOKASI SAMA</div>
                           <div style={{ color: '#D4AF37' }}><MapPin size={14} /></div>
                        </div>
                         <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#134E39', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                           {cv.alias}
                           {getAcademyBadge(academyLevels[String(cv.user_id)]) && (
                             <div title={getAcademyBadge(academyLevels[String(cv.user_id)]).label} style={{ color: getAcademyBadge(academyLevels[String(cv.user_id)]).color }}>
                               {getAcademyBadge(academyLevels[String(cv.user_id)]).icon}
                             </div>
                           )}
                         </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', marginBottom: '0.75rem' }}>{cv.age} THN • {cv.location}</div>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: 0, height: '3.6em', overflow: 'hidden' }}>{cv.about}</p>
                      </div>
                  ))}
                    {cvs.filter(cv => cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender && cv.location && myExistingCv.location && (cv.location.toLowerCase().includes(myExistingCv.location.split(' ')[0].toLowerCase()))).length === 0 && (
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>Belum ada kandidat di lokasi yang sama dengan Anda.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
               <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}><Users size={18} /></div>
               <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', margin: 0 }}>Semua Kandidat</h3>
            </div>

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
               {cvs
                .filter(cv => cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender && !takenUserIds.has(cv.user_id))
                .filter(cv => {
                  const query = searchQuery.toLowerCase();
                  const matchQuery = cv.alias?.toLowerCase().includes(query) || cv.location?.toLowerCase().includes(query) || cv.job?.toLowerCase().includes(query);
                  const matchProvince = !filters.province || cv.location?.toLowerCase().includes(filters.province.toLowerCase());
                  const matchCity = !filters.city || cv.location?.toLowerCase().includes(filters.city.toLowerCase());
                  const matchSuku = !filters.suku || cv.suku === filters.suku;
                  const matchMinAge = !filters.minAge || cv.age >= parseInt(filters.minAge);
                  const matchMaxAge = !filters.maxAge || cv.age <= parseInt(filters.maxAge);
                  const matchEdu = !filters.education || (cv.education && cv.education.includes(filters.education));
                  const matchBookmark = !filters.onlyBookmarked || bookmarks.some(b => b.target_id === cv.user_id);
                  return matchQuery && matchProvince && matchCity && matchSuku && matchMinAge && matchMaxAge && matchEdu && matchBookmark;
                })
                .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map(cv => (
                    <div key={cv.id} className="card" style={{ 
                      padding: '1.75rem', borderRadius: '12px', cursor: 'pointer', 
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
                      border: '1px solid #f1f5f9', background: 'white',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
                      position: 'relative', overflow: 'hidden'
                    }} onClick={() => navigate(`/app/find/${cv.id}`)} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(19,78,57,0.08)'; e.currentTarget.style.borderColor = 'rgba(19,78,57,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = '#f1f5f9'; }}>
                      
                      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setReportModalState({ 
                              isOpen: true, 
                              reportedUserId: cv.user_id, 
                              reportedCvId: cv.id, 
                              reportedAlias: cv.alias 
                            });
                          }}
                          style={{ 
                            width: '36px', height: '36px', borderRadius: '50%', 
                            background: 'white', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.2s',
                            color: '#94a3b8'
                          }}
                          title="Laporkan Pengguna"
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                        >
                          <ShieldAlert size={16} />
                        </button>

                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            const isBookmarked = bookmarks.some(b => b.target_id === cv.user_id);
                            if (isBookmarked) {
                              const { error } = await supabase.from('user_bookmarks').delete().eq('user_id', user.id).eq('target_id', cv.user_id);
                              if (!error) setBookmarks(bookmarks.filter(b => b.target_id !== cv.user_id));
                            } else {
                              const { data, error } = await supabase.from('user_bookmarks').insert({ user_id: user.id, target_id: cv.user_id }).select().single();
                              if (!error) setBookmarks([...bookmarks, data]);
                            }
                          }}
                          style={{ 
                            width: '36px', height: '36px', borderRadius: '50%', 
                            background: bookmarks.some(b => b.target_id === cv.user_id) ? '#EF4444' : 'white',
                            border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          <Heart size={18} color={bookmarks.some(b => b.target_id === cv.user_id) ? 'white' : '#EF4444'} fill={bookmarks.some(b => b.target_id === cv.user_id) ? 'white' : 'transparent'} />
                        </button>
                      </div>

                      <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, transparent 100%)', borderRadius: '0 0 0 40px' }}></div>
                    
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <div style={{ width: 56, height: 56, borderRadius: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39', border: '1px solid #f1f5f9' }}><User size={28} /></div>
                      <div>
                         <div style={{ fontWeight: '900', fontSize: '1.15rem', color: '#134E39', display: 'flex', alignItems: 'center', gap: '8px' }}>
                           {cv.alias}
                           {getAcademyBadge(academyLevels[String(cv.user_id)]) && (
                             <div title={getAcademyBadge(academyLevels[String(cv.user_id)]).label} style={{ color: getAcademyBadge(academyLevels[String(cv.user_id)]).color }}>
                               {getAcademyBadge(academyLevels[String(cv.user_id)]).icon}
                             </div>
                           )}
                         </div>
                         <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <MapPin size={12} color="#D4AF37" /> {cv.location?.split(',')[0]} • {cv.age} THN
                         </div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '4.8em', fontWeight: '500' }}>{cv.about}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f8fafc', paddingTop: '1rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cv.education}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#134E39', display: 'flex', alignItems: 'center', gap: '4px' }}>Lihat Profil <ChevronRight size={14} /></span>
                    </div>
                  </div>
               ))}
            </div>

            {/* Main Pagination */}
            {cvs.filter(cv => {
                  const query = searchQuery.toLowerCase();
                  const matchQuery = cv.alias?.toLowerCase().includes(query) || cv.location?.toLowerCase().includes(query) || cv.job?.toLowerCase().includes(query);
                  const matchProvince = !filters.province || cv.location?.toLowerCase().includes(filters.province.toLowerCase());
                  const matchCity = !filters.city || cv.location?.toLowerCase().includes(filters.city.toLowerCase());
                  const matchSuku = !filters.suku || cv.suku === filters.suku;
                  const matchMinAge = !filters.minAge || cv.age >= parseInt(filters.minAge);
                  const matchMaxAge = !filters.maxAge || cv.age <= parseInt(filters.maxAge);
                  const matchEdu = !filters.education || (cv.education && cv.education.includes(filters.education));
                  const matchBookmark = !filters.onlyBookmarked || bookmarks.some(b => b.target_id === cv.user_id);

                  return cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender && !takenUserIds.has(cv.user_id) && matchQuery && matchProvince && matchCity && matchSuku && matchMinAge && matchMaxAge && matchEdu && matchBookmark;
                }).length > itemsPerPage && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === 1}
                  style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: '700', color: currentPage === 1 ? '#cbd5e1' : '#134E39', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Sebelumnya
                </button>
                <span style={{ fontWeight: '800', color: '#134E39', fontSize: '0.9rem' }}>
                  Halaman {currentPage} dari {Math.ceil(cvs.filter(cv => {
                  const query = searchQuery.toLowerCase();
                  const matchQuery = cv.alias?.toLowerCase().includes(query) || cv.location?.toLowerCase().includes(query) || cv.job?.toLowerCase().includes(query);
                  const matchProvince = !filters.province || cv.location?.toLowerCase().includes(filters.province.toLowerCase());
                  const matchCity = !filters.city || cv.location?.toLowerCase().includes(filters.city.toLowerCase());
                  const matchSuku = !filters.suku || cv.suku === filters.suku;
                  const matchMinAge = !filters.minAge || cv.age >= parseInt(filters.minAge);
                  const matchMaxAge = !filters.maxAge || cv.age <= parseInt(filters.maxAge);
                  const matchEdu = !filters.education || (cv.education && cv.education.includes(filters.education));
                  const matchBookmark = !filters.onlyBookmarked || bookmarks.some(b => b.target_id === cv.user_id);

                  return cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender && !takenUserIds.has(cv.user_id) && matchQuery && matchProvince && matchCity && matchSuku && matchMinAge && matchMaxAge && matchEdu && matchBookmark;
                }).length / itemsPerPage)}
                </span>
                <button 
                  onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage >= Math.ceil(cvs.filter(cv => {
                  const query = searchQuery.toLowerCase();
                  const matchQuery = cv.alias?.toLowerCase().includes(query) || cv.location?.toLowerCase().includes(query) || cv.job?.toLowerCase().includes(query);
                  const matchProvince = !filters.province || cv.location?.toLowerCase().includes(filters.province.toLowerCase());
                  const matchCity = !filters.city || cv.location?.toLowerCase().includes(filters.city.toLowerCase());
                  const matchSuku = !filters.suku || cv.suku === filters.suku;
                  const matchMinAge = !filters.minAge || cv.age >= parseInt(filters.minAge);
                  const matchMaxAge = !filters.maxAge || cv.age <= parseInt(filters.maxAge);
                  const matchEdu = !filters.education || (cv.education && cv.education.includes(filters.education));
                  const matchBookmark = !filters.onlyBookmarked || bookmarks.some(b => b.target_id === cv.user_id);

                  return cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender && !takenUserIds.has(cv.user_id) && matchQuery && matchProvince && matchCity && matchSuku && matchMinAge && matchMaxAge && matchEdu && matchBookmark;
                }).length / itemsPerPage)}
                  style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: '700', color: currentPage >= Math.ceil(cvs.filter(cv => {
                  const query = searchQuery.toLowerCase();
                  const matchQuery = cv.alias?.toLowerCase().includes(query) || cv.location?.toLowerCase().includes(query) || cv.job?.toLowerCase().includes(query);
                  const matchProvince = !filters.province || cv.location?.toLowerCase().includes(filters.province.toLowerCase());
                  const matchCity = !filters.city || cv.location?.toLowerCase().includes(filters.city.toLowerCase());
                  const matchSuku = !filters.suku || cv.suku === filters.suku;
                  const matchMinAge = !filters.minAge || cv.age >= parseInt(filters.minAge);
                  const matchMaxAge = !filters.maxAge || cv.age <= parseInt(filters.maxAge);
                  const matchEdu = !filters.education || (cv.education && cv.education.includes(filters.education));
                  const matchBookmark = !filters.onlyBookmarked || bookmarks.some(b => b.target_id === cv.user_id);

                  return cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender && !takenUserIds.has(cv.user_id) && matchQuery && matchProvince && matchCity && matchSuku && matchMinAge && matchMaxAge && matchEdu && matchBookmark;
                }).length / itemsPerPage) ? '#cbd5e1' : '#134E39', cursor: currentPage >= Math.ceil(cvs.filter(cv => {
                  const query = searchQuery.toLowerCase();
                  const matchQuery = cv.alias?.toLowerCase().includes(query) || cv.location?.toLowerCase().includes(query) || cv.job?.toLowerCase().includes(query);
                  const matchProvince = !filters.province || cv.location?.toLowerCase().includes(filters.province.toLowerCase());
                  const matchCity = !filters.city || cv.location?.toLowerCase().includes(filters.city.toLowerCase());
                  const matchSuku = !filters.suku || cv.suku === filters.suku;
                  const matchMinAge = !filters.minAge || cv.age >= parseInt(filters.minAge);
                  const matchMaxAge = !filters.maxAge || cv.age <= parseInt(filters.maxAge);
                  const matchEdu = !filters.education || (cv.education && cv.education.includes(filters.education));
                  const matchBookmark = !filters.onlyBookmarked || bookmarks.some(b => b.target_id === cv.user_id);

                  return cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender && !takenUserIds.has(cv.user_id) && matchQuery && matchProvince && matchCity && matchSuku && matchMinAge && matchMaxAge && matchEdu && matchBookmark;
                }).length / itemsPerPage) ? 'not-allowed' : 'pointer' }}
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </>
        )}
     </div>
  );
}
