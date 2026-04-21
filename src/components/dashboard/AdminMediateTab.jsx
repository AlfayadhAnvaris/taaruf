import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import { CheckCircle, XCircle, ShieldAlert, MessageCircle, Eye, Search, Filter, ChevronLeft, ChevronRight, Clock, User, Users, Activity, Phone, ExternalLink, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../supabase';

export default function AdminMediateTab() {
  const { taarufRequests, setTaarufRequests, showAlert, messages, addNotification } = useContext(AppContext);
  const [monitoringChatId, setMonitoringChatId] = useState(null);
  const [verifyingWaliId, setVerifyingWaliId] = useState(null); // ID request yang akan diverifikasi walinya
  
  // Pagination & Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestToDelete, setRequestToDelete] = useState(null); // ID request yang akan dihapus
  const itemsPerPage = 5;

  const updateTaarufStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('taaruf_requests').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) {
        showAlert('Gagal Update', error.message, 'error');
        return;
      }
      setTaarufRequests(taarufRequests.map(req => 
        req.id === id ? { ...req, status: newStatus, updatedAt: new Date().toISOString() } : req
      ));
    } catch (err) { 
      showAlert('Gagal', 'Terjadi kesalahan sistem saat update status.', 'error');
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      const { error } = await supabase.from('taaruf_requests').delete().eq('id', id);
      if (error) {
        showAlert('Gagal Menghapus', error.message, 'error');
        return;
      }
      setTaarufRequests(taarufRequests.filter(req => req.id !== id));
      showAlert('Terhapus', 'Permintaan mediasi berhasil dihapus.', 'success');
      setRequestToDelete(null);
    } catch (err) {
      showAlert('Gagal', 'Terjadi kesalahan sistem saat menghapus data.', 'error');
    }
  };

  // Filter Logic
  const filteredRequests = taarufRequests.filter(req => {
    const matchesSearch = 
      req.senderAlias.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.targetAlias.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(req.id).includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending_target': return { bg: '#fef3c7', text: '#92400e', label: 'Menunggu Persetujuan' };
      case 'pending_admin': return { bg: '#e0f2fe', text: '#0369a1', label: 'Verifikasi Ustadz' };
      case 'qna': return { bg: '#f0fdf4', text: '#166534', label: 'Sesi Q&A' };
      case 'wali_process': return { bg: '#faf5ff', text: '#6b21a8', label: 'Proses Wali' };
      case 'meet': return { bg: '#fdf2f8', text: '#9d174d', label: 'Nadzhor/Pertemuan' };
      case 'completed': return { bg: '#f0fdf4', text: '#15803d', label: 'Berhasil/Nikah' };
      case 'rejected': return { bg: '#fef2f2', text: '#991b1b', label: 'Dibatalkan' };
      default: return { bg: '#f1f5f9', text: '#475569', label: status };
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* 🟢 Search & Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Cari berdasarkan nama atau ID mediasi..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="form-control"
              style={{ paddingLeft: '2.5rem', height: '45px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Filter size={18} color="#64748b" />
            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="form-control" 
              style={{ width: '180px', height: '45px' }}
            >
              <option value="all">Semua Status</option>
              <option value="pending_admin">Verifikasi Ustadz</option>
              <option value="qna">Sesi Q&A</option>
              <option value="wali_process">Proses Wali</option>
              <option value="meet">Nadzhor</option>
              <option value="completed">Berhasil</option>
              <option value="rejected">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🟢 Mediation List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {currentItems.length > 0 ? (
          currentItems.map(req => {
            const config = getStatusConfig(req.status);
            return (
              <div key={req.id} className="card" style={{ 
                padding: '1.5rem', borderLeft: `6px solid ${config.text}`,
                display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center',
                transition: 'all 0.2s', position: 'relative'
              }}>
                <div style={{ flex: '1', minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#94a3b8', background: '#f8fafc', padding: '2px 8px', borderRadius: '6px' }}>#{req.id.substring(0, 8)}</span>
                    <span style={{ background: config.bg, color: config.text, padding: '4px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800', border: `1px solid ${config.text}20` }}>
                      {config.label}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1' }}><User size={16} /></div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Pengirim</div>
                        <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#1e293b' }}>{req.senderAlias}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#be185d' }}><User size={16} /></div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Target</div>
                        <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#1e293b' }}>{req.targetAlias}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {req.status === 'pending_admin' && (
                    <>
                      <button className="btn btn-success" style={{ padding: '0.6rem 1.2rem', borderRadius: '12px' }} onClick={() => {
                        updateTaarufStatus(req.id, 'qna');
                        addNotification(`Mediasi #${req.id.substring(0,8)} disetujui ustadz. Fase Q&A dibuka.`, req.senderId);
                        addNotification(`Mediasi #${req.id.substring(0,8)} disetujui ustadz. Fase Q&A dibuka.`, req.targetUserId);
                      }}>
                        <CheckCircle size={16} /> Setujui
                      </button>
                      <button className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#fee2e2', padding: '0.6rem 1.2rem', borderRadius: '12px' }} onClick={() => updateTaarufStatus(req.id, 'rejected')}>
                        <XCircle size={16} /> Tolak
                      </button>
                    </>
                  )}

                  {req.status === 'qna' && (
                    <>
                      <button className="btn btn-warning" onClick={() => setMonitoringChatId(req.id)} style={{ color: '#92400e', background: '#fef3c7', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '12px' }}>
                        <Eye size={16} /> Pantau Q&A
                      </button>
                      <button className="btn btn-primary" onClick={() => setVerifyingWaliId(req.id)} style={{ padding: '0.6rem 1.2rem', borderRadius: '12px' }}>
                        <Phone size={16} /> Verifikasi Wali
                      </button>
                    </>
                  )}

                  {req.status === 'wali_process' && (
                    <button className="btn btn-outline" style={{ padding: '0.6rem 1.2rem', borderRadius: '12px', borderColor: '#134E39', color: '#134E39' }} onClick={() => updateTaarufStatus(req.id, 'meet')}>
                      Sudah Nadzhor
                    </button>
                  )}

                  {req.status === 'meet' && (
                    <button className="btn btn-success" style={{ padding: '0.6rem 1.2rem', borderRadius: '12px' }} onClick={() => updateTaarufStatus(req.id, 'completed')}>
                      Sudah Menikah
                    </button>
                  )}

                  {req.status === 'completed' && <div style={{ color: '#15803d', fontWeight: '900', fontSize: '0.85rem' }}>BERHASIL NIKAH</div>}
                  {req.status === 'rejected' && <div style={{ color: '#991b1b', fontWeight: '900', fontSize: '0.85rem' }}>DIBATALKAN</div>}

                  <button 
                    onClick={() => setRequestToDelete(req.id)}
                    style={{ 
                      padding: '0.6rem', borderRadius: '12px', background: '#fef2f2', 
                      color: '#991b1b', border: '1px solid #fee2e2', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Hapus Mediasi"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p style={{ fontWeight: '700' }}>Tidak ada permintaan mediasi yang ditemukan.</p>
          </div>
        )}
      </div>

      {/* 🟢 Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => prev - 1)}
            style={{ padding: '0.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', color: currentPage === 1 ? '#cbd5e1' : '#134E39', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#64748b' }}>Halaman {currentPage} dari {totalPages}</span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(prev => prev + 1)}
            style={{ padding: '0.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', color: currentPage === totalPages ? '#cbd5e1' : '#134E39', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* 🟢 Wali Verification Modal */}
      {verifyingWaliId && (() => {
        const req = taarufRequests.find(r => r.id === verifyingWaliId);
        return (
          <div className="modal-overlay" onClick={() => setVerifyingWaliId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '95%', padding: 0 }}>
              <div style={{ background: '#2563eb', color: 'white', padding: '1.5rem', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '900' }}>Verifikasi Kontak Wali</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Konfirmasi nomor wali sebelum proses lanjut</p>
                </div>
                <button onClick={() => setVerifyingWaliId(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '10px', color: 'white', cursor: 'pointer' }}><XCircle size={20} /></button>
              </div>

              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Wali Sender */}
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Wali {req.senderAlias} (Pengirim)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#134E39' }}>{req.senderWaliPhone || '-'}</div>
                      <a href={`https://wa.me/${req.senderWaliPhone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
                        <ExternalLink size={14} /> Hubungi
                      </a>
                    </div>
                  </div>

                  {/* Wali Target */}
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Wali {req.targetAlias} (Target)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#134E39' }}>{req.targetWaliPhone || '-'}</div>
                      <a href={`https://wa.me/${req.targetWaliPhone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
                        <ExternalLink size={14} /> Hubungi
                      </a>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '2rem', padding: '1rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'flex', gap: '10px' }}>
                  <ShieldAlert size={20} color="#1d4ed8" />
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#1e40af', fontWeight: '500' }}>Pastikan Anda telah melakukan verifikasi manual kepada kedua wali sebelum meneruskan proses ini.</p>
                </div>
              </div>

              <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn btn-outline" onClick={() => setVerifyingWaliId(null)}>Batal</button>
                <button className="btn btn-primary" style={{ padding: '0.7rem 2rem' }} onClick={() => {
                  updateTaarufStatus(req.id, 'wali_process');
                  addNotification(`Verifikasi Wali selesai. Mediasi #${req.id.substring(0,8)} masuk ke Tahap Wali.`);
                  setVerifyingWaliId(null);
                }}>Verifikasi Selesai & Lanjut</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 🟢 Monitoring Modal */}
      {monitoringChatId && (() => {
        const req = taarufRequests.find(r => r.id === monitoringChatId);
        const chatData = messages.find(m => m.taarufId === monitoringChatId);
        
        return (
          <div className="modal-overlay" onClick={() => setMonitoringChatId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '95%', padding: 0 }}>
              <div style={{ background: '#134E39', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '900' }}>Pemantauan Mediasi</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>ID: #{req.id}</p>
                </div>
                <button onClick={() => setMonitoringChatId(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '10px', color: 'white', cursor: 'pointer' }}><XCircle size={20} /></button>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #f1f5f9' }}>
                   <ShieldAlert size={20} color="#134E39" />
                   <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Anda sedang memantau percakapan Q&A antara <strong>{req.senderAlias}</strong> dan <strong>{req.targetAlias}</strong>. Patuhi kode etik kerahasiaan Mawaddah.</p>
                </div>

                <div className="chat-container" style={{ border: '1px solid #f1f5f9', borderRadius: '20px', overflow: 'hidden' }}>
                  <div className="chat-history" style={{ maxHeight: '400px', padding: '1rem' }}>
                    {(!chatData || chatData.chats.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                        <MessageCircle size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>Belum ada percakapan Q&A di ruangan ini.</p>
                      </div>
                    ) : (
                      chatData.chats.map(msg => {
                        const isSender = msg.sender === req.senderEmail;
                        return (
                          <div key={msg.id} className={`chat-bubble ${isSender ? 'left' : 'right'}`} style={{ maxWidth: '85%' }}>
                            <span className="chat-sender-name" style={{ marginBottom: '4px', fontWeight: '900' }}>{msg.senderAlias}</span>
                            {msg.text}
                            <span className="chat-meta">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div style={{ background: '#f1f5f9', padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sesi Pemantauan Aktif
                  </div>
                </div>
              </div>

              <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn btn-outline" onClick={() => setMonitoringChatId(null)}>Tutup Pantauan</button>
                <button className="btn btn-success" onClick={() => setVerifyingWaliId(req.id)}>Verifikasi Wali & Lanjut</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 🔴 Custom Delete Confirmation Modal */}
      {requestToDelete && (
        <div className="modal-overlay" onClick={() => setRequestToDelete(null)} style={{ zIndex: 10000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', background: '#fee2e2', 
              color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 1.5rem', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.1)'
            }}>
              <AlertCircle size={40} />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1e293b', marginBottom: '0.5rem' }}>Konfirmasi Hapus</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6', marginBottom: '2rem' }}>
              Apakah Anda yakin ingin menghapus data mediasi ini? Tindakan ini <strong>permanen</strong> dan tidak dapat dibatalkan.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-outline" 
                style={{ flex: 1, padding: '0.8rem' }} 
                onClick={() => setRequestToDelete(null)}
              >
                Batal
              </button>
              <button 
                className="btn btn-danger" 
                style={{ flex: 1, padding: '0.8rem', background: '#ef4444', color: 'white' }} 
                onClick={() => handleDeleteRequest(requestToDelete)}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
