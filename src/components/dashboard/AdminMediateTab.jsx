import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import { CheckCircle, XCircle, ShieldAlert, MessageCircle, Eye } from 'lucide-react';
import { supabase } from '../../supabase';

export default function AdminMediateTab() {
  const { user, taarufRequests, setTaarufRequests, showAlert, messages, setMessages, addNotification } = useContext(AppContext);
  const [monitoringChatId, setMonitoringChatId] = useState(null);

  const updateTaarufStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('taaruf_requests').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) {
        console.error('Supabase update error:', error);
        showAlert('Gagal Update', error.message, 'error');
        return;
      }
      setTaarufRequests(taarufRequests.map(req => 
        req.id === id ? { ...req, status: newStatus, updatedAt: new Date().toISOString() } : req
      ));
    } catch (err) { 
      console.error(err); 
      showAlert('Gagal', 'Terjadi kesalahan sistem saat update status.', 'error');
    }
  };

  return (
    <div className="card" style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="card-header">
        <h3 className="card-title">Daftar Permintaan Taaruf (Mediasi)</h3>
      </div>
      <div className="cv-list">
        {taarufRequests.length > 0 ? (
          taarufRequests.map(req => (
            <div key={req.id} className="cv-item" style={{ background: '#fef3c7', borderColor: '#fbbf24' }}>
              <div className="cv-info">
                <h4>Proses Mediasi #{req.id}</h4>
                <p><strong>Pengirim:</strong> {req.senderAlias} ({req.senderEmail})</p>
                <p><strong>Target:</strong> {req.targetAlias}</p>
                <p style={{ marginTop: '0.5rem' }}>Status Saat Ini: <span className="badge badge-warning" style={{ textTransform: 'capitalize' }}>{req.status.replace('_', ' ')}</span></p>
              </div>
              <div className="cv-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Simulasi target setuju dihapus karena admin hanya pantau & review */}
                {req.status === 'pending_admin' && (
                  <>
                    <p style={{ fontSize: '0.85rem', color: 'var(--success)' }}>✔ Target telah setuju. Perlu verifikasi Anda sebelum Q&A dibuka.</p>
                    <button className="btn btn-success" onClick={() => {
                      updateTaarufStatus(req.id, 'qna');
                      addNotification(`Mediasi #${req.id} disetujui ustadz. Masuk ke fase Q&A.`);
                    }}>
                      <CheckCircle size={16} /> Setujui & Buka Ruang Q&A
                    </button>
                    <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => {
                      updateTaarufStatus(req.id, 'rejected');
                      addNotification(`Mediasi #${req.id} ditolak ustadz.`);
                    }}>
                      <XCircle size={16} /> Tolak Pengajuan
                    </button>
                  </>
                )}
                {req.status === 'qna' && (
                  <>
                    <button className="btn btn-warning" onClick={() => setMonitoringChatId(req.id)} style={{ color: '#000' }}>
                      <Eye size={16} /> Pantau Chat Q&A
                    </button>
                    <button className="btn btn-primary" style={{ marginTop: '0.25rem' }} onClick={() => {
                      updateTaarufStatus(req.id, 'wali_process');
                      addNotification(`Sesi Q&A Mediasi #${req.id} selesai. Silakan hubungi wali.`);
                    }}>
                      <CheckCircle size={16} /> Selesaikan Q&A & Tahap Wali
                    </button>
                  </>
                )}
                {req.status === 'wali_process' && (
                  <div style={{ padding: '0.5rem', background: 'rgba(44, 95, 77, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Sedang Proses Wali/Pertemuan</span>
                    <button className="btn btn-outline" style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.8rem' }} onClick={() => updateTaarufStatus(req.id, 'meet')}>
                      Sudah Pertemuan (Nadzhor)
                    </button>
                  </div>
                )}
                {req.status === 'meet' && (
                  <div style={{ padding: '0.5rem', background: 'var(--secondary-light)', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ color: '#854d0e', fontWeight: 'bold' }}>Menunggu Kabar Khithbah</span>
                    <button className="btn btn-success" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => updateTaarufStatus(req.id, 'completed')}>
                      Tandai Berhasil (Nikah)
                    </button>
                  </div>
                )}
                {req.status === 'completed' && (
                  <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>🎉 Alhamdulillah Berhasil</span>
                )}
                {req.status === 'rejected' && (
                  <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Proses Ditolak</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>Tidak ada permintaan mediasi.</p>
          </div>
        )}
      </div>

      {monitoringChatId && (() => {
        const req = taarufRequests.find(r => r.id === monitoringChatId);
        const chatData = messages.find(m => m.taarufId === monitoringChatId);
        
        return (
          <div className="modal-overlay" onClick={() => setMonitoringChatId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%' }}>
              <div className="admin-warning">
                <ShieldAlert size={18} /> Pemantauan Percakapan - Khusus Ustadz / Moderator
              </div>
              <div className="modal-header info" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', flexDirection: 'row', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '1.1rem' }}>Mediasi #{req.id}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{req.senderAlias} & {req.targetAlias}</p>
                </div>
                <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => setMonitoringChatId(null)}>Tutup</button>
              </div>
              
              <div className="chat-container" style={{ borderTop: 'none', borderRadius: '0', boxShadow: 'none' }}>
                <div className="chat-history" style={{ maxHeight: '400px' }}>
                  {(!chatData || chatData.chats.length === 0) ? (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <MessageCircle size={40} color="var(--border-color)" />
                      <p style={{ marginTop: '1rem' }}>Belum ada obrolan terekam.</p>
                    </div>
                  ) : (
                    chatData.chats.map(msg => {
                      const isSender = msg.sender === req.senderEmail;
                      return (
                        <div key={msg.id} className={`chat-bubble ${isSender ? 'left' : 'right'}`}>
                          <span className="chat-sender-name">{msg.senderAlias}</span>
                          {msg.text}
                          <span className="chat-meta">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* Mode Monitoring Saja - Input Chat Admin Dihapus */}
                <div style={{ padding: '1rem', background: 'var(--bg-color)', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  Mode Pemantauan: Admin tidak dapat mengirim pesan di ruang Q&A.
                </div>
              </div>

              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Peringatkan Kandidat
                </button>
                <button className="btn btn-success" onClick={() => {
                  showAlert('Konfirmasi Berhasil', 'Proses taaruf disetujui ustadz untuk lanjut ke Proses Wali', 'success');
                  updateTaarufStatus(req.id, 'wali_process');
                  addNotification(`Mediasi #${req.id} lanjut ke Proses Wali.`);
                  setMonitoringChatId(null);
                }}>
                  Teruskan ke Proses Wali
                </button>
              </div>
            </div>
          </div>
        );
      })()})
    </div>
  );
}
