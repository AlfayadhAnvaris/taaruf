import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Clock, Filter, Trash2, PieChart as PieChartIcon, Eye, XCircle, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

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

export default function AdminFeedbackTab() {
  const { setConfirmState, showAlert } = useAppContext();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    fetchFeedback();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_feedback')
        .select('*, profiles(name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Masukan?',
      message: 'Apakah Anda yakin ingin menghapus data ini secara permanen?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('site_feedback').delete().eq('id', id);
          if (error) throw error;
          setFeedback(prev => prev.filter(f => f.id !== id));
          showAlert('Berhasil', 'Data telah dihapus.', 'success');
        } catch {
          showAlert('Error', 'Gagal menghapus data.', 'error');
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const filteredFeedback = feedback.filter(f => filter === 'all' || f.category === filter);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFeedback.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Memuat data masukan...</div>;
  }

  // Calculate Category Stats
  const categories = ['umum', 'akademi', 'match', 'bug'];
  const catStats = categories.map(cat => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: feedback.filter(f => f.category === cat).length,
    color: cat === 'bug' ? '#ef4444' : (cat === 'match' ? '#134E39' : (cat === 'akademi' ? '#D4AF37' : '#94a3b8'))
  })).filter(d => d.value > 0);

  const avgRating = feedback.length > 0 
    ? (feedback.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedback.length).toFixed(1)
    : 0;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        .feedback-compact-row {
          padding: 1rem;
          border-radius: 12px;
          background: white;
          border: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          position: relative;
          transition: all 0.2s;
        }
        .feedback-compact-row:hover {
          border-color: #134E39;
          transform: translateX(4px);
        }
        .feedback-compact-row-desktop {
          transition: all 0.2s ease;
        }
        .feedback-compact-row-desktop:hover {
          box-shadow: 0 4px 12px rgba(19, 78, 57, 0.05);
          border-color: rgba(19, 78, 57, 0.15) !important;
          transform: translateX(4px);
        }
        .action-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 8px;
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
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .feedback-card-desktop {
          padding: 1.5rem;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          transition: all 0.3s;
        }
        .feedback-card-desktop:hover {
          background: white;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          transform: translateY(-2px);
        }
      `}</style>

      {/* 📊 Summary Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', gap: isMobile ? '1rem' : '2rem', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ flex: '1', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(19,78,57,0.05)', color: '#134E39', padding: '10px', borderRadius: '10px' }}>
                <PieChartIcon size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#1e293b' }}>Statistik Masukan</h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', flex: 1, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Rating Avg</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39' }}>{avgRating} <Star size={14} fill="#D4AF37" color="#D4AF37" /></div>
               </div>
               <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', flex: 1, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Total</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e293b' }}>{feedback.length}</div>
               </div>
            </div>
          </div>
          <div style={{ width: '120px', height: '100px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catStats} cx="50%" cy="50%" innerRadius={30} outerRadius={45} paddingAngle={5} dataKey="value" stroke="none">
                  {catStats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={4} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', color: '#134E39', fontSize: isMobile ? '1.2rem' : '1.5rem' }}>
            <MessageSquare size={20} color="#134E39" /> Saran & Masukan
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: isMobile ? '100%' : 'auto' }}>
            <Filter size={16} color="#94a3b8" />
            <select 
              value={filter} 
              onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
              style={{ flex: isMobile ? 1 : 'unset', padding: '0.6rem 1rem', borderRadius: '10px', border: '1.5px solid #f1f5f9', background: '#f8fafc', fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', outline: 'none' }}
            >
              <option value="all">Semua Kategori</option>
              <option value="umum">Umum</option>
              <option value="akademi">Akademi</option>
              <option value="match">Matchmaking</option>
              <option value="bug">Bug</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0' : '1.25rem' }}>
          {filteredFeedback.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Belum ada masukan.</p>
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
                  <div>Pengirim</div>
                  <div>Rating</div>
                  <div>Isi Masukan</div>
                  <div>Tanggal</div>
                  <div>Kategori</div>
                  <div style={{ textAlign: 'right' }}>Aksi</div>
                </div>
              )}

              {currentItems.map(item => {
                if (isMobile) {
                  return (
                    <div key={item.id} className="feedback-compact-row">
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(19,78,57,0.05)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1rem' }}>
                            {item.profiles?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="reviewer-info-text-mobile">
                             <div style={{ fontSize: '0.55rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Oleh</div>
                             <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>{item.profiles?.name || 'User Terhapus'}</div>
                          </div>
                       </div>

                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="action-icon-btn" onClick={() => setSelectedFeedback(item)}>
                            <Eye size={18} />
                          </button>
                          <button className="action-icon-btn" onClick={() => deleteItem(item.id)} style={{ color: '#ef4444', borderColor: '#fee2e2' }}>
                            <Trash2 size={18} />
                          </button>
                       </div>
                    </div>
                  );
                }

                // Desktop View: Compact Row
                return (
                  <div 
                    key={item.id} 
                    className="feedback-compact-row-desktop"
                    style={{ 
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 0.8fr 2fr 0.8fr 0.8fr 1.2fr',
                      alignItems: 'center',
                      padding: '0.75rem 1.25rem',
                      background: 'white',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: '#E4EDE8',
                      borderRadius: '12px',
                      marginBottom: '0.5rem',
                      gap: '1rem'
                    }}
                  >
                    {/* 1. Pengirim */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.85rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {item.profiles?.name || 'User Terhapus'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '750', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {item.profiles?.email}
                        </span>
                      </div>
                    </div>

                    {/* 2. Rating */}
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star 
                          key={s} 
                          size={13} 
                          color={item.rating >= s ? '#D4AF37' : '#e2e8f0'} 
                          fill={item.rating >= s ? '#D4AF37' : 'transparent'} 
                        />
                      ))}
                      <span style={{ fontSize: '0.75rem', fontWeight: '850', color: '#475569', marginLeft: '4px' }}>
                        {item.rating}.0
                      </span>
                    </div>

                    {/* 3. Isi Masukan (Truncated) */}
                    <div 
                      onClick={() => setSelectedFeedback(item)}
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
                      title="Klik untuk detail masukan"
                    >
                      "{item.content}"
                    </div>

                    {/* 4. Tanggal */}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>

                    {/* 5. Kategori Badge */}
                    <div>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '900',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: item.category === 'bug' ? '#fee2e2' : 'rgba(19,78,57,0.08)',
                        color: item.category === 'bug' ? '#dc2626' : '#134E39',
                        display: 'inline-block',
                        textTransform: 'uppercase'
                      }}>
                        {item.category}
                      </span>
                    </div>

                    {/* 6. Aksi */}
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => setSelectedFeedback(item)}
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
                        onClick={() => deleteItem(item.id)}
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
                        title="Hapus"
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

      {/* DETAIL MODAL (Mobile) */}
      {selectedFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedFeedback(null)}>
           <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '95%', padding: 0 }}>
              <div style={{ background: '#134E39', color: 'white', padding: '1.5rem', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '900' }}>Detail Masukan</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', opacity: 0.8 }}>ID: #{selectedFeedback.id.substring(0,8)}</p>
                 </div>
                 <button onClick={() => setSelectedFeedback(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '8px', color: 'white', cursor: 'pointer' }}><XCircle size={20} /></button>
              </div>

              <div style={{ padding: '2rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(19,78,57,0.05)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '900' }}>
                       {selectedFeedback.profiles?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                       <div style={{ fontWeight: '900', color: '#1e293b', fontSize: '1.1rem' }}>{selectedFeedback.profiles?.name || 'User Terhapus'}</div>
                       <div style={{ color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>{selectedFeedback.profiles?.email}</div>
                    </div>
                 </div>

                 <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                       <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Isi Masukan & Rating</div>
                       <div style={{ display: 'flex', gap: '4px' }}>
                          {[1,2,3,4,5].map(v => <Star key={v} size={16} fill={v <= selectedFeedback.rating ? '#D4AF37' : 'none'} color={v <= selectedFeedback.rating ? '#D4AF37' : '#e2e8f0'} />)}
                       </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '1rem', color: '#334155', lineHeight: 1.7 }}>
                       "{selectedFeedback.content}"
                    </div>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>
                       <Clock size={14} /> {new Date(selectedFeedback.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', background: selectedFeedback.category === 'bug' ? '#fee2e2' : '#dcfce7', color: selectedFeedback.category === 'bug' ? '#dc2626' : '#134E39' }}>
                       {selectedFeedback.category}
                    </div>
                 </div>
              </div>

              <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                 <button className="btn btn-primary" onClick={() => setSelectedFeedback(null)} style={{ padding: '0.7rem 2.5rem', borderRadius: '8px' }}>Tutup</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
