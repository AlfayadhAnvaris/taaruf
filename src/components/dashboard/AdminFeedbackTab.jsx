import React, { useState, useEffect, useContext } from 'react';
import { MessageSquare, Star, Clock, User, Filter, Trash2, PieChart as PieChartIcon, ShieldAlert, ChevronRight } from 'lucide-react';
import { supabase } from '../../supabase';
import { AppContext } from '../../App';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export default function AdminFeedbackTab({ showAlert }) {
  const { setConfirmState } = useContext(AppContext);
  const [feedback, setFeedback] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('feedback'); // 'feedback' or 'reports'
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchFeedback(), fetchReports()]);
    setLoading(false);
  };

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('site_feedback')
        .select('*, profiles(name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('user_reports')
        .select('*, reporter:reporter_id(name, email), reported_user:reported_user_id(name, email), reported_cv:reported_cv_id(alias)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const deleteItem = (id, table) => {
    setConfirmState({
      isOpen: true,
      title: table === 'site_feedback' ? 'Hapus Masukan?' : 'Hapus Laporan?',
      message: 'Apakah Anda yakin ingin menghapus data ini secara permanen?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from(table).delete().eq('id', id);
          if (error) throw error;
          if (table === 'site_feedback') {
            setFeedback(prev => prev.filter(f => f.id !== id));
          } else {
            setReports(prev => prev.filter(r => r.id !== id));
          }
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
  const filteredReports = reports.filter(r => filter === 'all' || r.reason === filter);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Memuat masukan...</div>;
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
      {/* 📊 Summary Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ flex: '1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(19,78,57,0.05)', color: '#134E39', padding: '10px', borderRadius: '12px' }}>
                <PieChartIcon size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#1e293b' }}>Masukan Situs</h3>
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

        <div className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'linear-gradient(135deg, #fff 0%, #fff5f5 100%)' }}>
           <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                <div style={{ background: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '12px' }}>
                  <ShieldAlert size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#1e293b' }}>Laporan Pelanggaran</h3>
              </div>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '20px', border: '1px solid #fee2e2' }}>
                 <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Laporan Tertunda</div>
                 <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#ef4444' }}>{reports.filter(r => r.status === 'pending').length}</div>
              </div>
           </div>
           <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>Tinjau laporan dari pengguna terkait ketidakjujuran atau perilaku tidak sopan di platform.</p>
           </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
           <button 
             onClick={() => { setActiveSubTab('feedback'); setFilter('all'); }}
             style={{ flex: 1, padding: '1.25rem', border: 'none', background: activeSubTab === 'feedback' ? 'white' : '#f8fafc', borderBottom: activeSubTab === 'feedback' ? '3px solid var(--primary)' : 'none', color: activeSubTab === 'feedback' ? 'var(--primary)' : '#64748b', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
           >
             SARAN SITUS ({feedback.length})
           </button>
           <button 
             onClick={() => { setActiveSubTab('reports'); setFilter('all'); }}
             style={{ flex: 1, padding: '1.25rem', border: 'none', background: activeSubTab === 'reports' ? 'white' : '#f8fafc', borderBottom: activeSubTab === 'reports' ? '3px solid #ef4444' : 'none', color: activeSubTab === 'reports' ? '#ef4444' : '#64748b', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
           >
             LAPORAN USER ({reports.length})
           </button>
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {activeSubTab === 'feedback' ? <MessageSquare size={20} color="var(--primary)" /> : <ShieldAlert size={20} color="#ef4444" />}
              {activeSubTab === 'feedback' ? 'Feedback Masuk' : 'Daftar Laporan Pelanggaran'}
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Filter size={16} color="var(--text-muted)" />
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.85rem' }}
              >
                {activeSubTab === 'feedback' ? (
                  <>
                    <option value="all">Semua Kategori</option>
                    <option value="umum">Umum</option>
                    <option value="akademi">Akademi</option>
                    <option value="match">Matchmaking</option>
                    <option value="bug">Bug</option>
                  </>
                ) : (
                  <>
                    <option value="all">Semua Alasan</option>
                    <option value="Ketidakjujuran">Ketidakjujuran</option>
                    <option value="Perilaku Tidak Sopan">Tidak Sopan</option>
                    <option value="Foto/Profil Tidak Pantas">Profil Tidak Pantas</option>
                    <option value="Penipuan">Penipuan/Spam</option>
                    <option value="Lainnya">Lainnya</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {activeSubTab === 'feedback' ? (
            /* FEEDBACK LIST */
            filteredFeedback.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Belum ada masukan untuk kategori ini.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {filteredFeedback.map(item => (
                  <div key={item.id} style={{ padding: '1.5rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>
                          {item.profiles?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{item.profiles?.name || 'User Terhapus'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.profiles?.email}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '2px', color: '#D4AF37', marginBottom: '0.25rem' }}>
                          {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill={item.rating >= s ? '#D4AF37' : 'none'} color={item.rating >= s ? '#D4AF37' : '#e2e8f0'} />)}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                          <Clock size={10} /> {new Date(item.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #f1f5f9', fontSize: '0.9rem' }}>{item.content}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '99px', background: item.category === 'bug' ? '#fee2e2' : 'rgba(19,78,57,0.1)', color: item.category === 'bug' ? '#dc2626' : '#134E39' }}>{item.category}</span>
                      <button onClick={() => deleteItem(item.id, 'site_feedback')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* REPORTS LIST */
            filteredReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <ShieldAlert size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Belum ada laporan pelanggaran.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {filteredReports.map(report => (
                  <div key={report.id} style={{ padding: '1.5rem', borderRadius: '24px', background: 'white', border: '1px solid #fee2e2', boxShadow: '0 10px 30px rgba(220,38,38,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                       <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                          <div>
                             <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Pelapor</div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{report.reporter?.name?.charAt(0)}</div>
                                <div>
                                   <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{report.reporter?.name}</div>
                                   <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{report.reporter?.email}</div>
                                </div>
                             </div>
                          </div>
                          <div style={{ color: '#ef4444' }}><ChevronRight size={24} style={{ marginTop: '1rem' }} /></div>
                          <div>
                             <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', marginBottom: '8px' }}>Terlapor (Kandidat)</div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fef2f2', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: '#ef4444' }}>{report.reported_cv?.alias?.charAt(0)}</div>
                                <div>
                                   <div style={{ fontWeight: '900', fontSize: '0.85rem', color: '#134E39' }}>{report.reported_cv?.alias}</div>
                                   <div style={{ fontSize: '0.7rem', color: '#64748b' }}>User: {report.reported_user?.name}</div>
                                </div>
                             </div>
                          </div>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                          <span style={{ background: '#fee2e2', color: '#ef4444', padding: '6px 12px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase' }}>{report.reason}</span>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '8px' }}>{new Date(report.created_at).toLocaleString()}</div>
                       </div>
                    </div>
                    
                    <div style={{ background: '#fff1f2', padding: '1.25rem', borderRadius: '16px', border: '1px dashed #fecaca', marginBottom: '1.5rem' }}>
                       <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#ef4444', marginBottom: '6px' }}>DETAIL LAPORAN:</div>
                       <div style={{ fontSize: '0.9rem', color: '#451a1a', lineHeight: 1.6 }}>{report.details || 'Tidak ada detail tambahan.'}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                       <button 
                         onClick={async () => {
                           const { error } = await supabase.from('user_reports').update({ status: 'reviewed' }).eq('id', report.id);
                           if (!error) {
                             showAlert('Berhasil', 'Laporan ditandai telah ditinjau.', 'success');
                             fetchReports();
                           }
                         }}
                         style={{ background: 'none', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                       >
                         Tandai Selesai
                       </button>
                       <button onClick={() => deleteItem(report.id, 'user_reports')} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Trash2 size={14} /> Abaikan & Hapus
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
