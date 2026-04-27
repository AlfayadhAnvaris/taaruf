import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../App';
import { 
  Users, BookOpen, Calendar, Trash2, Search, 
  Filter, Download, ChevronLeft, AlertCircle, RefreshCw, X, CheckCircle2, Loader
} from 'lucide-react';
import { supabase } from '../../supabase';

export default function AdminEnrollmentTab({ showAlert }) {
  const { setConfirmState } = useContext(AppContext);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [detailEnroll, setDetailEnroll] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
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
          user:user_id(name, email),
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

  useEffect(() => {
    fetchEnrollments();
  }, []);

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
      showAlert('Berhasil', 'Data pendaftaran telah dihapus.', 'success');
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

  const filteredEnrollments = enrollments.filter(e => 
    e.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.class?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="card card-no-hover" style={{ padding: isMobile ? '1rem' : '1.5rem', marginBottom: '1.5rem', background: 'white', borderRadius: isMobile ? '16px' : '24px', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', alignItems: isMobile ? 'stretch' : 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Cari nama, email, atau kelas..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem 1.25rem', background: '#f8fafc', borderRadius: '14px', color: '#64748b', fontSize: '0.85rem', fontWeight: '700' }}>
            <Users size={16} /> {filteredEnrollments.length} Pendaftar
          </div>
        </div>
      </div>

      <div className="card card-no-hover" style={{ overflow: 'hidden', background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          {!isMobile && (
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#134E39', fontSize: '0.85rem' }}>USER</th>
                <th style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#134E39', fontSize: '0.85rem' }}>KELAS</th>
                <th style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#134E39', fontSize: '0.85rem' }}>TANGGAL DAFTAR</th>
                <th style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#134E39', fontSize: '0.85rem', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
          )}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTopColor: '#134E39', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                  <p style={{ color: '#64748b', fontWeight: '600' }}>Memuat data...</p>
                </td>
              </tr>
            ) : filteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', background: '#f8fafc', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#cbd5e1' }}>
                    <AlertCircle size={32} />
                  </div>
                  <p style={{ color: '#64748b', fontWeight: '700' }}>Tidak ada data pendaftaran ditemukan.</p>
                </td>
              </tr>
            ) : isMobile ? (
              <tr>
                <td colSpan="4" style={{ padding: '0.75rem' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {filteredEnrollments.map((enroll) => (
                        <div key={enroll.id} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '1.25rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(19,78,57,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39', fontWeight: '950', fontSize: '1rem' }}>
                                  {enroll.user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                   <div style={{ fontWeight: '950', fontSize: '0.95rem', color: '#1e293b', lineHeight: '1.2', wordBreak: 'break-word' }}>{enroll.user?.name}</div>
                                   <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginTop: '2px', wordBreak: 'break-all' }}>{enroll.user?.email}</div>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleDelete(enroll.id)}
                                style={{ background: 'rgba(230,57,70,0.06)', border: 'none', width: 36, height: 36, borderRadius: '10px', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                           <button 
                             onClick={() => fetchDetail(enroll)}
                             style={{ width: '100%', marginBottom: '1.25rem', padding: '0.85rem', borderRadius: '12px', background: 'rgba(19,78,57,0.05)', color: '#134E39', border: 'none', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}
                           >
                              Lihat Detail
                           </button>

                           <div style={{ paddingTop: '1rem', borderTop: '1px solid #f8fafc' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                                 <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <BookOpen size={16} color="#134E39" />
                                 </div>
                                 <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Kelas Terdaftar</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#134E39' }}>{enroll.class?.title}</div>
                                 </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                 <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Calendar size={16} color="#94a3b8" />
                                 </div>
                                 <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Waktu Pendaftaran</div>
                                    <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '700' }}>{new Date(enroll.enrolled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </td>
              </tr>
            ) : (
              filteredEnrollments.map(enroll => (
                <tr key={enroll.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39', fontWeight: '800', fontSize: '0.85rem' }}>
                        {enroll.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: '#1A2E25', fontSize: '0.9rem' }}>{enroll.user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{enroll.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(19,78,57,0.05)', borderRadius: '8px', color: '#134E39', fontSize: '0.8rem', fontWeight: '700' }}>
                      <BookOpen size={14} /> {enroll.class?.title}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>
                      <Calendar size={14} /> {new Date(enroll.enrolled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDelete(enroll.id)}
                      disabled={deletingId === enroll.id}
                      style={{ 
                        padding: '0.6rem', borderRadius: '10px', 
                        background: 'transparent', border: '1px solid #fee2e2', 
                        color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Trash2 size={18} />
                    </button>
                    <button 
                      onClick={() => fetchDetail(enroll)}
                      style={{ 
                        marginLeft: '0.5rem', padding: '0.6rem 1rem', borderRadius: '10px', 
                        background: '#f8fafc', border: '1px solid #e2e8f0', 
                        color: '#134E39', cursor: 'pointer', transition: 'all 0.2s',
                        fontSize: '0.75rem', fontWeight: '800'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#134E39'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#134E39'; }}
                    >
                      DETAIL
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* ── MODAL: User Detail (Profile Data) ─────────────────────────────── */}
      {detailEnroll && (
        <div className="modal-overlay" onClick={() => setDetailEnroll(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px', width: '95%', maxHeight: '85vh' }}>
            <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '950', color: '#134E39' }}>Data Diri Calon</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Profil lengkap pendaftar</p>
              </div>
              <button onClick={() => setDetailEnroll(null)} style={{ background: '#f8fafc', border: 'none', width: 36, height: 36, borderRadius: '10px', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
               {detailLoading ? (
                 <div style={{ padding: '4rem', textAlign: 'center' }}>
                    <Loader className="animate-spin" size={32} color="#134E39" />
                    <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: '600' }}>Mengambil profil...</p>
                 </div>
               ) : userProfile ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Header Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                       <div style={{ width: 64, height: 64, borderRadius: '20px', background: 'rgba(19,78,57,0.1)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '950' }}>
                          {userProfile.name?.charAt(0).toUpperCase()}
                       </div>
                       <div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>{userProfile.name}</div>
                          <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>{userProfile.email}</div>
                       </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                       <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Gender</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>{userProfile.gender === 'ikhwan' ? 'Laki-laki (Ikhwan)' : 'Perempuan (Akhwat)'}</div>
                       </div>
                       <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Telepon</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>{userProfile.phone || '-'}</div>
                       </div>
                    </div>

                    <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <Users size={16} color="#134E39" />
                          <div style={{ fontSize: '0.85rem', fontWeight: '950', color: '#1e293b' }}>Status & Bio</div>
                       </div>
                       <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
                          {userProfile.bio || 'Belum ada biodata yang diisi.'}
                       </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Tempat Lahir</span>
                          <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: '800' }}>{userProfile.birth_place || '-'}</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Tanggal Lahir</span>
                          <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: '800' }}>{userProfile.birth_date || '-'}</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Pekerjaan</span>
                          <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: '800' }}>{userProfile.occupation || '-'}</span>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Alamat Lengkap</span>
                          <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: '800', lineHeight: '1.5' }}>{userProfile.address || '-'}</span>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Gagal memuat profil.</div>
               )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '1.25rem' }}>
               <button className="btn btn-primary" onClick={() => setDetailEnroll(null)} style={{ width: '100%', borderRadius: '12px' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
