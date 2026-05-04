import React, { useState, useEffect, useContext } from 'react';
import { ShieldAlert, Clock, Trash2, ChevronRight } from 'lucide-react';
import { supabase } from '../../supabase';
import { AppContext } from '../../App';

export default function AdminReportsTab({ showAlert }) {
  const { setConfirmState } = useContext(AppContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_reports')
        .select('*, reporter:reporter_id(name, email), reported_user:reported_user_id(name, email), reported_cv:reported_cv_id(alias)')
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
          showAlert('Berhasil', 'Data telah dihapus.', 'success');
        } catch (err) {
          showAlert('Error', 'Gagal menghapus data.', 'error');
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const filteredReports = reports.filter(r => filter === 'all' || r.reason === filter);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Memuat data laporan...</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} color="#ef4444" /> Laporan Pelanggaran User
          </h3>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.85rem', outline: 'none' }}
          >
            <option value="all">Semua Alasan</option>
            <option value="Ketidakjujuran">Ketidakjujuran</option>
            <option value="Perilaku Tidak Sopan">Tidak Sopan</option>
            <option value="Foto/Profil Tidak Pantas">Profil Tidak Pantas</option>
            <option value="Penipuan">Penipuan/Spam</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              <ShieldAlert size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Belum ada laporan pelanggaran.</p>
            </div>
          ) : filteredReports.map(report => (
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
                 <button onClick={() => deleteItem(report.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Trash2 size={14} /> Abaikan & Hapus
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
