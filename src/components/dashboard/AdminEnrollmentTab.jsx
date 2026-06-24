import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { 
  Users, BookOpen, Calendar, Trash2, Search, 
  Filter, Download, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, X, CheckCircle2, Loader,
  MapPin, Briefcase, Phone, Mail, Award, Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminEnrollmentTab() {
  const { setConfirmState, showAlert, showToast, addNotification } = useAppContext();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [detailEnroll, setDetailEnroll] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // New Features states
  const [availableClasses, setAvailableClasses] = useState([]);
  const [transferEnroll, setTransferEnroll] = useState(null); // Enrollment to transfer
  const [selectedNewClassId, setSelectedNewClassId] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          user:user_id(name, email, gender),
          class:class_id(title)
        `)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      showAlert('Error', 'Gagal memuat data pendaftaran.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('lms_classes')
        .select('id, title')
        .order('order_index');
      if (error) throw error;
      setAvailableClasses(data || []);
    } catch (err) {
      console.error('Error fetching available classes:', err);
    }
  };

  useEffect(() => {
    fetchEnrollments();
    fetchAvailableClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset pagination to first page when search filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, genderFilter]);

  const handleDelete = (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Pendaftaran?',
      message: 'Apakah Anda yakin ingin membatalkan pendaftaran kelas ini? Pengguna akan kehilangan akses ke seluruh materi kelas tersebut.',
      onConfirm: () => processDelete(id)
    });
  };

  const processDelete = async (id) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEnrollments(prev => prev.filter(e => e.id !== id));
      showToast('Data pendaftaran telah dihapus.', 'success');
    } catch (err) {
      console.error('Error deleting enrollment:', err);
      showAlert('Error', 'Gagal menghapus data pendaftaran.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const fetchDetail = async (enroll) => {
    setDetailEnroll(enroll);
    setDetailLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', enroll.user_id)
        .single();
      
      if (error) throw error;
      setUserProfile(profile);
    } catch (err) {
      console.error('Error detail:', err);
      showAlert('Error', 'Gagal memuat profil pengguna.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleSuspend = (enroll) => {
    const actionText = enroll.is_suspended ? 'mengaktifkan kembali' : 'menangguhkan (suspend)';
    setConfirmState({
      isOpen: true,
      title: enroll.is_suspended ? 'Aktifkan Akses Akademi?' : 'Suspend Akses Akademi?',
      message: `Apakah Anda yakin ingin ${actionText} akses kelas untuk ${enroll.user?.name}?`,
      confirmText: enroll.is_suspended ? 'Ya, Aktifkan' : 'Ya, Suspend',
      confirmColor: enroll.is_suspended ? '#134E39' : '#ef4444',
      onConfirm: () => processToggleSuspend(enroll)
    });
  };

  const processToggleSuspend = async (enroll) => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({ is_suspended: !enroll.is_suspended })
        .eq('id', enroll.id);

      if (error) throw error;
      
      showToast(`Akses kelas untuk ${enroll.user?.name} telah ${enroll.is_suspended ? 'diaktifkan' : 'ditangguhkan'}.`, 'success');
      setEnrollments(prev => prev.map(e => e.id === enroll.id ? { ...e, is_suspended: !enroll.is_suspended } : e));

      // Send notification to the affected user
      const className = enroll.class?.title || 'kelas';
      if (enroll.is_suspended) {
        // Was suspended, now reactivated
        addNotification(
          `Alhamdulillah, akses Anda untuk kelas "${className}" telah diaktifkan kembali. Selamat melanjutkan belajar!`,
          enroll.user_id
        );
      } else {
        // Was active, now suspended
        addNotification(
          `Afwan, akses Anda untuk kelas "${className}" telah ditangguhkan oleh admin. Silakan hubungi Customer Service untuk info lebih lanjut.`,
          enroll.user_id
        );
      }
    } catch (err) {
      console.error('Error toggling suspend:', err);
      showAlert('Error', 'Gagal memproses status penangguhan.', 'error');
    }
  };

  const handleTransferClass = async (e) => {
    if (e) e.preventDefault();
    if (!transferEnroll || !selectedNewClassId) return;
    setTransferLoading(true);
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({ class_id: parseInt(selectedNewClassId, 10) })
        .eq('id', transferEnroll.id);

      if (error) throw error;
      
      showToast('Kelas pendaftar berhasil dipindahkan.', 'success');
      setTransferEnroll(null);
      fetchEnrollments();
    } catch (err) {
      console.error('Error transferring class:', err);
      showAlert('Error', 'Gagal memindahkan kelas.', 'error');
    } finally {
      setTransferLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter(e => {
    const matchesSearch = (
      e.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.class?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesGender = genderFilter === 'all' || e.user?.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  // Calculate items for current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedEnrollments = filteredEnrollments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', padding: isMobile ? '1rem' : '2rem 4%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.75rem', fontWeight: '950', color: '#134E39', letterSpacing: '-0.02em' }}>Manajemen Pendaftaran Kelas</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Kelola akses, pindahkan kelas, dan suspend akun pendaftar akademi.</p>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="card card-no-hover" style={{ padding: '1rem 1.25rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', alignItems: isMobile ? 'stretch' : 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Cari nama, email, atau kelas..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', height: '46px', padding: '0 2.5rem 0 2.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = '#134E39'}
              onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
            <div style={{ position: 'relative', display: 'flex', flex: isMobile ? 1 : 'none' }}>
              <Filter size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#134E39', pointerEvents: 'none' }} />
              <select 
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                style={{ width: '100%', minWidth: '150px', height: '46px', padding: '0 1rem 0 2.5rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '750', color: '#134E39', background: '#fff', cursor: 'pointer', outline: 'none', boxSizing: 'border-box', appearance: 'none' }}
              >
                <option value="all">Semua Gender</option>
                <option value="ikhwan">Ikhwan</option>
                <option value="akhwat">Akhwat</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0 1.25rem', height: '46px', background: 'rgba(19, 78, 57, 0.06)', borderRadius: '10px', color: '#134E39', fontSize: '0.85rem', fontWeight: '800', flexShrink: 0 }}>
              <Users size={16} /> 
              <span>{filteredEnrollments.length} Pendaftar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Table / Card List */}
      <div className="card card-no-hover" style={{ overflow: 'hidden', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: isMobile ? 'auto' : '950px' }}>
            {!isMobile && (
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#134E39', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pendaftar</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#134E39', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gender</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#134E39', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kelas</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#134E39', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#134E39', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tanggal Daftar</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#134E39', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
            )}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                    <Loader size={36} className="animate-spin" color="#134E39" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: '#64748b', fontWeight: '600', fontSize: '0.9rem' }}>Memuat data pendaftaran...</p>
                  </td>
                </tr>
              ) : filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                    <div style={{ width: '56px', height: '56px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#94a3b8' }}>
                      <AlertCircle size={28} />
                    </div>
                    <p style={{ color: '#64748b', fontWeight: '700', fontSize: '0.95rem' }}>Tidak ada data pendaftaran ditemukan.</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>Coba ubah kata kunci pencarian atau filter gender.</p>
                  </td>
                </tr>
              ) : isMobile ? (
                <tr>
                  <td colSpan="6" style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {paginatedEnrollments.map((enroll) => (
                        <div key={enroll.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.01)', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(19, 78, 57, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39', fontWeight: '950', fontSize: '1rem' }}>
                                {enroll.user?.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#1e293b', lineHeight: '1.3' }}>{enroll.user?.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginTop: '1px' }}>{enroll.user?.email}</div>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDelete(enroll.id)}
                              className="enrollment-btn-delete"
                              style={{ background: 'transparent', border: '1px solid #fee2e2', width: 32, height: 32, borderRadius: '8px', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                            {enroll.user?.gender === 'ikhwan' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7' }} /> Ikhwan
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#fce7f3', color: '#be185d', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#db2777' }} /> Akhwat
                              </span>
                            )}

                            {enroll.is_suspended ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} /> Suspended
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#dcfce7', color: '#15803d', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} /> Aktif
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0 0 0', borderTop: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <BookOpen size={14} color="#134E39" style={{ flexShrink: 0 }} />
                              <div style={{ fontSize: '0.85rem', color: '#134E39', fontWeight: '800' }}>{enroll.class?.title}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <Calendar size={14} color="#64748b" style={{ flexShrink: 0 }} />
                              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700' }}>
                                {new Date(enroll.enrolled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1.25rem' }}>
                            <button 
                              onClick={() => { setTransferEnroll(enroll); setSelectedNewClassId(enroll.class_id); }}
                              style={{ padding: '0.65rem', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            >
                              <RefreshCw size={12} /> Pindah Kelas
                            </button>
                            <button 
                              onClick={() => handleToggleSuspend(enroll)}
                              style={{ padding: '0.65rem', borderRadius: '8px', background: enroll.is_suspended ? '#dcfce7' : '#fee2e2', color: enroll.is_suspended ? '#15803d' : '#b91c1c', border: '1px solid', borderColor: enroll.is_suspended ? '#22c55e' : '#fca5a5', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              {enroll.is_suspended ? 'Aktifkan' : 'Suspend'}
                            </button>
                          </div>

                          <button 
                            onClick={() => fetchDetail(enroll)}
                            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(19,78,57,0.06)', color: '#134E39', border: 'none', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            Lihat Profil Lengkap
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEnrollments.map(enroll => (
                  <tr key={enroll.id} className="enrollment-row" style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(19, 78, 57, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39', fontWeight: '950', fontSize: '0.9rem', flexShrink: 0 }}>
                          {enroll.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>{enroll.user?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{enroll.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      {enroll.user?.gender === 'ikhwan' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '9999px', fontSize: '0.725rem', fontWeight: '800' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7' }} /> Ikhwan
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#fce7f3', color: '#be185d', borderRadius: '9999px', fontSize: '0.725rem', fontWeight: '800' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#db2777' }} /> Akhwat
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '8px', color: '#134E39', fontSize: '0.775rem', fontWeight: '800' }}>
                        <BookOpen size={14} color="#134E39" />
                        {enroll.class?.title}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      {enroll.is_suspended ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '9999px', fontSize: '0.725rem', fontWeight: '800' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} /> Ditangguhkan
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#dcfce7', color: '#15803d', borderRadius: '9999px', fontSize: '0.725rem', fontWeight: '800' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} /> Aktif
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.825rem', fontWeight: '700' }}>
                        <Calendar size={14} style={{ color: '#64748b' }} />
                        {new Date(enroll.enrolled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button 
                        onClick={() => { setTransferEnroll(enroll); setSelectedNewClassId(enroll.class_id); }}
                        className="enrollment-btn-transfer"
                        style={{ 
                          padding: '0.5rem 0.85rem', borderRadius: '8px', 
                          background: 'white', border: '1px solid #cbd5e1', 
                          color: '#475569', cursor: 'pointer', transition: 'all 0.2s',
                          fontSize: '0.725rem', fontWeight: '850', letterSpacing: '0.02em',
                          display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}
                        title="Pindahkan Kelas"
                      >
                        <RefreshCw size={12} /> PINDAH
                      </button>
                      <button 
                        onClick={() => handleToggleSuspend(enroll)}
                        className="enrollment-btn-suspend"
                        style={{ 
                          marginLeft: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '8px', 
                          background: enroll.is_suspended ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid',
                          borderColor: enroll.is_suspended ? '#22c55e' : '#fca5a5',
                          color: enroll.is_suspended ? '#15803d' : '#b91c1c', 
                          cursor: 'pointer', transition: 'all 0.2s',
                          fontSize: '0.725rem', fontWeight: '850', letterSpacing: '0.02em'
                        }}
                      >
                        {enroll.is_suspended ? 'AKTIFKAN' : 'SUSPEND'}
                      </button>
                      <button 
                        onClick={() => fetchDetail(enroll)}
                        className="enrollment-btn-detail"
                        style={{ 
                          marginLeft: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '8px', 
                          background: '#f8fafc', border: '1px solid #cbd5e1', 
                          color: '#134E39', cursor: 'pointer', transition: 'all 0.2s',
                          fontSize: '0.725rem', fontWeight: '850', letterSpacing: '0.02em'
                        }}
                      >
                        DETAIL
                      </button>
                      <button 
                        onClick={() => handleDelete(enroll.id)}
                        disabled={deletingId === enroll.id}
                        className="enrollment-btn-delete"
                        style={{ 
                          marginLeft: '0.4rem', padding: '0.5rem', borderRadius: '8px', 
                          background: 'transparent', border: '1px solid #fee2e2', 
                          color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Batalkan Pendaftaran"
                      >
                        {deletingId === enroll.id ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderTop: '1px solid #f1f5f9', background: '#f8fafc', gap: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
              Menampilkan <span style={{ fontWeight: '800', color: '#1e293b' }}>{indexOfFirstItem + 1}</span> hingga <span style={{ fontWeight: '800', color: '#1e293b' }}>{Math.min(indexOfLastItem, filteredEnrollments.length)}</span> dari <span style={{ fontWeight: '800', color: '#1e293b' }}>{filteredEnrollments.length}</span> pendaftar
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #cbd5e1', 
                  background: 'white', color: '#64748b', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }, (_, idx) => {
                const pageNum = idx + 1;
                if (totalPages > 6 && Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} style={{ padding: '0 0.25rem', color: '#cbd5e1', fontSize: '0.8rem' }}>...</span>;
                  }
                  return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{ 
                      width: '32px', height: '32px', borderRadius: '8px', 
                      border: '1px solid', borderColor: currentPage === pageNum ? '#134E39' : '#cbd5e1',
                      background: currentPage === pageNum ? '#134E39' : 'white',
                      color: currentPage === pageNum ? 'white' : '#475569',
                      fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #cbd5e1', 
                  background: 'white', color: '#64748b', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* ── MODAL: User Detail (Profile Data) ─────────────────────────────── */}
      {detailEnroll && (
        <div className="modal-overlay" onClick={() => setDetailEnroll(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%', maxHeight: '85vh', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '950', color: '#134E39' }}>Data Diri Calon</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Profil lengkap pendaftar akademi</p>
              </div>
              <button onClick={() => setDetailEnroll(null)} style={{ background: '#e2e8f0', border: 'none', width: 34, height: 34, borderRadius: '8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="custom-scrollbar">
               {detailLoading ? (
                 <div style={{ padding: '4rem', textAlign: 'center' }}>
                    <Loader className="animate-spin" size={32} color="#134E39" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: '#64748b', fontWeight: '600' }}>Mengambil profil lengkap...</p>
                 </div>
               ) : userProfile ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Header Card */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '16px' }}>
                       <div style={{ width: 60, height: 60, borderRadius: '12px', background: '#134E39', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '950', flexShrink: 0 }}>
                          {userProfile.name?.charAt(0).toUpperCase()}
                       </div>
                       <div>
                          <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#1e293b' }}>{userProfile.name}</div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Mail size={14} /> {userProfile.email}
                          </div>
                       </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                       <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={12} color="#94a3b8" /> Gender
                          </span>
                          <span style={{ fontSize: '0.875rem', fontWeight: '850', color: '#1e293b' }}>
                            {userProfile.gender === 'ikhwan' ? 'Laki-laki (Ikhwan)' : 'Perempuan (Akhwat)'}
                          </span>
                       </div>
                       <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} color="#94a3b8" /> Telepon
                          </span>
                          <span style={{ fontSize: '0.875rem', fontWeight: '850', color: '#1e293b' }}>{userProfile.phone || '-'}</span>
                       </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                       <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Briefcase size={12} color="#94a3b8" /> Pekerjaan
                          </span>
                          <span style={{ fontSize: '0.875rem', fontWeight: '850', color: '#1e293b' }}>{userProfile.occupation || '-'}</span>
                       </div>
                       <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} color="#94a3b8" /> TTL
                          </span>
                          <span style={{ fontSize: '0.875rem', fontWeight: '850', color: '#1e293b' }}>
                            {userProfile.birth_place || '-'}{userProfile.birth_date ? `, ${new Date(userProfile.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                          </span>
                       </div>
                    </div>

                    {/* Bio Section */}
                    <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Info size={16} color="#134E39" />
                          <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Status & Bio</div>
                       </div>
                       <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', fontWeight: '500' }}>
                          {userProfile.bio || 'Belum ada biodata yang diisi.'}
                       </div>
                    </div>

                    {/* Address Section */}
                    <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                       <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <MapPin size={14} color="#94a3b8" /> Alamat Lengkap
                       </span>
                       <span style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: '700', lineHeight: '1.5' }}>{userProfile.address || '-'}</span>
                    </div>

                    {/* Registration metadata */}
                    <div style={{ padding: '1rem', background: 'rgba(19, 78, 57, 0.04)', borderRadius: '12px', border: '1px dashed rgba(19, 78, 57, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <Award size={16} color="#134E39" />
                         <span style={{ fontSize: '0.8rem', color: '#134E39', fontWeight: '850' }}>Kelas Terdaftar</span>
                       </div>
                       <span style={{ fontSize: '0.825rem', color: '#1e293b', fontWeight: '900' }}>{detailEnroll.class?.title}</span>
                    </div>

                 </div>
               ) : (
                 <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>Gagal memuat profil.</div>
               )}
            </div>
            
            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '1.25rem', background: '#f8fafc', display: 'flex', gap: '0.75rem' }}>
               <button onClick={() => setDetailEnroll(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: '#134E39', color: 'white', border: 'none', fontWeight: '850', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1a5d46'} onMouseLeave={e => e.currentTarget.style.background = '#134E39'}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Pindah Kelas (Transfer Class) ────────────────────────── */}
      {transferEnroll && (
        <div className="modal-overlay" onClick={() => setTransferEnroll(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', width: '95%', borderRadius: '20px', overflow: 'hidden' }}>
            <form onSubmit={handleTransferClass}>
              <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '950', color: '#134E39' }}>Pindahkan Kelas Pendaftar</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Pindahkan user ke kelas akademi lainnya</p>
                </div>
                <button type="button" onClick={() => setTransferEnroll(null)} style={{ background: '#e2e8f0', border: 'none', width: 34, height: 34, borderRadius: '8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
              </div>
              
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Nama Pendaftar</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '850', color: '#1e293b' }}>{transferEnroll.user?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>{transferEnroll.user?.email}</div>
                </div>
                
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Kelas Saat Ini</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '850', color: '#134E39', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={16} /> {transferEnroll.class?.title}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b' }}>Pilih Kelas Baru</label>
                  <select 
                    value={selectedNewClassId}
                    onChange={e => setSelectedNewClassId(e.target.value)}
                    required
                    style={{ width: '100%', height: '46px', padding: '0 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontWeight: '750', background: 'white', color: '#1e293b', outline: 'none' }}
                  >
                    <option value="" disabled>Pilih Kelas Baru...</option>
                    {availableClasses.map(c => (
                      <option key={c.id} value={c.id} disabled={c.id === transferEnroll.class_id}>
                        {c.title} {c.id === transferEnroll.class_id ? '(Kelas Aktif)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '1.25rem', background: '#f8fafc', display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setTransferEnroll(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', fontWeight: '850', fontSize: '0.85rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={transferLoading} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: '#134E39', color: 'white', border: 'none', fontWeight: '850', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {transferLoading ? <Loader size={16} className="animate-spin" /> : 'Pindahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .enrollment-row:hover {
          background-color: #f8fafc !important;
        }
        .enrollment-btn-transfer:hover {
          background-color: #f1f5f9 !important;
          border-color: #94a3b8 !important;
        }
        .enrollment-btn-suspend:hover {
          opacity: 0.9 !important;
        }
        .enrollment-btn-detail:hover {
          background-color: #134E39 !important;
          color: white !important;
          border-color: #134E39 !important;
        }
        .enrollment-btn-delete:hover {
          background-color: #fee2e2 !important;
          border-color: #fca5a5 !important;
        }
      `}</style>
    </div>
  );
}
