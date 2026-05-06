import React, { useState, useEffect, useContext } from 'react';
import { ShieldAlert, Clock, Trash2, ChevronRight, Eye, User, Mail, AlertTriangle, X, ShieldCheck, MessageSquare } from 'lucide-react';
import { supabase } from '../../supabase';
import { AppContext } from '../../App';

export default function AdminReportsTab({ showAlert, setViewingUser, usersDb }) {
  const { setConfirmState } = useContext(AppContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_reports')
        .select('*, reporter:reporter_id(*), reported_user:reported_user_id(*), reported_cv:reported_cv_id(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Laporan?',
      message: 'Apakah Anda yakin ingin menghapus data ini secara permanen?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('user_reports').delete().eq('id', id);
          if (error) throw error;
          setReports(prev => prev.filter(r => r.id !== id));
          if (selectedReport?.id === id) setSelectedReport(null);
          showAlert('Berhasil', 'Data telah dihapus.', 'success');
        } catch (err) {
          showAlert('Error', 'Gagal menghapus data.', 'error');
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleViewUser = (userId) => {
    const userObj = usersDb.find(u => u.id === userId);
    if (userObj) {
      setViewingUser(userObj);
    } else {
      showAlert('Gagal', 'Data user tidak ditemukan dalam database lokal.', 'error');
    }
  };

  const markAsReviewed = async (id) => {
    try {
      const { error } = await supabase.from('user_reports').update({ status: 'reviewed' }).eq('id', id);
      if (error) throw error;
      showAlert('Berhasil', 'Laporan ditandai telah ditinjau.', 'success');
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'reviewed' } : r));
      if (selectedReport?.id === id) setSelectedReport(prev => ({ ...prev, status: 'reviewed' }));
    } catch (err) {
      showAlert('Error', 'Gagal memperbarui status.', 'error');
    }
  };

  const filteredReports = reports.filter(r => filter === 'all' || r.reason === filter);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Memuat data laporan...</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        .report-list-item {
          padding: 1.25rem 1.5rem;
          border-radius: 12px;
          background: white;
          border: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .report-list-item:hover { 
          border-color: #fee2e2; 
          background: #fffbfa;
          transform: translateX(4px);
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
        }
        .status-dot.reviewed { background: #cbd5e1; box-shadow: none; }
        
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease;
        }
        .report-detail-modal {
          width: 95%;
          max-width: 550px;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 640px) {
          .report-list-item { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
          .item-actions { width: 100%; justify-content: flex-end; }
          .reason-badge { order: 2; }
          .reporter-info { order: 1; }
          .modal-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
        <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: '950', color: '#134E39', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem' }}>
              <ShieldAlert size={24} color="#ef4444" /> Laporan Masuk
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Terdapat {reports.filter(r => r.status !== 'reviewed').length} laporan yang butuh perhatian.</p>
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1.5px solid #f1f5f9', background: 'white', fontSize: '0.85rem', fontWeight: '700', color: '#134E39', outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">Semua Alasan</option>
            <option value="Ketidakjujuran">Ketidakjujuran</option>
            <option value="Perilaku Tidak Sopan">Tidak Sopan</option>
            <option value="Foto/Profil Tidak Pantas">Profil Tidak Pantas</option>
            <option value="Penipuan">Penipuan/Spam</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#94a3b8' }}>
              <div style={{ width: 80, height: 80, borderRadius: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <ShieldCheck size={40} style={{ opacity: 0.2 }} />
              </div>
              <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>Kotak Laporan Kosong</p>
              <p style={{ fontSize: '0.85rem', fontWeight: '500' }}>Belum ada laporan baru saat ini.</p>
            </div>
          ) : filteredReports.map(report => (
            <div key={report.id} className="report-list-item" onClick={() => setSelectedReport(report)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }} className="reporter-info">
                <div className={`status-dot ${report.status === 'reviewed' ? 'reviewed' : ''}`} />
                <div style={{ width: 44, height: 44, borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#134E39', border: '1px solid #e2e8f0' }}>
                  {report.reporter?.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#1e293b' }}>{report.reporter?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>{new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {report.reporter?.email}</div>
                </div>
              </div>

              <div className="reason-badge">
                <span style={{ 
                  background: report.status === 'reviewed' ? '#f1f5f9' : '#fee2e2', 
                  color: report.status === 'reviewed' ? '#64748b' : '#ef4444', 
                  padding: '6px 14px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' 
                }}>
                  {report.reason}
                </span>
              </div>

              <div className="item-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                  style={{ background: '#f8fafc', border: 'none', width: 36, height: 36, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
                >
                  <Eye size={18} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteItem(report.id); }}
                  style={{ background: 'transparent', border: 'none', width: 36, height: 36, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔴 REPORT DETAIL MODAL 🔴 */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="report-detail-modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '2rem', background: '#fff1f2', borderBottom: '1px solid #fee2e2', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <ShieldAlert size={24} color="#ef4444" />
                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Detail Pelanggaran</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '950', color: '#134E39', margin: 0 }}>{selectedReport.reason}</h2>
              <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Dilaporkan pada {new Date(selectedReport.created_at).toLocaleString('id-ID')}</p>
              
              <button onClick={() => setSelectedReport(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: 'none', width: 40, height: 40, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              <div className="modal-grid">
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>Pelapor</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', flexShrink: 0 }}>{selectedReport.reporter?.name?.charAt(0)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedReport.reporter?.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedReport.reporter?.email}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase', marginBottom: '10px' }}>Terlapor</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'white', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#ef4444', flexShrink: 0 }}>{selectedReport.reported_cv?.alias?.charAt(0) || '?'}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#134E39', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedReport.reported_cv?.alias || 'User'}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedReport.reported_user?.name}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleViewUser(selectedReport.reported_user_id)}
                      style={{ background: '#134E39', color: 'white', border: 'none', width: 32, height: 32, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                      title="Lihat Profil"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#134E39' }}>
                  <MessageSquare size={16} />
                  <span style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>Isi Laporan</span>
                </div>
                <div style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.6, fontWeight: '500' }}>{selectedReport.details || 'Tidak ada detail tambahan.'}</div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => markAsReviewed(selectedReport.id)}
                  disabled={selectedReport.status === 'reviewed'}
                  style={{ flex: 2, background: selectedReport.status === 'reviewed' ? '#f1f5f9' : '#134E39', color: selectedReport.status === 'reviewed' ? '#94a3b8' : 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: '900', fontSize: '0.95rem', cursor: selectedReport.status === 'reviewed' ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: selectedReport.status === 'reviewed' ? 'none' : '0 10px 20px rgba(19, 78, 57, 0.2)' }}
                >
                  {selectedReport.status === 'reviewed' ? 'Laporan Telah Ditinjau' : 'Tandai Selesai'}
                </button>
                <button 
                  onClick={() => deleteItem(selectedReport.id)}
                  style={{ flex: 1, background: '#fef2f2', color: '#ef4444', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer' }}
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
