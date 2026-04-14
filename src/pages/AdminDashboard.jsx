import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { CheckCircle, XCircle, Users, Activity, FileText, UserCheck, ShieldAlert, Eye, MessageCircle, BarChart2, Send } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { supabase } from '../supabase';

export default function AdminDashboard({ activeTab, setActiveTab }) {
  const { user, cvs, setCvs, taarufRequests, setTaarufRequests, usersDb, showAlert, messages, setMessages, addNotification } = useContext(AppContext);
  const adminName = user?.name || 'Ustadz';
  const [monitoringChatId, setMonitoringChatId] = useState(null);
  const [reviewingCv, setReviewingCv] = useState(null);
  const [chatInput, setChatInput] = useState('');

  const pendingCvs = cvs.filter(cv => cv.status === 'pending');
  const totalApproved = cvs.filter(cv => cv.status === 'approved').length;
  
  const totalUsers = usersDb ? usersDb.filter(u => u.role === 'user').length : 0;
  const totalIkhwan = usersDb ? usersDb.filter(u => u.role === 'user' && u.gender === 'ikhwan').length : 0;
  const totalAkhwat = usersDb ? usersDb.filter(u => u.role === 'user' && u.gender === 'akhwat').length : 0;

  const chartData = [
    { name: 'Ikhwan Aktif', value: totalIkhwan },
    { name: 'Akhwat Aktif', value: totalAkhwat },
  ];
  const COLORS = ['var(--primary)', 'var(--secondary)'];

  const handleApprove = async (id) => {
    try {
      await supabase.from('cv_profiles').update({ status: 'approved' }).eq('id', id);
      setCvs(cvs.map(cv => cv.id === id ? { ...cv, status: 'approved' } : cv));
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id) => {
    try {
      await supabase.from('cv_profiles').delete().eq('id', id);
      setCvs(cvs.filter(cv => cv.id !== id));
    } catch (err) { console.error(err); }
  };

  const updateTaarufStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('taaruf_requests').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) {
        console.error('Supabase update error:', error);
        showAlert('Gagal Update', error.message, 'error');
        return; // Jangan update local state jika gagal
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
    <div style={{ animation: 'fadeIn 0.5s ease' }}>


      <div className="dashboard-grid" style={{ marginTop: 0, marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon primary"><FileText /></div>
          <div className="stat-info">
            <h4>CV Menunggu Review</h4>
            <p>{pendingCvs.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><UserCheck /></div>
          <div className="stat-info">
            <h4>Kandidat Aktif</h4>
            <p>{totalApproved}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon secondary"><Activity /></div>
          <div className="stat-info">
            <h4>Proses Taaruf</h4>
            <p>{taarufRequests.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--accent)', background: 'rgba(238, 155, 0, 0.1)' }}><Users /></div>
          <div className="stat-info">
            <h4>Total Akun User</h4>
            <p style={{ display: 'flex', flexDirection: 'column', fontSize: '1.2rem', gap: '0.2rem' }}>
              <span>{totalUsers} <small style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Pendaftar</small></span>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{totalIkhwan} Ikhwan | {totalAkhwat} Akhwat</span>
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart2 /> Statistik Pendaftar</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '300px', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h4>Ringkasan Data</h4>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                <span>Total Pendaftar (Seluruhnya)</span>
                <strong>{totalUsers}</strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                <span>Total Ikhwan</span>
                <strong style={{ color: 'var(--primary)' }}>{totalIkhwan}</strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                <span>Total Akhwat</span>
                <strong style={{ color: 'var(--secondary)' }}>{totalAkhwat}</strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                <span>CV Menunggu Validasi</span>
                <strong style={{ color: '#E63946' }}>{pendingCvs.length}</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {activeTab === 'review' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Review CV Masuk</h3>
          </div>
          <div className="cv-list">
            {pendingCvs.length > 0 ? (
              pendingCvs.map(cv => (
                <div key={cv.id} className="cv-item">
                  <div className="cv-info">
                    <h4>{cv.alias} <span className="badge badge-warning">Pending</span></h4>
                    <p>{cv.age} thn • {cv.location} • {cv.education} • {cv.job}</p>
                    {cv.about && <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>"{cv.about}"</p>}
                    {cv.criteria && <p style={{ marginTop: '0.25rem', color: 'var(--primary)' }}>Kriteria: {cv.criteria}</p>}
                  </div>
                  <div className="cv-actions" style={{ display: 'flex', flexDirection: 'column' }}>
                    <button className="btn btn-primary" onClick={() => setReviewingCv(cv)}>
                      <Eye size={16} /> Buka & Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <CheckCircle size={48} color="var(--success)" />
                <h3 style={{ marginTop: '1rem' }}>Semua CV telah direview</h3>
                <p>Belum ada CV baru yang masuk.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'mediate' && (
        <div className="card">
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
                    {req.status === 'pending_target' && (
                      <button className="btn btn-outline" onClick={() => {
                        updateTaarufStatus(req.id, 'pending_admin');
                        addNotification(`Mediasi #${req.id} disetujui target (Simulasi), menunggu review Ustadz.`);
                      }}>
                        Simulasikan Target Setuju
                      </button>
                    )}
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
                      <button className="btn btn-warning" onClick={() => setMonitoringChatId(req.id)} style={{ color: '#000' }}>
                        <Eye size={16} /> Pantau Chat Q&A
                      </button>
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
        </div>
      )}
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
                <div className="chat-history">
                  {(!chatData || chatData.chats.length === 0) ? (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <MessageCircle size={40} color="var(--border-color)" />
                      <p style={{ marginTop: '1rem' }}>Belum ada obrolan terekam.</p>
                    </div>
                  ) : (
                    chatData.chats.map(msg => {
                      const isAdmin = msg.sender.includes('admin');
                      return (
                        <div key={msg.id} className={`chat-bubble ${isAdmin ? 'admin' : (msg.sender === req.senderEmail ? 'left' : 'right')}`} style={isAdmin ? { alignSelf: 'center', background: 'var(--bg-card)', border: '1px solid var(--secondary)', textAlign: 'center' } : {}}>
                          <span className="chat-sender-name" style={isAdmin ? { color: 'var(--secondary)' } : {}}>{isAdmin ? 'Ustadz / Admin' : msg.senderAlias}</span>
                          {msg.text}
                          <span className="chat-meta">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      );
                    })
                  )}
                </div>
                
                <form onSubmit={async e => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;
                  
                  try {
                    const { data, error } = await supabase.from('messages').insert({
                      taaruf_request_id: monitoringChatId,
                      sender_id: user.id,
                      text: chatInput
                    }).select('*, sender:sender_id(email, name)').single();
                    
                    if (error) throw error;
                    
                    const newMsg = {
                      id: data.id,
                      sender: data.sender.email,
                      senderAlias: data.sender.name,
                      text: data.text,
                      timestamp: data.created_at
                    };

                    let newChats = chatData ? [...chatData.chats] : [];
                    newChats.push(newMsg);
                    if (chatData) {
                      setMessages(messages.map(m => m.taarufId === monitoringChatId ? { ...m, chats: newChats } : m));
                    } else {
                      setMessages([...messages, { taarufId: monitoringChatId, chats: newChats }]);
                    }
                    setChatInput('');
                  } catch (err) {
                    console.error('Error Admin Chat:', err);
                    showAlert('Gagal Kirim', err.message || 'Gagal mengirim pesan', 'error');
                  }
                }} className="chat-input-area">
                  <input 
                    type="text" 
                    className="chat-input-field" 
                    placeholder="Beri pesan sebagai moderator..." 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                  />
                  <button type="submit" className="chat-send-btn">
                    <Send size={20} />
                  </button>
                </form>
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
      })()}

      {reviewingCv && (
        <div className="modal-overlay" onClick={() => setReviewingCv(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%' }}>
            <div className="modal-header info" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0 }}>Review Detail CV Admin</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cek kesesuaian data sebelum diapprove ke publik.</p>
            </div>
            
            <div className="modal-body" style={{ padding: '2rem 1.5rem', textAlign: 'left', maxHeight: '60vh', overflowY: 'auto' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>Informasi Dasar</h4>
              <p><strong>Alias/Nama Samaran:</strong> {reviewingCv.alias}</p>
              <p><strong>Usia:</strong> {reviewingCv.age} Tahun</p>
              <p><strong>Lokasi:</strong> {reviewingCv.location}</p>
              <p><strong>Pendidikan Terakhir:</strong> {reviewingCv.education}</p>
              <p><strong>Pekerjaan Saat Ini:</strong> {reviewingCv.job}</p>

              <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', marginTop: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>Deskripsi Profil</h4>
              <p><strong>Tentang Saya:</strong><br/>{reviewingCv.about || 'Tidak ada deskripsi'}</p>
              <p style={{ marginTop: '1rem' }}><strong>Kriteria Pasangan:</strong><br/>{reviewingCv.criteria || 'Tidak memberikan kriteria spesifik'}</p>
              {reviewingCv.hobi && <p style={{ marginTop: '1rem' }}><strong>Hobi:</strong><br/>{reviewingCv.hobi}</p>}
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between', padding: '1.5rem' }}>
              <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => {
                handleReject(reviewingCv.id);
                setReviewingCv(null);
                showAlert('Ditolak', 'CV Berhasil Ditolak & Dihapus', 'success');
                addNotification(`CV dari ${reviewingCv.alias} ditolak oleh Ustadz/Admin.`);
              }}>
                <XCircle size={18} /> Tolak CV
              </button>
              <button className="btn btn-success" onClick={() => {
                handleApprove(reviewingCv.id);
                setReviewingCv(null);
                showAlert('Disetujui', 'CV Berhasil Disetujui & Dipublikasikan', 'success');
                addNotification(`CV dari ${reviewingCv.alias} disetujui oleh Ustadz/Admin.`);
              }}>
                <CheckCircle size={18} /> Setujui & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
