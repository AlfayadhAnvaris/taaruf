import React from 'react';
import { 
  Compass, Heart, Eye, CheckCircle, X, BadgeCheck, 
  Activity, MessageCircle, ChevronRight, ShieldAlert, Send, User
} from 'lucide-react';
import { supabase } from '../../supabase';

export default function StatusTab({
  user, taarufRequests, setTaarufRequests, myExistingCv,
  viewingStatusId, setViewingStatusId, activeChatId, setActiveChatId,
  messages, setMessages, chatInput, setChatInput, handleSendMessage,
  setShowQaTemplates, showAlert, setActiveTab
}) {
  return (
    <div key="tab-container-status" className="status-container" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
       {activeChatId ? (() => {
        const req = taarufRequests.find(r => r.id === activeChatId);
        return (
          <div className="chat-window-container">
            <button className="chat-back-btn" onClick={() => setActiveChatId(null)}><ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Kembali ke Daftar Status</button>
            <div className="chat-card card">
              <div className="chat-header">
                <div className="chat-avatar"><User size={24} /></div>
                <div className="chat-info">
                  <h3>Ruang Mediasi: {req?.senderEmail === user.email ? req.targetAlias : req.senderAlias}</h3>
                  <p>Diawasi oleh Admin & Ustadz Separuh Agama</p>
                </div>
                <button className="qa-helper-btn" onClick={() => setShowQaTemplates(true)}>
                  <Compass size={14} /> Panduan Pertanyaan
                </button>
              </div>
              <div className="chat-messages">
                <div className="chat-disclaimer">
                  <ShieldAlert size={16} /> Percakapan ini dipantau untuk menjaga adab dan syariat. Dilarang bertukar nomor telepon atau media sosial lain di sini.
                </div>
                {(() => {
                  const chatObj = messages.find(m => String(m.taarufId) === String(activeChatId));
                  const chatMsgs = chatObj ? chatObj.chats : [];
                  return chatMsgs.map((msg, mi) => (
                    <div key={mi} className={`chat-bubble ${msg.sender === user.email ? 'sent' : 'received'}`}>
                      <div className="message-content">{msg.text}</div>
                      <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ));
                })()}
              </div>
              <form onSubmit={handleSendMessage} className="chat-input-area">
                <input type="text" className="chat-input-field" placeholder="Ketik pertanyaan atau balasan Anda..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                <button type="submit" className="chat-send-btn"><Send size={20} /></button>
              </form>
            </div>
          </div>
        );
      })() : (
        <>
          <div style={{ marginBottom: '2.5rem', paddingTop: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#134E39', margin: '0 0 0.5rem' }}>Status Ihtiar Anda</h2>
            <p style={{ color: '#64748b' }}>Pantau setiap tahapan proses taaruf yang sedang berlangsung.</p>
          </div>

          {taarufRequests.filter(req => req.senderEmail === user.email || (myExistingCv && req.targetCvId === myExistingCv.id)).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'white', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                <Compass size={48} color="#134E39" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39' }}>Belum Ada Pengajuan Aktif</h3>
              <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 2rem' }}>Mulailah dengan mencari kandidat yang sesuai dengan kriteria Anda di halaman pencarian.</p>
              <button onClick={() => setActiveTab('find')} style={{ background: '#134E39', color: 'white', border: 'none', borderRadius: '16px', padding: '1rem 2.5rem', fontWeight: '800', cursor: 'pointer' }}>Cari Calon Pasangan</button>
            </div>
          ) : taarufRequests.filter(req => req.senderEmail === user.email || (myExistingCv && req.targetCvId === myExistingCv.id)).map(req => {
            const stages = ['pending_target', 'pending_admin', 'qna', 'wali_process', 'meet', 'completed'];
            const currentIndex = stages.indexOf(req.status);
            return (
              <div key={req.id} style={{ background: 'white', borderRadius: '32px', padding: '2.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}>
                      <Heart size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', margin: 0 }}>
                        {req.senderEmail === user.email ? `Sedang Mengajukan ke ${req.targetAlias}` : `Pengajuan Masuk dari ${req.senderAlias}`}
                      </h3>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700', marginTop: '4px' }}>DIPERBARUI PADA {new Date(req.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</div>
                    </div>
                  </div>
                  <div style={{ 
                    background: req.status === 'rejected' ? '#fef2f2' : (req.status === 'completed' || currentIndex >= 5 ? '#fefce8' : '#f0fdf4'), 
                    color: req.status === 'rejected' ? '#ef4444' : (req.status === 'completed' || currentIndex >= 5 ? '#a16207' : '#166534'), 
                    padding: '6px 16px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '800',
                    border: (req.status === 'completed' || currentIndex >= 5) ? '1px solid #fde047' : 'none'
                  }}>
                    {req.status === 'rejected' ? 'PROSES BERHENTI' : (req.status === 'completed' || currentIndex >= 5 ? 'PROSES BERHASIL' : 'PROSES BERJALAN')}
                  </div>
                </div>

                <button 
                    className="btn btn-outline"
                    onClick={() => setViewingStatusId(req.id)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '16px',
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '2rem'
                    }}
                  >
                    <Eye size={18} /> Lihat Detail Progres
                  </button>
              </div>
            );
          })}
        </>
      )}

      {/* 🟢 PREMIUM STATUS DETAIL MODAL 🟢 */}
      {viewingStatusId && (() => {
        const req = taarufRequests.find(r => r.id === viewingStatusId);
        if (!req) return null;
        const statusSteps = [
          { status: 'pending_target', label: 'Tunggu Calon' },
          { status: 'pending_admin', label: 'Verifikasi Admin' },
          { status: 'qna', label: 'Sesi Q&A' },
          { status: 'wali_process', label: 'Proses Wali' },
          { status: 'meet', label: 'Nadzhor' },
          { status: 'completed', label: 'Menikah' }
        ];

        const currentStepIdx = statusSteps.findIndex(s => s.status === req.status);
        const isRejected = req.status === 'rejected';

        return (
          <div className="modal-overlay" onClick={() => setViewingStatusId(null)} style={{ zIndex: 3000 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%', padding: 0, overflow: 'hidden', animation: 'fadeInUp 0.3s ease' }}>
              {/* Header */}
              <div style={{ background: '#134E39', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '900' }}>Detail Progres Mediasi</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>ID Permintaan: #{req.id}</p>
                </div>
                <button onClick={() => setViewingStatusId(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '10px', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ padding: '1.75rem' }}>
                {/* 🪜 Visual Stepper 🪜 */}
                {!isRejected && (
                  <div style={{ marginBottom: '2.5rem', padding: '0 10px', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', minWidth: '450px', paddingBottom: '10px' }}>
                      <div style={{ position: 'absolute', top: '20px', left: 0, right: 0, height: '4px', background: '#f1f5f9', zIndex: 0 }}></div>
                      <div style={{ 
                        position: 'absolute', top: '20px', left: 0, 
                        width: `${(currentStepIdx / (statusSteps.length - 1)) * 100}%`, 
                        height: '4px', background: '#D4AF37', zIndex: 1,
                        transition: 'width 0.5s ease' 
                      }}></div>

                      {statusSteps.map((step, idx) => {
                        const isCompleted = idx < currentStepIdx || (req.status === 'completed');
                        const isActive = idx === currentStepIdx && req.status !== 'completed';
                        return (
                          <div key={idx} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div style={{ 
                              width: '40px', height: '40px', borderRadius: '50%', 
                              background: isCompleted ? '#D4AF37' : (isActive ? 'white' : '#f8fafc'),
                              border: `2px solid ${isActive || isCompleted ? '#D4AF37' : '#e2e8f0'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: isCompleted ? '#134E39' : (isActive ? '#D4AF37' : '#94a3b8'),
                              fontWeight: '800', fontSize: '0.8rem',
                              boxShadow: isActive ? '0 0 0 4px rgba(212, 175, 55, 0.15)' : 'none'
                            }}>
                              {isCompleted ? <CheckCircle size={20} /> : idx + 1}
                            </div>
                            <span style={{ 
                              marginTop: '10px', fontSize: '0.64rem', fontWeight: '800', 
                              textAlign: 'center', color: isActive || isCompleted ? '#134E39' : '#94a3b8',
                              width: '60px', lineHeight: 1.2, textTransform: 'uppercase'
                            }}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 👤 Partner Summary Section 👤 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                  <div style={{ width: 54, height: 54, borderRadius: '14px', background: '#134E39', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    {(req.senderEmail === user.email ? req.targetAlias : req.senderAlias).charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1A2E25' }}>
                        {req.senderEmail === user.email ? req.targetAlias : req.senderAlias}
                      </span>
                      {req.status === 'completed' && <BadgeCheck size={16} color="#D4AF37" />}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isRejected ? '#ef4444' : '#134E39', fontWeight: '900', letterSpacing: '0.02em' }}>
                      STATUS: {isRejected ? 'DIBATALKAN' : statusSteps[currentStepIdx]?.label.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '800', color: '#94a3b8', marginBottom: '2px' }}>UPDATE</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#134E39' }}>{new Date(req.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                  </div>
                </div>

                {/* 📑 Phase Information 📑 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                    <Activity size={16} color="#134E39" />
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: '#134E39' }}>Deskripsi Tahapan</h4>
                  </div>
                  <div style={{ padding: '1.25rem', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
                    {req.status === 'pending_target' && 'Bismillah, permohonan taaruf sudah terkirim. Saat ini sedang menunggu persetujuan dari calon pasangan Anda.'}
                    {req.status === 'pending_admin' && 'Maasyaa Allah, calon pasangan telah setuju! Mohon tunggu Admin/Ustadz untuk memverifikasi dan membuka ruang Q&A.'}
                    {req.status === 'qna' && 'Silakan masuk ke Ruang Mediasi untuk sesi tanya jawab visi-misi yang didampingi oleh Admin Separuh Agama.'}
                    {req.status === 'wali_process' && 'Sesi Q&A selesai. Saat ini Admin sedang berkoordinasi dengan Wali atau pihak keluarga akhwat.'}
                    {req.status === 'meet' && 'Tahapan Nadzhor (pertemuan offline) sedang dijadwalkan. Mohon siapkan diri Anda sesuai arahan pendamping.'}
                    {req.status === 'completed' && 'Alhamdulillah, proses taaruf telah selesai. Semoga Allah memberkahi langkah selanjutnya.'}
                    {isRejected && 'Afwan, proses taaruf telah dihentikan. Percaya bahwa Allah telah menyiapkan yang terbaik di waktu yang tepat.'}
                  </div>
                </div>

                {/* 🕹️ Actions 🕹️ */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-outline" onClick={() => setViewingStatusId(null)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', fontWeight: '800' }}>TUTUP</button>
                  
                  {!isRejected && req.status === 'pending_target' && req.senderEmail !== user.email && (
                    <button className="btn btn-primary" style={{ flex: 2, background: '#134E39' }} onClick={async () => {
                      const { error } = await supabase.from('taaruf_requests').update({ status: 'pending_admin', updated_at: new Date().toISOString() }).eq('id', req.id);
                      if (!error) { 
                        setTaarufRequests(taarufRequests.map(r => r.id === req.id ? { ...r, status: 'pending_admin' } : r)); 
                        showAlert('Bismillah', 'Persetujuan Anda telah dikirim ke Admin.', 'success');
                        setViewingStatusId(null);
                      }
                    }}><CheckCircle size={18} /> SETUJUI PENGAJUAN</button>
                  )}

                  {(req.status === 'qna' || req.status === 'meet') && (
                    <button className="btn btn-primary" style={{ flex: 2, background: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => { setViewingStatusId(null); setActiveChatId(req.id); }}>
                      <MessageCircle size={18} /> LANJUT KE CHAT MEDIASI
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
