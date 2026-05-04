import React, { useState, useEffect, useContext } from 'react';
import { MessageSquare, Star, Clock, Filter, Trash2, PieChart as PieChartIcon, Eye, XCircle, User } from 'lucide-react';
import { supabase } from '../../supabase';
import { AppContext } from '../../App';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function AdminFeedbackTab({ showAlert }) {
  const { setConfirmState } = useContext(AppContext);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
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
        } catch (err) {
          showAlert('Error', 'Gagal menghapus data.', 'error');
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const filteredFeedback = feedback.filter(f => filter === 'all' || f.category === filter);

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
          border-radius: 20px;
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
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .feedback-card-desktop {
          padding: 1.5rem;
          border-radius: 24px;
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
              <div style={{ background: 'rgba(19,78,57,0.05)', color: '#134E39', padding: '10px', borderRadius: '12px' }}>
                <PieChartIcon size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#1e293b' }}>Statistik Masukan</h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', flex: 1, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Rating Avg</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39' }}>{avgRating} <Star size={14} fill="#D4AF37" color="#D4AF37" /></div>
               </div>
               <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', flex: 1, border: '1px solid #f1f5f9' }}>
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

      <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem', borderRadius: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', color: '#134E39', fontSize: isMobile ? '1.2rem' : '1.5rem' }}>
            <MessageSquare size={20} color="#134E39" /> Saran & Masukan
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: isMobile ? '100%' : 'auto' }}>
            <Filter size={16} color="#94a3b8" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ flex: isMobile ? 1 : 'unset', padding: '0.6rem 1rem', borderRadius: '14px', border: '1.5px solid #f1f5f9', background: '#f8fafc', fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', outline: 'none' }}
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
          ) : filteredFeedback.map(item => {
            if (isMobile) {
              return (
                <div key={item.id} className="feedback-compact-row">
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(19,78,57,0.05)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1rem' }}>
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

            // Desktop View
            return (
              <div key={item.id} className="feedback-card-desktop">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'white', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#134E39', fontSize: '1.1rem' }}>
                      {item.profiles?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: '900', fontSize: '1rem', color: '#1e293b' }}>{item.profiles?.name || 'User Terhapus'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>{item.profiles?.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '2px', color: '#D4AF37', marginBottom: '0.25rem', justifyContent: 'flex-end' }}>
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={item.rating >= s ? '#D4AF37' : 'none'} color={item.rating >= s ? '#D4AF37' : '#e2e8f0'} />)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', fontWeight: '600' }}>
                      <Clock size={12} /> {new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.25rem', border: '1px solid #f1f5f9', fontSize: '0.95rem', lineHeight: 1.6, color: '#334155' }}>
                  "{item.content}"
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', padding: '6px 14px', borderRadius: '10px', background: item.category === 'bug' ? '#fee2e2' : 'rgba(19,78,57,0.08)', color: item.category === 'bug' ? '#dc2626' : '#134E39', letterSpacing: '0.05em' }}>
                    {item.category}
                  </span>
                  <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>
                    <Trash2 size={16} /> HAPUS
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAIL MODAL (Mobile) */}
      {selectedFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedFeedback(null)}>
           <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '95%', padding: 0 }}>
              <div style={{ background: '#134E39', color: 'white', padding: '1.5rem', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '900' }}>Detail Masukan</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', opacity: 0.8 }}>ID: #{selectedFeedback.id.substring(0,8)}</p>
                 </div>
                 <button onClick={() => setSelectedFeedback(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '10px', color: 'white', cursor: 'pointer' }}><XCircle size={20} /></button>
              </div>

              <div style={{ padding: '2rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(19,78,57,0.05)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '900' }}>
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
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9', fontSize: '1rem', color: '#334155', lineHeight: 1.7 }}>
                       "{selectedFeedback.content}"
                    </div>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>
                       <Clock size={14} /> {new Date(selectedFeedback.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', background: selectedFeedback.category === 'bug' ? '#fee2e2' : '#dcfce7', color: selectedFeedback.category === 'bug' ? '#dc2626' : '#134E39' }}>
                       {selectedFeedback.category}
                    </div>
                 </div>
              </div>

              <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                 <button className="btn btn-primary" onClick={() => setSelectedFeedback(null)} style={{ padding: '0.7rem 2.5rem' }}>Tutup</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
