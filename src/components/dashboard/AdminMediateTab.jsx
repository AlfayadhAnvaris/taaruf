import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { 
  CheckCircle, XCircle, ShieldAlert, MessageCircle, Eye, Search, Filter, 
  ChevronLeft, ChevronRight, Clock, User, Users, Activity, Phone, 
  ExternalLink, AlertCircle, Trash2, Heart 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

export default function AdminMediateTab() {
  const { taarufRequests, setTaarufRequests, showAlert, messages, addNotification } = useAppContext();
  const [monitoringChatId, setMonitoringChatId] = useState(null);
  const [verifyingWaliId, setVerifyingWaliId] = useState(null); // ID request yang akan diverifikasi walinya
  const [viewingRequestId, setViewingRequestId] = useState(null); // ID request yang akan dilihat detailnya
  
  // Pagination & Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestToDelete, setRequestToDelete] = useState(null); // ID request yang akan dihapus
  const [isMobile, setIsMobile] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    } catch { 
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
    } catch {
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
      <style>{`
        .admin-toolbar-mediate {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
          background: white;
          padding: 1.25rem;
          border-radius: 16px;
          border: 1px solid #E4EDE8;
        }
        .search-container-mediate {
          position: relative;
          min-width: 280px;
          flex: 1;
        }
        .search-input-mediate {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border-radius: 10px;
          border: 1px solid #E4EDE8;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s;
        }
        .search-input-mediate:focus {
          border-color: #134E39;
        }
        .filter-container-mediate {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-select-mediate {
          padding: 0.75rem 2rem 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid #E4EDE8;
          font-size: 0.9rem;
          outline: none;
          background: white;
          cursor: pointer;
          font-weight: 700;
          color: #134E39;
          height: 42px;
        }
        .admin-mediate-card-new {
          background: white;
          border: 1px solid #E4EDE8;
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          transition: all 0.3s ease;
          position: relative;
          margin-bottom: 1.25rem;
        }
        .admin-mediate-card-new:hover {
          border-color: #134E39;
          box-shadow: 0 8px 30px rgba(19, 78, 57, 0.02);
        }
        .mediate-card-top-new {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mediate-id-badge {
          font-size: 0.75rem;
          font-weight: 850;
          color: #94a3b8;
          background: #f8fafc;
          padding: 3px 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        .mediate-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 850;
          border-width: 1px;
          border-style: solid;
        }
        .mediate-flow-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          padding: 1.25rem 2rem;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }
        .mediate-user-box {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .mediate-user-icon-bg {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .mediate-role-lbl {
          font-size: 0.65rem;
          color: #94a3b8;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }
        .mediate-candidate-name {
          font-weight: 800;
          font-size: 0.95rem;
          color: #1e293b;
        }
        .mediate-connector-line {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1.5;
          padding: 0 1.5rem;
        }
        .mediate-heart-divider {
          position: absolute;
          background: #f8fafc;
          padding: 0 8px;
        }
        .mediate-card-bottom-new {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #f1f5f9;
          padding-top: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .mediate-btn-new {
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mediate-btn-new.detail {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        .mediate-btn-new.detail:hover {
          background: #f1f5f9;
          color: #334155;
        }
        .mediate-btn-new.success {
          background: #134E39;
          color: white;
          border: none;
        }
        .mediate-btn-new.success:hover {
          background: #1E6B52;
        }
        .mediate-btn-new.danger-outline {
          background: transparent;
          color: #ef4444;
          border: 1px solid #fca5a5;
        }
        .mediate-btn-new.danger-outline:hover {
          background: #fef2f2;
        }
        .mediate-btn-new.warning-solid {
          background: #fef3c7;
          color: #92400e;
          border: none;
        }
        .mediate-btn-new.warning-solid:hover {
          background: #fde68a;
        }
        .mediate-btn-new.primary-solid {
          background: #2563eb;
          color: white;
          border: none;
        }
        .mediate-btn-new.primary-solid:hover {
          background: #1d4ed8;
        }
        .mediate-trash-btn {
          background: transparent;
          border: none;
          color: #ef4444;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .mediate-trash-btn:hover {
          background: #fef2f2;
        }
        
        /* Premium Blur Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.3) !important;
          backdrop-filter: blur(12px) !important;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10002;
        }
        .modal-content {
          background: white;
          border-radius: 20px !important;
          box-shadow: 0 20px 40px rgba(19, 78, 57, 0.03) !important;
          border: 1px solid #E4EDE8 !important;
          overflow: hidden;
        }
        
        .monitoring-chat-history {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 380px;
          overflow-y: auto;
          padding: 1.25rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          margin-bottom: 1.5rem;
        }
        .monitoring-bubble {
          padding: 0.85rem 1.25rem;
          border-radius: 16px;
          max-width: 80%;
          font-size: 0.9rem;
          line-height: 1.5;
        }
        .monitoring-bubble.sender {
          background: white;
          color: #1e293b;
          align-self: flex-start;
          border: 1px solid #e2e8f0;
          border-bottom-left-radius: 4px;
        }
        .monitoring-bubble.target {
          background: #134E39;
          color: white;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }
        .monitoring-meta {
          display: block;
          font-size: 0.65rem;
          margin-top: 6px;
          opacity: 0.6;
          text-align: right;
        }
        .stepper-scroll::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .mediate-flow-container {
            flex-direction: column;
            gap: 1rem;
            padding: 1.25rem;
          }
          .mediate-connector-line {
            width: 100%;
            height: 20px;
            padding: 0;
          }
          .mediate-connector-line > div {
            width: 2px !important;
            height: 30px !important;
            border-left: 2px dashed #E4EDE8 !important;
            border-top: none !important;
          }
          .mediate-card-bottom-new {
            flex-direction: column;
            align-items: stretch;
          }
          .mediate-btn-new {
            justify-content: center;
          }
        }
        .mediate-compact-row-desktop {
          transition: all 0.2s ease;
        }
        .mediate-compact-row-desktop:hover {
          box-shadow: 0 4px 12px rgba(19, 78, 57, 0.05);
          border-color: rgba(19, 78, 57, 0.15) !important;
          transform: translateX(4px);
        }
      `}</style>

      {/* Search & Filter Bar */}
      <div className="admin-toolbar-mediate">
        <div className="search-container-mediate">
          <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama atau ID mediasi..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="search-input-mediate"
          />
        </div>
        
        <div className="filter-container-mediate">
          <Filter size={16} color="#64748b" />
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="filter-select-mediate"
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

      {/* Mediation List */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {currentItems.length > 0 ? (
          <>
            {/* Desktop Table Header */}
            {!isMobile && (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '0.8fr 1.8fr 1.2fr 2fr 0.4fr',
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
                <div>ID & Tanggal</div>
                <div>Pasangan Taaruf</div>
                <div>Status Tahapan</div>
                <div>Aksi Mediasi</div>
                <div style={{ textAlign: 'right' }}>Hapus</div>
              </div>
            )}

            {currentItems.map(req => {
              const config = getStatusConfig(req.status);
              
              if (isMobile) {
                return (
                  <div 
                    key={req.id} 
                    className="mediate-compact-card-mobile"
                    style={{
                      background: 'white',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: '#E4EDE8',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '850', color: '#94a3b8' }}>
                        #{req.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: '850', 
                        padding: '2px 8px', 
                        borderRadius: '6px', 
                        background: config.bg, 
                        color: config.text,
                        border: `1px solid ${config.text}20`
                      }}>
                        {config.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '750', color: '#1e293b' }}>
                      <span style={{ color: '#134E39' }}>{req.senderAlias}</span>
                      <span style={{ color: '#94a3b8' }}>➔</span>
                      <span style={{ color: '#134E39' }}>{req.targetAlias}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px' }}>
                      <button 
                        onClick={() => setViewingRequestId(req.id)}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          color: '#64748b',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        Progres
                      </button>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {req.status === 'pending_admin' && (
                          <>
                            <button 
                              onClick={() => updateTaarufStatus(req.id, 'rejected')}
                              style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Tolak
                            </button>
                            <button 
                              onClick={() => {
                                updateTaarufStatus(req.id, 'qna');
                                addNotification(`Mediasi #${req.id.substring(0,8)} disetujui ustadz. Sesi Q&A dibuka.`, req.senderId);
                                addNotification(`Mediasi #${req.id.substring(0,8)} disetujui ustadz. Sesi Q&A dibuka.`, req.targetUserId);
                              }}
                              style={{ background: '#134E39', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Setujui
                            </button>
                          </>
                        )}

                        {req.status === 'qna' && (
                          <>
                            <button 
                              onClick={() => setMonitoringChatId(req.id)}
                              style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Pantau
                            </button>
                            <button 
                              onClick={() => setVerifyingWaliId(req.id)}
                              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Wali
                            </button>
                          </>
                        )}

                        {req.status === 'wali_process' && (
                          <button 
                            onClick={() => updateTaarufStatus(req.id, 'meet')}
                            style={{ background: '#134E39', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Nadzhor
                          </button>
                        )}

                        {req.status === 'meet' && (
                          <button 
                            onClick={() => updateTaarufStatus(req.id, 'completed')}
                            style={{ background: '#134E39', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Menikah
                          </button>
                        )}

                        <button 
                          onClick={() => setRequestToDelete(req.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Desktop View: Compact Row
              return (
                <div 
                  key={req.id} 
                  className="mediate-compact-row-desktop"
                  style={{ 
                    display: 'grid',
                    gridTemplateColumns: '0.8fr 1.8fr 1.2fr 2fr 0.4fr',
                    alignItems: 'center',
                    padding: '0.75rem 1.25rem',
                    background: 'white',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: '#E4EDE8',
                    borderRadius: '12px',
                    marginBottom: '0.5rem',
                    gap: '1rem',
                    position: 'relative'
                  }}
                >
                  {/* 1. ID & Tanggal */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '850', color: '#1e293b' }}>
                      #{req.id.substring(0, 8).toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>
                      {new Date(req.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* 2. Pasangan Taaruf */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '750', color: '#1e293b', minWidth: 0 }}>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#134E39' }}>
                      {req.senderAlias}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>➔</span>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#134E39' }}>
                      {req.targetAlias}
                    </span>
                  </div>

                  {/* 3. Status Badge */}
                  <div>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: '900', 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      background: config.bg, 
                      color: config.text,
                      border: `1px solid ${config.text}20`
                    }}>
                      {config.label}
                    </span>
                  </div>

                  {/* 4. Aksi Mediasi */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button 
                      onClick={() => setViewingRequestId(req.id)}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#64748b',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye size={12} /> Detail
                    </button>

                    {req.status === 'pending_admin' && (
                      <>
                        <button 
                          onClick={() => updateTaarufStatus(req.id, 'rejected')}
                          style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '850', cursor: 'pointer' }}
                        >
                          Tolak
                        </button>
                        <button 
                          onClick={() => {
                            updateTaarufStatus(req.id, 'qna');
                            addNotification(`Mediasi #${req.id.substring(0,8)} disetujui ustadz. Sesi Q&A dibuka.`, req.senderId);
                            addNotification(`Mediasi #${req.id.substring(0,8)} disetujui ustadz. Sesi Q&A dibuka.`, req.targetUserId);
                          }}
                          style={{ background: '#134E39', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '850', cursor: 'pointer' }}
                        >
                          Setujui
                        </button>
                      </>
                    )}

                    {req.status === 'qna' && (
                      <>
                        <button 
                          onClick={() => setMonitoringChatId(req.id)}
                          style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '850', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <MessageCircle size={12} /> Pantau
                        </button>
                        <button 
                          onClick={() => setVerifyingWaliId(req.id)}
                          style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '850', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Phone size={12} /> Wali
                        </button>
                      </>
                    )}

                    {req.status === 'wali_process' && (
                      <button 
                        onClick={() => updateTaarufStatus(req.id, 'meet')}
                        style={{ background: '#134E39', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '850', cursor: 'pointer' }}
                      >
                        Nadzhor
                      </button>
                    )}

                    {req.status === 'meet' && (
                      <button 
                        onClick={() => updateTaarufStatus(req.id, 'completed')}
                        style={{ background: '#134E39', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '850', cursor: 'pointer' }}
                      >
                        Menikah
                      </button>
                    )}
                  </div>

                  {/* 5. Hapus */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => setRequestToDelete(req.id)}
                      className="mediate-trash-btn"
                      title="Hapus Mediasi"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem', color: '#94a3b8', border: '1px solid #E4EDE8' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 1.25rem', opacity: 0.2, color: '#134E39' }} />
            <p style={{ fontWeight: '800', color: '#134E39', margin: 0 }}>Tidak ada permintaan mediasi yang ditemukan.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
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

      {/* Wali Verification Modal */}
      {verifyingWaliId && (() => {
        const req = taarufRequests.find(r => r.id === verifyingWaliId);
        return (
          <div className="modal-overlay" onClick={() => setVerifyingWaliId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', width: '95%', padding: 0 }}>
              <div style={{ background: '#2563eb', color: 'white', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '950', letterSpacing: '-0.02em' }}>Verifikasi Kontak Wali</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.85, fontWeight: '500' }}>Konfirmasi nomor wali kedua belah pihak</p>
                </div>
                <button onClick={() => setVerifyingWaliId(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: '36px', height: '36px', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={20} /></button>
              </div>

              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Wali Sender */}
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Wali {req.senderAlias} (Pengirim)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#134E39' }}>{req.senderWaliPhone || '-'}</div>
                      <a href={`https://wa.me/${req.senderWaliPhone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '0.5rem 1rem', borderRadius: '8px', background: 'white', border: '1px solid #cbd5e1', color: '#334155', textDecoration: 'none', fontWeight: '800' }}>
                        <ExternalLink size={14} /> Hubungi via WA
                      </a>
                    </div>
                  </div>

                  {/* Wali Target */}
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Wali {req.targetAlias} (Target)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#134E39' }}>{req.targetWaliPhone || '-'}</div>
                      <a href={`https://wa.me/${req.targetWaliPhone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '0.5rem 1rem', borderRadius: '8px', background: 'white', border: '1px solid #cbd5e1', color: '#334155', textDecoration: 'none', fontWeight: '800' }}>
                        <ExternalLink size={14} /> Hubungi via WA
                      </a>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'flex', gap: '12px' }}>
                  <ShieldAlert size={20} color="#1d4ed8" style={{ flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#1e40af', fontWeight: '600', lineHeight: '1.5' }}>Pastikan Anda telah melakukan verifikasi manual kepada kedua wali sebelum meneruskan proses ini ke Tahap Mediasi Wali.</p>
                </div>
              </div>

              <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#f8fafc' }}>
                <button className="mediate-btn-new detail" onClick={() => setVerifyingWaliId(null)}>Batal</button>
                <button className="mediate-btn-new primary-solid" onClick={() => {
                  updateTaarufStatus(req.id, 'wali_process');
                  addNotification(`Verifikasi Wali selesai. Mediasi #${req.id.substring(0,8)} masuk ke Tahap Wali.`);
                  setVerifyingWaliId(null);
                }}>Verifikasi Selesai & Lanjut</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Monitoring Modal */}
      {monitoringChatId && (() => {
        const req = taarufRequests.find(r => r.id === monitoringChatId);
        const chatData = messages.find(m => m.taarufId === monitoringChatId);
        
        return (
          <div className="modal-overlay" onClick={() => setMonitoringChatId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', width: '95%', padding: 0 }}>
              <div style={{ background: '#134E39', color: 'white', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '950', letterSpacing: '-0.02em' }}>Pemantauan Mediasi Q&A</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.85, fontWeight: '500' }}>ID Obrolan: #{req.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => setMonitoringChatId(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: '36px', height: '36px', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={20} /></button>
              </div>

              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', gap: '12px', background: 'rgba(19, 78, 57, 0.03)', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(19, 78, 57, 0.1)' }}>
                   <ShieldAlert size={20} color="#134E39" style={{ flexShrink: 0 }} />
                   <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', fontWeight: '600', lineHeight: 1.5 }}>
                     Anda sedang memantau percakapan Q&A antara <strong>{req.senderAlias}</strong> dan <strong>{req.targetAlias}</strong>. Patuhi kode etik kerahasiaan Separuh Agama.
                   </p>
                </div>

                <div className="monitoring-chat-history custom-scrollbar">
                  {(!chatData || chatData.chats.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                      <MessageCircle size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p style={{ margin: 0, fontWeight: '850', color: '#64748b' }}>Belum ada percakapan Q&A di ruangan ini.</p>
                    </div>
                  ) : (
                    chatData.chats.map((msg, index) => {
                      const isSender = msg.sender === req.senderEmail;
                      return (
                        <div key={index} className={`monitoring-bubble ${isSender ? 'sender' : 'target'}`}>
                          <div style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.8, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {msg.senderAlias}
                          </div>
                          <div style={{ fontWeight: '500' }}>{msg.text}</div>
                          <span className="monitoring-meta">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#f8fafc' }}>
                <button className="mediate-btn-new detail" onClick={() => setMonitoringChatId(null)}>Tutup Pantauan</button>
                <button className="mediate-btn-new success" onClick={() => { setMonitoringChatId(null); setVerifyingWaliId(req.id); }}>Verifikasi Wali & Lanjut</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Detail Progress Modal */}
      {viewingRequestId && (() => {
        const req = taarufRequests.find(r => r.id === viewingRequestId);
        const statusSteps = [
          { status: 'pending_target', label: 'Tunggu Calon' },
          { status: 'pending_admin', label: 'Verifikasi Admin' },
          { status: 'qna', label: 'Sesi Q&A' },
          { status: 'wali_process', label: 'Proses Wali' },
          { status: 'meet', label: 'Nadzhor' },
          { status: 'completed', label: 'Menikah' }
        ];

        const getCurrentStepIndex = () => {
          if (req.status === 'rejected') return -1;
          const idx = statusSteps.findIndex(s => s.status === req.status);
          return idx !== -1 ? idx : 0;
        };

        const currentStepIdx = getCurrentStepIndex();

        return (
          <div className="modal-overlay" onClick={() => setViewingRequestId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', width: '95%', padding: 0 }}>
              <div style={{ background: '#134E39', color: 'white', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '950', letterSpacing: '-0.02em' }}>Detail Progres Mediasi</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.85 }}>ID Mediasi: #{req.id}</p>
                </div>
                <button onClick={() => setViewingRequestId(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: '36px', height: '36px', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={20} /></button>
              </div>

              <div style={{ padding: '2rem' }}>
                {/* Visual Stepper */}
                <div className="stepper-scroll" style={{ marginBottom: '2.5rem', padding: '0 10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', minWidth: '500px', paddingBottom: '10px' }}>
                    {/* Progress Line Background */}
                    <div style={{ position: 'absolute', top: '18px', left: 0, right: 0, height: '3px', background: '#f1f5f9', zIndex: 0 }}></div>
                    {/* Active Progress Line */}
                    <div style={{ 
                      position: 'absolute', top: '18px', left: 0, 
                      width: `${(currentStepIdx / (statusSteps.length - 1)) * 100}%`, 
                      height: '3px', background: '#134E39', zIndex: 1,
                      transition: 'width 0.5s ease' 
                    }}></div>

                    {statusSteps.map((step, idx) => {
                      const isCompleted = idx < currentStepIdx || (idx === currentStepIdx && req.status === 'completed');
                      const isActive = idx === currentStepIdx && req.status !== 'completed';

                      return (
                        <div key={idx} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <div style={{ 
                            width: '36px', height: '36px', borderRadius: '50%', 
                            background: isCompleted ? '#134E39' : (isActive ? 'white' : '#f8fafc'),
                            border: `2px solid ${isActive || isCompleted ? '#134E39' : '#e2e8f0'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isCompleted ? 'white' : (isActive ? '#134E39' : '#94a3b8'),
                            fontWeight: '800', fontSize: '0.75rem',
                            boxShadow: isActive ? '0 0 0 4px rgba(19, 78, 57, 0.1)' : 'none'
                          }}>
                            {isCompleted ? <CheckCircle size={18} /> : idx + 1}
                          </div>
                          <span style={{ 
                            marginTop: '8px', fontSize: '0.65rem', fontWeight: '800', 
                            textAlign: 'center', color: isActive || isCompleted ? '#134E39' : '#94a3b8',
                            width: '64px', lineHeight: 1.2
                          }}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                      <Activity size={16} color="#134E39" />
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: '#134E39' }}>Log Histori Mediasi</h4>
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#134E39', marginTop: '6px' }}></div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b' }}>Status Saat Ini: {statusSteps[currentStepIdx]?.label || req.status}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>Diperbaharui pada {new Date(req.updatedAt).toLocaleString('id-ID')}</div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e2e8f0', marginTop: '6px' }}></div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>Pengirim: <span style={{ color: '#134E39' }}>{req.senderAlias}</span> ({req.senderEmail})</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e2e8f0', marginTop: '6px' }}></div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>Penerima: <span style={{ color: '#A16207' }}>{req.targetAlias}</span> ({req.targetEmail})</div>
                        </div>
                      </div>
                   </div>
                </div>

                {req.status === 'rejected' && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', color: '#991b1b' }}>
                    <XCircle size={20} />
                    <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>Proses mediasi ini telah dibatalkan/ditolak.</div>
                  </div>
                )}
              </div>

              <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
                <button className="mediate-btn-new primary-solid" onClick={() => setViewingRequestId(null)}>Tutup</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Custom Delete Confirmation Modal */}
      {requestToDelete && (
        <div className="modal-overlay" onClick={() => setRequestToDelete(null)} style={{ zIndex: 10003 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ 
              width: '72px', height: '72px', borderRadius: '50%', background: '#fee2e2', 
              color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 1.25rem', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.08)'
            }}>
              <AlertCircle size={36} />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: '950', color: '#1e293b', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Konfirmasi Hapus</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.6', marginBottom: '2rem', fontWeight: '500' }}>
              Apakah Anda yakin ingin menghapus data mediasi ini? Tindakan ini bersifat <strong>permanen</strong> dan data percakapan Q&A terkait akan terhapus.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="mediate-btn-new detail" 
                style={{ flex: 1 }} 
                onClick={() => setRequestToDelete(null)}
              >
                Batal
              </button>
              <button 
                className="mediate-btn-new success" 
                style={{ flex: 1, background: '#ef4444', color: 'white', justifyContent: 'center' }} 
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
