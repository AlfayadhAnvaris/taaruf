import React, { useState } from 'react';
import { 
  Compass, Heart, Eye, CheckCircle, X, BadgeCheck, 
  Activity, MessageCircle, ChevronRight, ShieldAlert, Send, User,
  ChevronDown, ChevronUp, Calendar, Sparkles, XCircle, UserCheck, MapPin, Check
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export default function StatusTab({
  viewingStatusId, setViewingStatusId, activeChatId, setActiveChatId,
  chatInput, setChatInput, handleSendMessage,
  setShowQaTemplates, setActiveTab
}) {
  const { user, taarufRequests, setTaarufRequests, messages, showAlert } = useAppContext();
  const [statusFilter, setStatusFilter] = useState('active');

  const getApprovalState = (status, isSender) => {
    let base = status;
    let hasApproved = false;
    let partnerApproved = false;

    if (status.startsWith('qna_')) {
      base = 'qna';
      hasApproved = isSender ? status === 'qna_acc_sender' : status === 'qna_acc_receiver';
      partnerApproved = isSender ? status === 'qna_acc_receiver' : status === 'qna_acc_sender';
    } else if (status.startsWith('wali_')) {
      base = 'wali_process';
      hasApproved = isSender ? status === 'wali_acc_sender' : status === 'wali_acc_receiver';
      partnerApproved = isSender ? status === 'wali_acc_receiver' : status === 'wali_acc_sender';
    } else if (status.startsWith('meet_')) {
      base = 'meet';
      hasApproved = isSender ? status === 'meet_acc_sender' : status === 'meet_acc_receiver';
      partnerApproved = isSender ? status === 'meet_acc_receiver' : status === 'meet_acc_sender';
    }
    
    return { base, hasApproved, partnerApproved };
  };

  const handleProceed = async (req, baseStage) => {
    const isSender = req.senderId === user?.id;
    const { partnerApproved } = getApprovalState(req.status, isSender);

    let nextStatus = '';
    if (baseStage === 'qna') {
      nextStatus = partnerApproved ? 'wali_process' : (isSender ? 'qna_acc_sender' : 'qna_acc_receiver');
    } else if (baseStage === 'wali_process') {
      nextStatus = partnerApproved ? 'meet' : (isSender ? 'wali_acc_sender' : 'wali_acc_receiver');
    } else if (baseStage === 'meet') {
      nextStatus = partnerApproved ? 'completed' : (isSender ? 'meet_acc_sender' : 'meet_acc_receiver');
    }

    if (!nextStatus) return;

    try {
      const { error } = await supabase
        .from('taaruf_requests')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', req.id);

      if (error) {
        showAlert('Gagal', 'Terjadi kesalahan: ' + error.message, 'error');
        return;
      }

      setTaarufRequests(taarufRequests.map(r => 
        r.id === req.id ? { ...r, status: nextStatus, updatedAt: new Date().toISOString() } : r
      ));

      showAlert('Bismillah', 'Persetujuan Anda telah disimpan.', 'success');
    } catch (err) {
      showAlert('Gagal', 'Terjadi kesalahan sistem.', 'error');
    }
  };

  const userRequests = taarufRequests.filter(req => req.senderId === user?.id || req.receiverId === user?.id);

  const filteredItems = userRequests.filter(req => {
    if (statusFilter === 'active') {
      return !['completed', 'rejected'].includes(req.status);
    }
    if (statusFilter === 'history') {
      return ['completed', 'rejected'].includes(req.status);
    }
    return true; // 'all'
  });

  const stages = ['pending_target', 'pending_admin', 'qna', 'wali_process', 'meet', 'completed'];

  const stageLabels = {
    'pending_target': 'Menunggu Persetujuan Calon',
    'pending_admin': 'Verifikasi Admin',
    'qna': 'Sesi Tanya Jawab (Q&A)',
    'wali_process': 'Proses Koordinasi Wali',
    'meet': 'Pertemuan Nadzhor',
    'completed': 'Proses Selesai (Menikah)',
    'rejected': 'Proses Dihentikan'
  };

  const statusSteps = [
    { status: 'pending_target', label: 'Tunggu Calon', desc: 'Menunggu persetujuan permohonan taaruf oleh calon pasangan.' },
    { status: 'pending_admin', label: 'Verifikasi Ustadz', desc: 'Ustadz/Admin memverifikasi berkas dan membuka ruang mediasi.' },
    { status: 'qna', label: 'Sesi Q&A', desc: 'Sesi tanya jawab visi-misi pernikahan didampingi admin di Ruang Mediasi.' },
    { status: 'wali_process', label: 'Proses Wali', desc: 'Koordinasi pihak admin dengan wali nasab masing-masing calon.' },
    { status: 'meet', label: 'Nadzhor', desc: 'Pertemuan langsung/offline untuk saling mengenal secara syar\'i.' },
    { status: 'completed', label: 'Barakallah', desc: 'Proses taaruf selesai dan lanjut ke jenjang pernikahan.' }
  ];

  const getStepIcon = (status, size = 12) => {
    switch(status) {
      case 'pending_target': return <Compass size={size} />;
      case 'pending_admin': return <BadgeCheck size={size} />;
      case 'qna': return <MessageCircle size={size} />;
      case 'wali_process': return <UserCheck size={size} />;
      case 'meet': return <MapPin size={size} />;
      case 'completed': return <Sparkles size={size} />;
      default: return <Activity size={size} />;
    }
  };

  return (
    <div key="tab-container-status" className="status-container" style={{ animation: 'fadeInUp 0.5s ease-out', padding: 0 }}>
       {activeChatId ? (() => {
        const req = taarufRequests.find(r => r.id === activeChatId);
        return (
          <div className="chat-window-container">
            <button className="chat-back-btn" onClick={() => setActiveChatId(null)}>
              <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Kembali ke Daftar Status
            </button>
            <div className="chat-card card">
              <div className="chat-header">
                <div className="chat-header-main">
                  <div className="chat-avatar-wrapper">
                    <div className="chat-avatar"><User size={20} /></div>
                    <span className="online-indicator"></span>
                  </div>
                  <div className="chat-info">
                    <h3>Ruang Mediasi: {req?.senderId === user?.id ? req?.targetAlias : req?.senderAlias}</h3>
                    <p>Diawasi oleh Admin & Ustadz Separuh Agama</p>
                  </div>
                </div>
                <button className="qa-helper-btn" onClick={() => setShowQaTemplates(true)}>
                  <Compass size={14} /> Panduan Pertanyaan
                </button>
              </div>
              <div className="chat-messages">
                <div className="chat-disclaimer">
                  <ShieldAlert size={16} style={{ flexShrink: 0, color: '#eab308' }} /> 
                  <span>Percakapan ini dipantau untuk menjaga adab dan syariat. Dilarang bertukar nomor telepon atau media sosial lain di sini.</span>
                </div>
                {(() => {
                  const chatObj = messages.find(m => String(m.taarufId) === String(activeChatId));
                  const chatMsgs = chatObj ? chatObj.chats : [];
                  return chatMsgs.map((msg, mi) => (
                    <div key={mi} className={`chat-bubble ${msg.sender === user?.email ? 'sent' : 'received'}`}>
                      <div className="message-content">{msg.text}</div>
                      <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ));
                })()}
              </div>
              <form onSubmit={handleSendMessage} className="chat-input-area">
                <input type="text" className="chat-input-field" placeholder="Ketik pertanyaan atau balasan Anda..." value={chatInput || ''} onChange={e => setChatInput(e.target.value)} />
                <button type="submit" className="chat-send-btn"><Send size={16} /></button>
              </form>
            </div>
          </div>
        );
      })() : (
        <>
          <div style={{ marginBottom: '1.25rem', paddingTop: '0.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#134E39', margin: '0 0 0.5rem' }}>Status Ihtiar Anda</h2>
            <p style={{ color: '#64748b' }}>Pantau setiap tahapan proses taaruf yang sedang berlangsung.</p>
          </div>

          {(() => {
            const pendingDecisions = userRequests.filter(req => {
              if (['completed', 'rejected'].includes(req.status)) return false;
              const isSender = req.senderId === user?.id;
              const { hasApproved, partnerApproved } = getApprovalState(req.status, isSender);
              return partnerApproved && !hasApproved;
            });
            if (pendingDecisions.length === 0) return null;
            return (
              <div style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1px solid #fde68a',
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 15px rgba(217, 119, 6, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                animation: 'fadeInUp 0.4s ease'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Sparkles size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: '#92400e' }}>
                      Keputusan Taaruf Diperlukan
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#b45309', lineHeight: '1.5', fontWeight: '650' }}>
                      Ada {pendingDecisions.length} proses taaruf aktif di mana calon pasangan Anda sudah menyetujui untuk lanjut ke tahap berikutnya, namun Anda belum memberikan keputusan.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setViewingStatusId(pendingDecisions[0].id);
                    }}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', border: 'none',
                      background: '#134E39', color: 'white', fontSize: '0.72rem',
                      fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(19,78,57,0.2)'
                    }}
                  >
                    Tinjau Keputusan Sekarang
                  </button>
                </div>
              </div>
            );
          })()}

          <div className="status-filter-bar">
            <button 
              className={`status-filter-tab ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              Proses Aktif <span className="badge-count">{userRequests.filter(req => !['completed', 'rejected'].includes(req.status)).length}</span>
            </button>
            <button 
              className={`status-filter-tab ${statusFilter === 'history' ? 'active' : ''}`}
              onClick={() => setStatusFilter('history')}
            >
              Riwayat & Selesai <span className="badge-count">{userRequests.filter(req => ['completed', 'rejected'].includes(req.status)).length}</span>
            </button>
            <button 
              className={`status-filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Semua <span className="badge-count">{userRequests.length}</span>
            </button>
          </div>

          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'white', borderRadius: '24px', border: '1px solid rgba(19, 78, 57, 0.08)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Compass size={36} color="#134E39" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', marginBottom: '0.5rem' }}>Tidak Ada Pengajuan</h3>
              <p style={{ color: '#64748b', maxWidth: '360px', margin: '0 auto 1.5rem', fontSize: '0.85rem', lineHeight: '1.5' }}>
                {statusFilter === 'active' 
                  ? 'Tidak ada proses taaruf yang sedang berjalan saat ini.' 
                  : (statusFilter === 'history' 
                    ? 'Belum ada riwayat proses taaruf yang selesai atau dibatalkan.' 
                    : 'Belum ada pengajuan taaruf sama sekali.')}
              </p>
              {statusFilter === 'active' && (
                <button onClick={() => setActiveTab('find')} style={{ background: '#134E39', color: 'white', border: 'none', borderRadius: '14px', padding: '0.75rem 2rem', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem' }}>Cari Calon Pasangan</button>
              )}
            </div>
          ) : (
            <div className="status-list-compact">
              {filteredItems.map(req => {
                const isSender = req.senderId === user?.id;
                const partnerAlias = isSender ? req.targetAlias : req.senderAlias;
                const isRejected = req.status === 'rejected';
                const { base: baseStatus, hasApproved, partnerApproved } = getApprovalState(req.status, isSender);
                const currentIndex = stages.indexOf(baseStatus);

                let badgeClass = 'berjalan';
                let badgeText = 'PROSES BERJALAN';
                if (req.status === 'completed') {
                  badgeClass = 'berhasil';
                  badgeText = 'PROSES BERHASIL';
                } else if (isRejected) {
                  badgeClass = 'berhenti';
                  badgeText = 'PROSES BERHENTI';
                }

                return (
                  <div 
                    key={req.id} 
                    className="status-row-premium"
                    onClick={() => setViewingStatusId(req.id)}
                  >
                    <div className="status-row-info">
                      <div className="status-avatar-premium" style={{ width: '38px', height: '38px', borderRadius: '10px', fontSize: '1rem', boxShadow: 'none' }}>
                        {partnerAlias.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.925rem', fontWeight: '850', color: '#134E39' }}>
                          {isSender ? `Sedang Mengajukan ke ${partnerAlias}` : `Pengajuan Masuk dari ${partnerAlias}`}
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Calendar size={10} /> Diperbarui {new Date(req.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="status-row-meta">
                      {!isRejected && (
                        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#475569', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                          Tahap {currentIndex + 1}/6: {stageLabels[baseStatus]}
                        </span>
                      )}
                      {partnerApproved && !hasApproved && (
                        <span style={{ 
                          fontSize: '0.66rem', fontWeight: '800', color: '#b45309', 
                          background: '#fef3c7', padding: '4px 10px', borderRadius: '8px', 
                          border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}>
                          ⚠️ Persetujuan Anda Diperlukan
                        </span>
                      )}
                      <span className={`status-badge-glass ${badgeClass}`} style={{ padding: '4px 10px', fontSize: '0.66rem' }}>
                        {badgeText}
                      </span>
                      <button 
                        className="btn btn-outline" 
                        style={{ 
                          padding: '0.4rem 0.8rem', 
                          borderRadius: '8px', 
                          fontSize: '0.72rem', 
                          fontWeight: '800', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          borderColor: '#e2e8f0',
                          color: '#475569'
                        }}
                      >
                        Detail <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 🟢 SLIDING DRAWER PROGRESS DETAIL PANEL 🟢 */}
          <div className={`status-drawer-backdrop ${viewingStatusId ? 'open' : ''}`} onClick={() => setViewingStatusId(null)} />
          
          <div className={`status-drawer-panel ${viewingStatusId ? 'open' : ''}`}>
            {viewingStatusId && (() => {
              const req = taarufRequests.find(r => r.id === viewingStatusId);
              if (!req) return null;
              
              const isSender = req.senderId === user?.id;
              const partnerAlias = isSender ? req.targetAlias : req.senderAlias;
              const isRejected = req.status === 'rejected';
              const { base: baseStatus, hasApproved, partnerApproved } = getApprovalState(req.status, isSender);
              const currentIndex = stages.indexOf(baseStatus);

              return (
                <>
                  {/* Drawer Header */}
                  <div className="status-drawer-header">
                    <div className="status-drawer-title-area">
                      <h3 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '900' }}>Detail Progres Taaruf</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '600' }}>
                        Calon Pasangan: {partnerAlias}
                      </p>
                    </div>
                    <button className="status-drawer-close-btn" onClick={() => setViewingStatusId(null)}>
                      <X size={18} />
                    </button>
                  </div>

                  {/* Drawer Body */}
                  <div className="status-drawer-body">
                    {partnerApproved && !hasApproved && (
                       <div style={{ 
                         background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                         border: '1px solid #fde68a',
                         borderRadius: '16px',
                         padding: '1.25rem',
                         marginBottom: '1.25rem',
                         boxShadow: '0 4px 15px rgba(217, 119, 6, 0.08)',
                         animation: 'fadeInUp 0.4s ease',
                         display: 'flex',
                         flexDirection: 'column',
                         gap: '12px'
                       }}>
                         <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                           <Sparkles size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
                           <div>
                             <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: '#92400e' }}>
                               Calon Pasangan Bersedia Melanjutkan
                             </h4>
                             <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#b45309', lineHeight: '1.5', fontWeight: '650' }}>
                               Calon pasangan Anda (<strong>{partnerAlias}</strong>) telah menyetujui untuk melanjutkan proses taaruf ke tahap selanjutnya (<strong>{
                                 baseStatus === 'qna' ? 'Proses Koordinasi Wali' : 
                                 baseStatus === 'wali_process' ? 'Pertemuan Nadzhor' : 
                                 'Proses Selesai (Pernikahan)'
                               }</strong>).
                               Apakah Anda juga bersedia untuk melanjutkan?
                             </p>
                           </div>
                         </div>
                         <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                           <button
                             onClick={async (e) => {
                               e.stopPropagation();
                               const confirm = window.confirm('Apakah Anda yakin ingin menghentikan proses taaruf ini?');
                               if (confirm) {
                                 const { error } = await supabase.from('taaruf_requests').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', req.id);
                                 if (!error) {
                                   setTaarufRequests(taarufRequests.map(r => r.id === req.id ? { ...r, status: 'rejected', updatedAt: new Date().toISOString() } : r));
                                   showAlert('Proses Dihentikan', 'Proses taaruf telah dibatalkan.', 'info');
                                 }
                               }
                             }}
                             style={{
                               padding: '6px 12px', borderRadius: '8px', border: '1px solid #f59e0b',
                               background: 'transparent', color: '#b45309', fontSize: '0.72rem',
                               fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s'
                             }}
                           >
                             Batalkan Taaruf
                           </button>
                           <button
                             onClick={() => handleProceed(req, baseStatus)}
                             style={{
                               padding: '6px 16px', borderRadius: '8px', border: 'none',
                               background: '#134E39', color: 'white', fontSize: '0.72rem',
                               fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                               boxShadow: '0 2px 4px rgba(19,78,57,0.2)'
                             }}
                           >
                             Ya, Saya Bersedia Lanjut
                           </button>
                         </div>
                       </div>
                     )}

                    {/* Partner summary */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                      <div className="status-avatar-premium" style={{ width: '48px', height: '48px', borderRadius: '12px', fontSize: '1.2rem' }}>
                        {partnerAlias.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#134E39' }}>{partnerAlias}</h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>
                          Hubungan: {isSender ? 'Saya Pengirim' : 'Saya Penerima'}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Tanggal Update</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#134E39' }}>
                          {new Date(req.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>

                    {/* Vertical Stepper Timeline */}
                    <div>
                      <h4 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: '900', color: '#134E39', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alur Proses Mediasi</h4>
                      {isRejected ? (
                        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '14px', padding: '1rem', color: '#ef4444', fontSize: '0.8rem', fontWeight: '700', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <XCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '900', marginBottom: '2px' }}>Proses Taaruf Dihentikan</div>
                            Proses taaruf ini dibatalkan atau tidak disetujui. Percayalah bahwa Allah Subhaanahu wa Ta'ala akan mempertemukan Anda dengan jodoh terbaik di waktu yang tepat.
                          </div>
                        </div>
                      ) : (
                        <div className="status-timeline-vertical" style={{ margin: '0.5rem 0' }}>
                          {statusSteps.map((step, idx) => {
                            const isCompleted = idx < currentIndex || (req.status === 'completed');
                            const isActive = idx === currentIndex && req.status !== 'completed';
                            
                            let nodeClass = 'pending';
                            let nodeContent = idx + 1;
                            
                            if (isCompleted) {
                              nodeClass = 'completed';
                              nodeContent = <Check size={12} strokeWidth={3} />;
                            } else if (isActive) {
                              nodeClass = 'active';
                              nodeContent = getStepIcon(step.status, 11);
                            }

                            return (
                              <div key={idx} className={`status-timeline-step ${isActive ? 'active' : ''} ${idx > currentIndex ? 'pending' : ''}`}>
                                <div className={`status-timeline-node ${nodeClass}`}>
                                  {nodeContent}
                                </div>
                                <div className="status-timeline-content">
                                  <h4>{step.label}</h4>
                                  <p>{step.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Instruction Box */}
                    <div className="status-action-box" style={{ margin: 0 }}>
                      <div className="status-action-box-title">
                        <Compass size={16} color="#134E39" />
                        <span>Panduan Tahap Aktif</span>
                      </div>
                      <div className="status-action-box-desc">
                        {baseStatus === 'pending_target' && (
                          isSender 
                            ? 'Permohonan taaruf Anda telah dikirimkan ke calon pasangan. Mohon bersabar menunggu tanggapan pihak akhwat/ikhwan selama maksimal 7 hari kerja. Perbanyak doa agar dilancarkan.'
                            : 'Anda menerima pengajuan taaruf dari calon pasangan ini. Silakan baca dan pelajari CV mereka di tab Cari Pasangan. Setelah itu, putuskan apakah Anda bersedia berlanjut ke sesi Q&A atau ingin menolak.'
                        )}
                        {baseStatus === 'pending_admin' && (
                          'Alhamdulillah, kedua belah pihak telah menyetujui pengajuan taaruf! Saat ini berkas sedang ditinjau oleh Admin & Ustadz Pembimbing Separuh Agama untuk verifikasi kelayakan sebelum mediasi chat Q&A dibuka.'
                        )}
                        {baseStatus === 'qna' && (
                          hasApproved && !partnerApproved ? 'Anda telah menyetujui untuk melanjutkan ke tahap berikutnya (Proses Wali). Menunggu persetujuan calon pasangan Anda.' :
                          !hasApproved && partnerApproved ? 'Calon pasangan Anda telah menyetujui untuk melanjutkan ke Proses Wali. Silakan berikan keputusan Anda.' :
                          'Ruang mediasi chat Q&A Anda sekarang aktif. Di sini Anda dapat bertanya dan berdiskusi seputar visi, misi, dan kesiapan membina keluarga. Sesi ini diawasi sepenuhnya oleh Ustadz mediator untuk menjaga kesucian adab.'
                        )}
                        {baseStatus === 'wali_process' && (
                          hasApproved && !partnerApproved ? 'Anda telah menyetujui untuk melanjutkan ke tahap berikutnya (Pertemuan Nadzhor). Menunggu persetujuan calon pasangan Anda.' :
                          !hasApproved && partnerApproved ? 'Calon pasangan Anda telah menyetujui untuk melanjutkan ke Pertemuan Nadzhor. Silakan berikan keputusan Anda.' :
                          'Sesi Q&A telah selesai dengan kesepakatan baik. Saat ini Admin Ustadz sedang melakukan koordinasi dengan wali nasab dari pihak Akhwat untuk meminta restu dan memverifikasi data keluarga.'
                        )}
                        {baseStatus === 'meet' && (
                          hasApproved && !partnerApproved ? 'Anda telah menyetujui untuk menyelesaikan proses taaruf (Pernikahan). Menunggu persetujuan calon pasangan Anda.' :
                          !hasApproved && partnerApproved ? 'Calon pasangan Anda telah menyetujui untuk menyelesaikan proses taaruf (Pernikahan). Silakan berikan keputusan Anda.' :
                          'Tahap Nadzhor (pertemuan offline) sedang dijadwalkan oleh Ustadz mediator. Kedua belah pihak akan dipertemukan secara langsung didampingi oleh wali/mediator di lokasi yang ditentukan.'
                        )}
                        {baseStatus === 'completed' && (
                          'Maa syaa Allah, tabarakallah! Proses taaruf telah selesai dengan pernikahan yang sah. Semoga Allah memberkahi rumah tangga Anda: "Barakallahu lakum wa baaraka \'alaikum wa jama\'a bainakuma fii khair."'
                        )}
                        {isRejected && (
                          'Proses taaruf ini telah berakhir. Tetap berprasangka baik pada takdir Allah. Anda bisa mencari calon pasangan lain yang sesuai kriteria di halaman utama.'
                        )}
                      </div>

                      <div className="status-action-buttons">
                        {!isRejected && req.status === 'pending_target' && !isSender && (
                          <>
                            <button 
                              className="btn"
                              style={{ 
                                background: '#10b981', 
                                color: 'white', 
                                border: 'none', 
                                padding: '0.65rem 1.25rem', 
                                borderRadius: '10px', 
                                fontWeight: '800', 
                                fontSize: '0.8rem', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px' 
                              }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                const { error } = await supabase.from('taaruf_requests').update({ status: 'pending_admin', updated_at: new Date().toISOString() }).eq('id', req.id);
                                if (!error) { 
                                  setTaarufRequests(taarufRequests.map(r => r.id === req.id ? { ...r, status: 'pending_admin', updatedAt: new Date().toISOString() } : r)); 
                                  showAlert('Bismillah', 'Persetujuan Anda telah dikirim ke Admin.', 'success');
                                }
                              }}
                            >
                              <CheckCircle size={16} /> Setujui Pengajuan
                            </button>

                            <button 
                              className="btn"
                              style={{ 
                                background: '#ef4444', 
                                color: 'white', 
                                border: 'none', 
                                padding: '0.65rem 1.25rem', 
                                borderRadius: '10px', 
                                fontWeight: '800', 
                                fontSize: '0.8rem', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px' 
                              }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                const confirm = window.confirm('Apakah Anda yakin ingin menolak pengajuan taaruf ini? Tindakan ini tidak dapat dibatalkan.');
                                if (confirm) {
                                  const { error } = await supabase.from('taaruf_requests').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', req.id);
                                  if (!error) { 
                                    setTaarufRequests(taarufRequests.map(r => r.id === req.id ? { ...r, status: 'rejected', updatedAt: new Date().toISOString() } : r)); 
                                    showAlert('Proses Dihentikan', 'Pengajuan taaruf telah ditolak.', 'info');
                                  }
                                }
                              }}
                            >
                              <XCircle size={16} /> Tolak Pengajuan
                            </button>
                          </>
                        )}

                        {!isRejected && req.status === 'pending_target' && isSender && (
                          <button 
                            className="btn"
                            style={{ 
                              background: 'white', 
                              color: '#ef4444', 
                              border: '1.5px solid #fee2e2', 
                              padding: '0.65rem 1.25rem', 
                              borderRadius: '10px', 
                              fontWeight: '800', 
                              fontSize: '0.8rem', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px' 
                            }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              const confirm = window.confirm('Apakah Anda yakin ingin menarik kembali permohonan taaruf Anda?');
                              if (confirm) {
                                const { error } = await supabase.from('taaruf_requests').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', req.id);
                                if (!error) { 
                                  setTaarufRequests(taarufRequests.map(r => r.id === req.id ? { ...r, status: 'rejected', updatedAt: new Date().toISOString() } : r)); 
                                  showAlert('Ditarik Kembali', 'Permohonan taaruf Anda telah berhasil ditarik.', 'info');
                                }
                              }
                            }}
                          >
                            <XCircle size={16} /> Tarik Pengajuan
                          </button>
                        )}

                        {!isRejected && (baseStatus === 'qna' || baseStatus === 'meet') && (
                          <button 
                            className="btn"
                            style={{ 
                              background: 'linear-gradient(135deg, #134E39 0%, #2E7D5F 100%)', 
                              color: 'white', 
                              border: 'none',
                              padding: '0.75rem 1.5rem', 
                              borderRadius: '12px', 
                              fontWeight: '800', 
                              fontSize: '0.85rem', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              boxShadow: '0 4px 15px rgba(19,78,57,0.15)',
                              transition: 'all 0.2s'
                            }} 
                            onClick={(e) => { 
                              e.stopPropagation();
                              setViewingStatusId(null);
                              setActiveChatId(req.id); 
                            }}
                          >
                            <MessageCircle size={18} /> Masuk ke Ruang Mediasi
                          </button>
                        )}

                        {!isRejected && baseStatus === 'qna' && (
                          <button 
                            className="btn"
                            style={{ 
                              background: 'white', 
                              color: '#134E39', 
                              border: '1.5px solid #134E39',
                              padding: '0.75rem 1.5rem', 
                              borderRadius: '12px', 
                              fontWeight: '800', 
                              fontSize: '0.85rem', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              transition: 'all 0.2s'
                            }} 
                            onClick={(e) => { 
                              e.stopPropagation();
                              setShowQaTemplates(true); 
                            }}
                          >
                            <Compass size={18} /> Panduan Pertanyaan
                          </button>
                        )}

                        {/* Aksi Persetujuan Lanjut untuk Sesi Aktif */}
                        {!isRejected && ['qna', 'wali_process', 'meet'].includes(baseStatus) && !hasApproved && (
                          <>
                            <button
                              className="btn"
                              style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '12px',
                                fontWeight: '800',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                                transition: 'all 0.2s'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProceed(req, baseStatus);
                              }}
                            >
                              <CheckCircle size={18} /> {
                                baseStatus === 'qna' ? 'Lanjut ke Proses Wali' :
                                baseStatus === 'wali_process' ? 'Lanjut ke Nadzhor (Pertemuan)' :
                                'Selesai Taaruf (Pernikahan)'
                              }
                            </button>

                            <button
                              className="btn"
                              style={{
                                background: 'white',
                                color: '#ef4444',
                                border: '1.5px solid #fee2e2',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '12px',
                                fontWeight: '800',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                              }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                const confirm = window.confirm('Apakah Anda yakin ingin membatalkan/menghentikan proses taaruf ini?');
                                if (confirm) {
                                  const { error } = await supabase.from('taaruf_requests').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', req.id);
                                  if (!error) {
                                    setTaarufRequests(taarufRequests.map(r => r.id === req.id ? { ...r, status: 'rejected', updatedAt: new Date().toISOString() } : r));
                                    showAlert('Proses Dihentikan', 'Proses taaruf telah dibatalkan.', 'info');
                                  }
                                }
                              }}
                            >
                              <XCircle size={18} /> Batalkan Taaruf
                            </button>
                          </>
                        )}

                        {!isRejected && ['qna', 'wali_process', 'meet'].includes(baseStatus) && hasApproved && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            borderRadius: '12px',
                            color: '#065f46',
                            fontSize: '0.8rem',
                            fontWeight: '800'
                          }}>
                            <CheckCircle size={16} /> Anda telah menyetujui. Menunggu persetujuan calon pasangan.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Histori Log */}
                    <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1rem 1.25rem', border: '1px solid #f1f5f9' }}>
                      <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: '900', color: '#134E39', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Log Histori</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#134E39', marginTop: '5px' }}></div>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e293b' }}>Status: {stageLabels[baseStatus]}</div>
                            {['qna', 'wali_process', 'meet'].includes(baseStatus) && (
                              <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '2px', fontWeight: '650' }}>
                                Persetujuan: {hasApproved ? 'Anda (Setuju)' : 'Anda (Belum)'} | {partnerApproved ? 'Calon (Setuju)' : 'Calon (Belum)'}
                              </div>
                            )}
                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Diperbaharui pada {new Date(req.updatedAt).toLocaleString('id-ID')}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1', marginTop: '5px' }}></div>
                          <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '650' }}>
                            Dibuat pada {new Date(req.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Drawer Footer */}
                  <div className="status-drawer-footer">
                    <button 
                      className="btn" 
                      style={{ 
                        padding: '0.6rem 1.5rem', 
                        borderRadius: '10px', 
                        fontSize: '0.8rem', 
                        fontWeight: '800',
                        background: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }} 
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#e2e8f0';
                        e.currentTarget.style.color = '#1e293b';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.color = '#475569';
                      }}
                      onClick={() => setViewingStatusId(null)}
                    >
                      Tutup Detail
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
