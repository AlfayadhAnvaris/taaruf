import React, { useState, useEffect, useContext } from 'react';
import { Star, Clock, Trash2, ShieldAlert, CheckCircle, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../../supabase';
import { AppContext } from '../../App';

export default function AdminReviewsTab({ showAlert }) {
  const { setConfirmState, userReviews, setUserReviews } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReviews();
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
    const newStatus = review.is_active === false; // If explicitly false, set to true. If null/undefined/true, set to false.
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
      showAlert('Error', 'Gagal mengubah status review. Pastikan kolom "is_active" sudah ada di tabel user_reviews. Detail: ' + err.message, 'error');
    }
  };

  const filteredReviews = userReviews.filter(r => filter === 'all' || String(r.rating) === filter);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Memuat data review...</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="card" style={{ padding: '2rem', borderRadius: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', color: '#134E39' }}>
              <Star size={24} color="#D4AF37" fill="#D4AF37" /> Log Review Antar User
            </h3>
            <p style={{ margin: '5px 0 0 36px', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Pantau dan moderasi ulasan yang diberikan antar calon kandidat.</p>
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ 
              padding: '0.75rem 1.25rem', borderRadius: '16px', border: '1.5px solid #f1f5f9', 
              background: '#f8fafc', fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', 
              outline: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <option value="all">Semua Rating</option>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>Rating {n} ⭐</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
              <Star size={48} style={{ opacity: 0.1, marginBottom: '1.5rem', color: '#134E39' }} />
              <p style={{ fontWeight: '700', color: '#94a3b8' }}>Belum ada data review antar user.</p>
            </div>
          ) : filteredReviews.map(review => {
            const isActive = review.is_active !== false;
            return (
              <div key={review.id} style={{ 
                padding: '1.75rem', borderRadius: '28px', background: 'white', 
                border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', 
                opacity: isActive ? 1 : 0.7, transition: 'all 0.3s',
                position: 'relative', overflow: 'hidden'
              }}>
                {!isActive && (
                  <div style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#ef4444' 
                  }} />
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                   <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(19,78,57,0.05)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.1rem' }}>
                        {review.reviewer?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                         <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.05em' }}>Oleh</div>
                         <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.95rem' }}>{review.reviewer?.name}</div>
                      </div>
                      <ChevronRight size={18} color="#cbd5e1" />
                      <div>
                         <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.05em' }}>Untuk</div>
                         <div style={{ fontWeight: '900', color: '#134E39', fontSize: '0.95rem' }}>
                           {review.target?.cv_profiles?.[0]?.alias || 'Unknown'} 
                           <span style={{ fontWeight: '600', color: '#94a3b8', fontSize: '0.8rem', marginLeft: '8px' }}>({review.target?.name})</span>
                         </div>
                      </div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '2px', marginBottom: '6px', justifyContent: 'flex-end' }}>
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={15} color={s <= review.rating ? '#D4AF37' : '#e2e8f0'} fill={s <= review.rating ? '#D4AF37' : 'transparent'} />)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
                        <Clock size={12} /> {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                   </div>
                </div>

                <div style={{ 
                  background: isActive ? '#f8fafc' : '#fef2f2', 
                  padding: '1.25rem 1.5rem', borderRadius: '20px', fontSize: '0.95rem', 
                  color: isActive ? '#334155' : '#991b1b', lineHeight: 1.7, 
                  marginBottom: '1.5rem', border: '1px solid',
                  borderColor: isActive ? '#f1f5f9' : '#fee2e2',
                  fontStyle: isActive ? 'normal' : 'italic'
                }}>
                  "{review.comment}"
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: isActive ? '#059669' : '#ef4444', textTransform: 'uppercase' }}>
                      Status: {isActive ? 'Aktif' : 'Dinonaktifkan'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* STUDIO STYLE TOGGLE */}
                    <button 
                      onClick={() => toggleStatus(review)}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      style={{ 
                        background: isActive ? 'rgba(19, 78, 57, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        color: isActive ? '#134E39' : '#94a3b8',
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      title={isActive ? 'Nonaktifkan Review' : 'Aktifkan Review'}
                    >
                      {isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      {isActive ? 'AKTIF' : 'NONAKTIF'}
                    </button>

                    <div style={{ width: '1px', height: '24px', background: '#f1f5f9' }} />

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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
