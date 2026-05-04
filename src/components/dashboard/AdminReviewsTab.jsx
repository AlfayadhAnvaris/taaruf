import React, { useState, useEffect, useContext } from 'react';
import { Star, Clock, Trash2, ShieldAlert, CheckCircle, ChevronRight, ToggleLeft, ToggleRight, User, Eye, XCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import { AppContext } from '../../App';

export default function AdminReviewsTab({ showAlert }) {
  const { setConfirmState, userReviews, setUserReviews } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    fetchReviews();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Memuat data review...</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        .review-card-desktop {
          padding: 1.75rem;
          border-radius: 28px;
          background: white;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }
        .review-compact-row-mobile {
          padding: 1rem;
          border-radius: 20px;
          background: white;
          border: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          position: relative;
        }
        .action-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #f1f5f9;
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

      <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem', borderRadius: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '1.5rem' : '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px', fontSize: isMobile ? '1.2rem' : '1.5rem', color: '#134E39' }}>
              <Star size={24} color="#D4AF37" fill="#D4AF37" /> Review Antar User
            </h3>
            <p style={{ margin: isMobile ? '4px 0 0' : '5px 0 0 36px', fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Moderasi ulasan yang diberikan kandidat.</p>
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ 
              padding: '0.6rem 1rem', borderRadius: '14px', border: '1.5px solid #f1f5f9', 
              background: '#f8fafc', fontSize: '0.8rem', fontWeight: '700', color: '#1e293b', 
              outline: 'none', cursor: 'pointer', width: isMobile ? '100%' : 'auto'
            }}
          >
            <option value="all">Semua Rating</option>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>Rating {n} ⭐</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
              <Star size={48} style={{ opacity: 0.1, marginBottom: '1.5rem', color: '#134E39' }} />
              <p style={{ fontWeight: '700', color: '#94a3b8' }}>Belum ada data review.</p>
            </div>
          ) : filteredReviews.map(review => {
            const isActive = review.is_active !== false;
            
            if (isMobile) {
              return (
                <div key={review.id} className="review-compact-row-mobile" style={{ opacity: isActive ? 1 : 0.8 }}>
                   {!isActive && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#ef4444', borderTopLeftRadius: '20px', borderBottomLeftRadius: '20px' }} />}
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isActive ? 'rgba(19,78,57,0.05)' : '#fee2e2', color: isActive ? '#134E39' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1rem', flexShrink: 0 }}>
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

            // Desktop View: Detailed Cards
            return (
              <div key={review.id} className="review-card-desktop" style={{ opacity: isActive ? 1 : 0.8 }}>
                {!isActive && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#ef4444' }} />
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                   <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(19,78,57,0.05)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.1rem' }}>
                          {review.reviewer?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                           <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Oleh</div>
                           <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '1rem' }}>{review.reviewer?.name}</div>
                        </div>
                      </div>

                      <ChevronRight size={18} color="#cbd5e1" />

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(212, 175, 55, 0.05)', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.1rem' }}>
                          {review.target?.cv_profiles?.[0]?.alias?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                           <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#D4AF37', textTransform: 'uppercase' }}>Untuk</div>
                           <div style={{ fontWeight: '900', color: '#134E39', fontSize: '1rem' }}>
                             {review.target?.cv_profiles?.[0]?.alias || 'Unknown'} 
                             <span style={{ fontWeight: '600', color: '#94a3b8', fontSize: '0.8rem', marginLeft: '8px' }}>({review.target?.name})</span>
                           </div>
                        </div>
                      </div>
                   </div>

                   <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '2px', marginBottom: '6px', justifyContent: 'flex-end' }}>
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={15} color={s <= review.rating ? '#D4AF37' : '#e2e8f0'} fill={s <= review.rating ? '#D4AF37' : 'transparent'} />)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
                        <Clock size={12} /> {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                   </div>
                </div>

                <div style={{ 
                  background: isActive ? '#f8fafc' : '#fef2f2', 
                  padding: '1.25rem 1.5rem', borderRadius: '20px', fontSize: '0.95rem', 
                  color: isActive ? '#334155' : '#991b1b', lineHeight: 1.7, 
                  marginBottom: '1rem', border: '1px solid',
                  borderColor: isActive ? '#f1f5f9' : '#fee2e2',
                  fontStyle: isActive ? 'normal' : 'italic',
                  height: '50px', overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                }}>
                  "{review.comment}"
                </div>
                <button 
                  onClick={() => setSelectedReview(review)}
                  style={{ 
                    display: 'block', margin: '-0.5rem 0 1.5rem', background: 'none', 
                    border: 'none', color: '#134E39', fontWeight: '800', 
                    fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline'
                  }}
                >
                  Lihat Detail Review
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                      onClick={() => toggleStatus(review)}
                      style={{ 
                        background: isActive ? 'rgba(19, 78, 57, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: isActive ? '#134E39' : '#ef4444',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      {isActive ? 'AKTIF' : 'NONAKTIF'}
                    </button>
                    
                    <button 
                      className="action-icon-btn" 
                      onClick={() => setSelectedReview(review)}
                      title="Lihat Detail"
                    >
                      <Eye size={18} />
                    </button>
                  </div>

                  <button 
                    onClick={() => deleteItem(review.id)}
                    style={{ 
                      background: 'none', border: 'none', color: '#cbd5e1', 
                      fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', 
                      display: 'flex', alignItems: 'center', gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                  >
                    <Trash2 size={16} /> HAPUS
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🟢 DETAIL MODAL 🟢 */}
      {selectedReview && (
        <div className="modal-overlay" onClick={() => setSelectedReview(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '95%', padding: 0 }}>
             <div style={{ background: '#134E39', color: 'white', padding: '1.5rem', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '900' }}>Detail Review</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', opacity: 0.8 }}>ID: #{selectedReview.id.substring(0,8)}</p>
                </div>
                <button onClick={() => setSelectedReview(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '10px', color: 'white', cursor: 'pointer' }}><XCircle size={20} /></button>
             </div>

             <div style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                   <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Pengulas</div>
                      <div style={{ fontWeight: '900', color: '#1e293b', fontSize: '0.95rem' }}>{selectedReview.reviewer?.name}</div>
                   </div>
                   <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: '800', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px' }}>Target</div>
                      <div style={{ fontWeight: '900', color: '#134E39', fontSize: '0.95rem' }}>{selectedReview.target?.cv_profiles?.[0]?.alias}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>({selectedReview.target?.name})</div>
                   </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Komentar & Rating</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} color={s <= selectedReview.rating ? '#D4AF37' : '#e2e8f0'} fill={s <= selectedReview.rating ? '#D4AF37' : 'transparent'} />)}
                      </div>
                   </div>
                   <div style={{ 
                      background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', 
                      fontSize: '1rem', color: '#334155', lineHeight: 1.7, 
                      border: '1px solid #f1f5f9', fontStyle: 'italic'
                   }}>
                      "{selectedReview.comment}"
                   </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '14px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>
                      <Clock size={14} /> {new Date(selectedReview.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                   </div>
                   <div style={{ 
                      padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900',
                      background: selectedReview.is_active !== false ? '#dcfce7' : '#fee2e2',
                      color: selectedReview.is_active !== false ? '#166534' : '#991b1b',
                      textTransform: 'uppercase'
                   }}>
                      {selectedReview.is_active !== false ? 'AKTIF' : 'NONAKTIF'}
                   </div>
                </div>
             </div>

             <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn btn-outline" onClick={() => setSelectedReview(null)} style={{ padding: '0.7rem 1.5rem' }}>Tutup</button>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.7rem 2rem' }}
                  onClick={() => {
                    toggleStatus(selectedReview);
                    setSelectedReview(null);
                  }}
                >
                  {selectedReview.is_active !== false ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
