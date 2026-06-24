import React, { useState, useEffect } from 'react';
import { Star, Clock, Trash2, ShieldAlert, CheckCircle, ChevronRight, ChevronLeft, ToggleLeft, ToggleRight, User, Eye, XCircle } from 'lucide-react';
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

export default function AdminReviewsTab() {
  const { showAlert, setConfirmState, userReviews, setUserReviews } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchReviews();
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_reviews')
        .select('*, reviewer:reviewer_id(name), target:target_id(name, cv_profiles(alias))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Review?',
      message: 'Apakah Anda yakin ingin menghapus data ini secara permanen?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('user_reviews').delete().eq('id', id);
          if (error) throw error;
          setUserReviews(prev => prev.filter(r => r.id !== id));
          showAlert('Berhasil', 'Data telah dihapus.', 'success');
        } catch (err) {
          showAlert('Error', 'Gagal menghapus data: ' + err.message, 'error');
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const toggleStatus = async (review) => {
    const newStatus = review.is_active === false;
    try {
      const { error } = await supabase
        .from('user_reviews')
        .update({ is_active: newStatus })
        .eq('id', review.id);

      if (error) throw error;
      
      setUserReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_active: newStatus } : r));
      showAlert('Berhasil', `Review telah ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`, 'success');
    } catch (err) {
      console.error('Toggle status error:', err);
      showAlert('Error', 'Gagal mengubah status review. ' + err.message, 'error');
    }
  };

  const filteredReviews = userReviews.filter(r => filter === 'all' || String(r.rating) === filter);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReviews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);

  const totalReviews = userReviews.length;
  const activeReviews = userReviews.filter(r => r.is_active !== false).length;
  const inactiveReviews = userReviews.filter(r => r.is_active === false).length;
  const avgRating = totalReviews > 0 
    ? (userReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) 
    : '0.0';

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Memuat data review...</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        .review-card-desktop {
          padding: 1.75rem;
          border-radius: 16px;
          background: white;
          border: 1px solid #E4EDE8;
          box-shadow: 0 4px 12px rgba(19, 78, 57, 0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }
        .review-card-desktop:hover {
          box-shadow: 0 12px 30px rgba(19, 78, 57, 0.06);
          border-color: rgba(19, 78, 57, 0.15);
          transform: translateY(-2px);
        }
        .review-compact-row-mobile {
          padding: 1.25rem 1rem;
          border-radius: 14px;
          background: white;
          border: 1px solid #E4EDE8;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          position: relative;
          transition: all 0.2s;
        }
        .review-compact-row-mobile:hover {
          border-color: rgba(19, 78, 57, 0.15);
          box-shadow: 0 4px 12px rgba(19, 78, 57, 0.02);
        }
        .review-compact-row-desktop {
          transition: all 0.2s ease;
        }
        .review-compact-row-desktop:hover {
          box-shadow: 0 4px 12px rgba(19, 78, 57, 0.05);
          border-color: rgba(19, 78, 57, 0.15) !important;
          transform: translateX(4px);
        }
        .action-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justifyContent: center;
          border: 1px solid #E4EDE8;
          background: white;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-icon-btn:hover {
          background: #134E39;
          color: white;
          border-color: #134E39;
        }
        .reviewer-info-text-mobile {
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>

      <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px', fontSize: isMobile ? '1.2rem' : '1.5rem', color: '#134E39' }}>
              <Star size={24} color="#D4AF37" fill="#D4AF37" /> Review Antar User
            </h3>
            <p style={{ margin: isMobile ? '4px 0 0' : '5px 0 0 36px', fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Moderasi ulasan yang diberikan kandidat.</p>
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
            style={{ 
              padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #E4EDE8', 
              background: '#f8fafc', fontSize: '0.8rem', fontWeight: '700', color: '#1e293b', 
              outline: 'none', cursor: 'pointer', width: isMobile ? '100%' : 'auto'
            }}
          >
            <option value="all">Semua Rating</option>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>Rating {n} ⭐</option>)}
          </select>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ background: '#f8fafc', border: '1px solid #E4EDE8', borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(19,78,57,0.06)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Star size={18} fill="#134E39" color="#134E39" />
            </div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: '950', color: '#134E39', lineHeight: 1 }}>{avgRating}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.02em' }}>Rata-Rata Rating</div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #E4EDE8', borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(19,78,57,0.06)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={18} color="#134E39" />
            </div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: '950', color: '#134E39', lineHeight: 1 }}>{totalReviews}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.02em' }}>Total Ulasan</div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #E4EDE8', borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(5,150,105,0.06)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={18} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: '950', color: '#059669', lineHeight: 1 }}>{activeReviews}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.02em' }}>Ulasan Aktif</div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #E4EDE8', borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={18} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: '950', color: '#ef4444', lineHeight: 1 }}>{inactiveReviews}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.02em' }}>Ditangguhkan</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
              <Star size={48} style={{ opacity: 0.1, marginBottom: '1.5rem', color: '#134E39' }} />
              <p style={{ fontWeight: '700', color: '#94a3b8' }}>Belum ada data review.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table Header */}
              {!isMobile && (
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.8fr 2fr 0.8fr 0.8fr 1.2fr',
                  padding: '0.75rem 1.25rem',
                  background: '#f8fafc',
                  border: '1px solid #E4EDE8',
                  borderRadius: '10px',
                  marginBottom: '0.5rem',
                  gap: '1rem',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <div>Pengulas & Target</div>
                  <div>Rating</div>
                  <div>Komentar</div>
                  <div>Tanggal</div>
                  <div>Status</div>
                  <div style={{ textAlign: 'right' }}>Aksi</div>
                </div>
              )}

              {currentItems.map(review => {
                const isActive = review.is_active !== false;
                
                if (isMobile) {
                  return (
                    <div key={review.id} className="review-compact-row-mobile" style={{ opacity: isActive ? 1 : 0.8 }}>
                       {!isActive && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#ef4444', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }} />}
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: isActive ? 'rgba(19,78,57,0.05)' : '#fee2e2', color: isActive ? '#134E39' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1rem', flexShrink: 0 }}>
                            {review.reviewer?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="reviewer-info-text-mobile">
                             <div style={{ fontSize: '0.55rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Oleh</div>
                             <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>{review.reviewer?.name}</div>
                          </div>
                       </div>

                       <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button 
                            className="action-icon-btn"
                            onClick={() => toggleStatus(review)}
                            style={{ 
                              background: isActive ? 'rgba(19, 78, 57, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: isActive ? '#134E39' : '#ef4444',
                              border: 'none'
                            }}
                            title={isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                          </button>

                          <button 
                            className="action-icon-btn" 
                            onClick={() => setSelectedReview(review)}
                          >
                            <Eye size={18} />
                          </button>

                          <button 
                            className="action-icon-btn" 
                            onClick={() => deleteItem(review.id)}
                            style={{ borderColor: '#fee2e2', color: '#ef4444' }}
                          >
                            <Trash2 size={18} />
                          </button>
                       </div>
                    </div>
                  );
                }
                
                // Desktop View: Compact Row
                return (
                  <div 
                    key={review.id} 
                    className="review-compact-row-desktop"
                    style={{ 
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 0.8fr 2fr 0.8fr 0.8fr 1.2fr',
                      alignItems: 'center',
                      padding: '0.75rem 1.25rem',
                      background: 'white',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: '#E4EDE8',
                      borderLeftWidth: '4px',
                      borderLeftStyle: 'solid',
                      borderLeftColor: isActive ? '#134E39' : '#ef4444',
                      borderRadius: '12px',
                      marginBottom: '0.5rem',
                      gap: '1rem',
                      opacity: isActive ? 1 : 0.85
                    }}
                  >
                    {/* 1. Pengulas & Target */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.85rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {review.reviewer?.name}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '750', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          ➔ {review.target?.cv_profiles?.[0]?.alias || 'Unknown'} ({review.target?.name})
                        </span>
                      </div>
                    </div>

                    {/* 2. Rating */}
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star 
                          key={s} 
                          size={13} 
                          color={s <= review.rating ? '#D4AF37' : '#e2e8f0'} 
                          fill={s <= review.rating ? '#D4AF37' : 'transparent'} 
                        />
                      ))}
                      <span style={{ fontSize: '0.75rem', fontWeight: '850', color: '#475569', marginLeft: '4px' }}>
                        {review.rating}.0
                      </span>
                    </div>

                    {/* 3. Komentar (Truncated) */}
                    <div 
                      onClick={() => setSelectedReview(review)}
                      style={{ 
                        fontSize: '0.85rem', 
                        color: '#475569', 
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontStyle: 'italic',
                        paddingRight: '1rem'
                      }}
                      title="Klik untuk detail ulasan"
                    >
                      "{review.comment}"
                    </div>

                    {/* 4. Tanggal */}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>

                    {/* 5. Status Badge */}
                    <div>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '900',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: isActive ? '#dcfce7' : '#fee2e2',
                        color: isActive ? '#059669' : '#ef4444',
                        display: 'inline-block'
                      }}>
                        {isActive ? 'AKTIF' : 'DITANGGUHKAN'}
                      </span>
                    </div>

                    {/* 6. Aksi (Actions) */}
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => toggleStatus(review)}
                        style={{ 
                          background: isActive ? 'rgba(5, 150, 105, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          color: isActive ? '#059669' : '#ef4444',
                          border: 'none',
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        title={isActive ? 'Tangguhkan Ulasan' : 'Aktifkan Ulasan'}
                      >
                        {isActive ? <CheckCircle size={15} /> : <ShieldAlert size={15} />}
                      </button>

                      <button 
                        onClick={() => setSelectedReview(review)}
                        style={{ 
                          background: '#f8fafc',
                          color: '#64748b',
                          border: '1px solid #e2e8f0',
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        title="Lihat Detail"
                      >
                        <Eye size={15} />
                      </button>

                      <button 
                        onClick={() => deleteItem(review.id)}
                        style={{ 
                          background: '#fef2f2',
                          color: '#ef4444',
                          border: 'none',
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        title="Hapus Permanen"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    style={{ 
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '38px', height: '38px', borderRadius: '8px', border: '1px solid #E4EDE8', 
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
                        onClick={() => setCurrentPage(page)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '38px', height: '38px', borderRadius: '8px', 
                          border: isActive ? '1px solid #134E39' : '1px solid #E4EDE8',
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
                            e.currentTarget.style.borderColor = '#E4EDE8';
                          }
                        }}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    style={{ 
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '38px', height: '38px', borderRadius: '8px', border: '1px solid #E4EDE8', 
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
      </div>

      {/* 🟢 DETAIL MODAL 🟢 */}
      {selectedReview && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedReview(null)}
          style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(15, 23, 42, 0.3)' }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: '520px', width: '95%', padding: 0, borderRadius: '16px', border: '1px solid #E4EDE8', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', background: 'white' }}
          >
             <div style={{ background: '#134E39', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '900' }}>Detail Review</h3>
                   <p style={{ margin: '4px 0 0', fontSize: '0.75rem', opacity: 0.8 }}>ID: #{selectedReview.id.substring(0,8)}</p>
                </div>
                <button onClick={() => setSelectedReview(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={20} /></button>
             </div>
 
             <div style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                   <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E4EDE8' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Pengulas</div>
                      <div style={{ fontWeight: '900', color: '#1e293b', fontSize: '0.95rem' }}>{selectedReview.reviewer?.name}</div>
                   </div>
                   <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E4EDE8' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Target</div>
                      <div style={{ fontWeight: '900', color: '#134E39', fontSize: '0.95rem' }}>{selectedReview.target?.cv_profiles?.[0]?.alias || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>({selectedReview.target?.name})</div>
                   </div>
                </div>
 
                <div style={{ marginBottom: '1.5rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Komentar & Rating</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} color={s <= selectedReview.rating ? '#D4AF37' : '#e2e8f0'} fill={s <= selectedReview.rating ? '#D4AF37' : 'transparent'} />)}
                      </div>
                   </div>
                   <div style={{ 
                      background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', 
                      fontSize: '0.95rem', color: '#334155', lineHeight: 1.7, 
                      border: '1px solid #E4EDE8', fontStyle: 'italic', fontWeight: '600'
                   }}>
                      "{selectedReview.comment}"
                   </div>
                </div>
 
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #E4EDE8' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>
                      <Clock size={14} /> {new Date(selectedReview.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                   </div>
                   <div style={{ 
                      padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900',
                      background: selectedReview.is_active !== false ? '#dcfce7' : '#fee2e2',
                      color: selectedReview.is_active !== false ? '#059669' : '#ef4444',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                   }}>
                      {selectedReview.is_active !== false ? 'AKTIF' : 'NONAKTIF'}
                   </div>
                </div>
             </div>
 
             <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #E4EDE8', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#f8fafc' }}>
                <button className="btn btn-outline" onClick={() => setSelectedReview(null)} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem' }}>Tutup</button>
                <button 
                  className="btn" 
                  style={{ 
                    padding: '0.6rem 1.75rem', 
                    borderRadius: '8px', 
                    background: selectedReview.is_active !== false ? '#ef4444' : '#134E39', 
                    color: 'white',
                    border: 'none',
                    fontWeight: '900',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    toggleStatus(selectedReview);
                    setSelectedReview(null);
                  }}
                >
                  {selectedReview.is_active !== false ? 'Nonaktifkan Ulasan' : 'Aktifkan Ulasan'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
