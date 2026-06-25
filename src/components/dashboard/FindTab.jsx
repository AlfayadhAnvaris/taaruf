// Standardized pagination controls
import React from 'react';
import { 
  Search, Users, Heart, MapPin, User, ChevronLeft, ChevronRight, 
  Sparkles, ShieldAlert, BadgeCheck
} from 'lucide-react';
import MyCvTab from './MyCvTab';

import { useAppContext } from '@/context/AppContext';
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

export default function FindTab({ 
  cvs, myExistingCv, viewingCv, setViewingCv, 
  filters, setFilters, searchQuery, setSearchQuery, 
  provinces, candidateCount, 
  takenUserIds,
  currentPage, setCurrentPage, itemsPerPage,
  handleAjukanTaaruf,
  setActiveTab
}) {
  const { user, bookmarks, setBookmarks, academyLevels, getAcademyBadge, setReportModalState, getBadgeCount } = useAppContext();
  
  const [filterCities, setFilterCities] = React.useState([]);
  const [isFetchingCities, setIsFetchingCities] = React.useState(false);

  const filteredCandidates = React.useMemo(() => {
    if (!cvs) return [];
    return cvs
      .filter(cv => cv.status === 'approved' && cv.user_id !== user?.id && cv.gender !== user?.gender && !takenUserIds?.has(cv.user_id))
      .filter(cv => {
        const query = searchQuery?.toLowerCase() || '';
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
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
  }, [cvs, user, takenUserIds, searchQuery, filters, bookmarks]);

  const currentCandidates = React.useMemo(() => {
    return filteredCandidates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredCandidates, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);

  React.useEffect(() => {
    if (filters.province && provinces.length > 0) {
      const provId = provinces.find(p => p.name === filters.province)?.id;
      if (provId) {
        setIsFetchingCities(true);
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`)
          .then(r => r.json())
          .then(data => setFilterCities(data || []))
          .catch(e => {
            console.error("Gagal ambil kota", e);
            setFilterCities([]);
          })
          .finally(() => setIsFetchingCities(false));
      } else {
        setFilterCities(prev => prev.length ? [] : prev);
      }
    } else {
      setFilterCities(prev => prev.length ? [] : prev);
    }
  }, [filters.province, provinces]);
  return (
    <div key="tab-find" className={`dashboard-tab-container ${viewingCv ? 'viewing-cv' : ''}`} style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      <style>{`
        .dashboard-tab-container {
          padding: 0;
        }
        .dashboard-tab-container.viewing-cv {
          padding: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .dashboard-tab-container {
            padding: 0 !important;
          }
          .dashboard-tab-container.viewing-cv {
            padding: 0px !important;
            height: 100%;
          }
        }
      `}</style>
      {!myExistingCv ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'white', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
            <ShieldAlert size={64} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#134E39' }}>Fitur Pencarian Terkunci</h2>
            <p style={{ color: '#64748b', maxWidth: '450px', margin: '0 auto 2rem', lineHeight: 1.6 }}>Sesuai aturan keamanan Separuh Agama, Anda harus memiliki CV yang valid sebelum dapat melihat calon pasangan.</p>
            <button onClick={() => setActiveTab('my_cv')} style={{ background: '#134E39', color: 'white', border: 'none', borderRadius: '10px', padding: '1rem 3rem', fontWeight: '800', cursor: 'pointer' }}>Buat CV Sekarang</button>
          </div>
        ) : viewingCv ? (
          <div style={{ width: '100%', height: '100%', margin: '0', position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
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
              marginBottom: '1rem', 
              display: 'flex', 
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between', 
              alignItems: 'center', 
              paddingTop: '0.5rem',
              gap: '1rem'
            }}>
              <div style={{ flex: '1 1 300px' }}>
                <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '900', color: '#134E39', margin: '0 0 0.5rem', lineHeight: 1.2 }}>Cari Calon Pasangan</h2>
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
              background: 'white', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem',
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
                    value={searchQuery || ''} onChange={e => setSearchQuery(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Rentang Usia</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="number" className="form-control" placeholder="Min" 
                    style={{ fontSize: '0.85rem', padding: '0.6rem' }}
                    value={filters.minAge || ''} onChange={e => setFilters({...filters, minAge: e.target.value})} 
                  />
                  <span style={{ color: '#cbd5e1' }}>-</span>
                  <input 
                    type="number" className="form-control" placeholder="Max" 
                    style={{ fontSize: '0.85rem', padding: '0.6rem' }}
                    value={filters.maxAge || ''} onChange={e => setFilters({...filters, maxAge: e.target.value})} 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Provinsi</label>
                <select className="form-control" style={{ fontSize: '0.85rem' }} value={filters.province || ''} onChange={e => setFilters({...filters, province: e.target.value, city: ''})}>
                  <option value="">Semua Provinsi</option>
                  {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Kota</label>
                <select className="form-control" style={{ fontSize: '0.85rem' }} value={filters.city || ''} onChange={e => setFilters({...filters, city: e.target.value})} disabled={!filters.province || isFetchingCities}>
                  <option value="">{isFetchingCities ? 'Memuat...' : 'Semua Kota'}</option>
                  {filterCities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Pendidikan</label>
                <select className="form-control" style={{ fontSize: '0.85rem' }} value={filters.education || ''} onChange={e => setFilters({...filters, education: e.target.value})}>
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
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Sparkles size={18} /></div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', margin: 0 }}>Rekomendasi Terdekat </h3>
                </div>
                <div className="recommendation-scroll-container" style={{ position: 'relative' }}>
                  <div className="recommendation-scroll" style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', padding: '0.5rem 0.5rem 0.75rem', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}>
                    {cvs
                      .filter(cv => cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender && !takenUserIds.has(cv.user_id))
                      .filter(cv => cv.location && myExistingCv.location && (
                        cv.location.toLowerCase().includes(myExistingCv.location.split(' ')[0].toLowerCase()) ||
                        myExistingCv.location.toLowerCase().includes(cv.location.split(' ')[0].toLowerCase())
                      ))
                      .map(cv => (
                    <div key={cv.id} onClick={() => setViewingCv(cv)} style={{ minWidth: '300px', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '2px solid rgba(19,78,57,0.1)', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', scrollSnapAlign: 'start' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                           <div style={{ background: '#134E39', color: 'white', fontSize: '0.65rem', fontWeight: '900', padding: '4px 10px', borderRadius: '99px' }}>LOKASI SAMA</div>
                           <div style={{ color: '#D4AF37' }}><MapPin size={14} /></div>
                        </div>
                          <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#134E39', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {cv.alias}
                            {(() => {
                              const badgeCount = getBadgeCount ? getBadgeCount(cv.user_id) : (academyLevels?.[String(cv.user_id)] || 0);
                              const badge = getAcademyBadge ? getAcademyBadge(badgeCount) : null;
                              if (!badge) return null;
                              return (
                                <div title={badge.label} style={{ color: badge.color }}>
                                  {badge.icon}
                                </div>
                              );
                            })()}
                          </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', marginBottom: '0.75rem' }}>{cv.age} THN • {cv.location}</div>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: 0, height: '3.6em', overflow: 'hidden' }}>{cv.karakter_positif || cv.marriage_vision || cv.about || '—'}</p>
                      </div>
                  ))}
                    {cvs.filter(cv => cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender && cv.location && myExistingCv.location && (cv.location.toLowerCase().includes(myExistingCv.location.split(' ')[0].toLowerCase()))).length === 0 && (
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>Belum ada kandidat di lokasi yang sama dengan Anda.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
 
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
               <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}><Users size={18} /></div>
               <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', margin: 0 }}>Semua Kandidat</h3>
            </div>
 
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
               {currentCandidates.map(cv => (
                    <div key={cv.id} className="card" style={{ 
                      padding: '1.75rem', borderRadius: '12px', cursor: 'pointer', 
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
                      border: '1px solid #f1f5f9', background: 'white',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
                      position: 'relative', overflow: 'hidden'
                    }} onClick={() => setViewingCv(cv)} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(19,78,57,0.08)'; e.currentTarget.style.borderColor = 'rgba(19,78,57,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = '#f1f5f9'; }}>
                      
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
                         <div style={{ fontWeight: '900', fontSize: '1.15rem', color: '#134E39', display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '80px', flexWrap: 'wrap' }}>
                           {cv.alias}
                           {(() => {
                              const badgeCount = getBadgeCount ? getBadgeCount(cv.user_id) : (academyLevels?.[String(cv.user_id)] || 0);
                              const badge = getAcademyBadge ? getAcademyBadge(badgeCount) : null;
                              if (!badge) return null;
                              return (
                                <div title={badge.label} style={{ color: badge.color }}>
                                  {badge.icon}
                                </div>
                              );
                            })()}
                         </div>
                         <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <MapPin size={12} color="#D4AF37" /> {cv.location?.split(',')[0]} • {cv.age} THN
                         </div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '4.8em', fontWeight: '500' }}>{cv.karakter_positif || cv.marriage_vision || cv.about || '—'}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f8fafc', paddingTop: '1rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cv.education}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#134E39', display: 'flex', alignItems: 'center', gap: '4px' }}>Lihat Profil <ChevronRight size={14} /></span>
                    </div>
                  </div>
               ))}
            </div>

            {/* Main Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
                      onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
                  onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
        )}
     </div>
  );
}
