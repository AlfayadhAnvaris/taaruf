"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Search, Activity, FileText, UserCheck, Star, 
  Quote, MessageSquare, GraduationCap, Menu, Bell, X, Trash2, 
  CheckCircle, ChevronDown, Settings, LogOut, Shield, AlertCircle, ShieldAlert, Heart, BookOpen,
  Zap, Lock, ArrowLeft, Tag, MessageCircle, Phone, Award
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import ReportModal from '@/components/dashboard/ReportModal';

export default function DashboardLayout({ children }) {
  return (
    <React.Suspense fallback={
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
         <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: '#134E39', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
         <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </React.Suspense>
  );
}

function DashboardLayoutContent({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { 
    user, isAdmin, notifications, setNotifications, unreadCount, 
    handleLogout, showAlert, hideBanner, setHideBanner, isInitializing,
    lmsView, setLmsView, reportModalState, markNotificationsAsRead, cvs,
    csContacts
  } = useAppContext();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCsPopup, setShowCsPopup] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const toggleNotifications = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState && unreadCount > 0) {
      markNotificationsAsRead();
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) setIsMobileMenuOpen(false);
      else setIsMobileMenuOpen(true);
    };
    checkMobile();
    setHasMounted(true);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeTab = pathname.split('/')[2] || 'home';
  const isAcademyMode = activeTab === 'materi' || activeTab === 'courses' || activeTab === 'leaderboard';
  const isAccountMode = activeTab === 'account' || activeTab === 'admin';
  const hideSidebar = isAcademyMode || isAccountMode;
  const subTab = searchParams.get('sub') || 'curriculum';

  const myExistingCv = cvs.find(cv => cv.user_id === user?.id);
  const isCvComplete = React.useMemo(() => {
    if (!myExistingCv) return false;
    const fields = [
      'alias', 'gender', 'age', 'domisili_provinsi', 'domisili_kota', 'address', 'marital_status', 'suku',
      'foto_url', 'tinggi_badan', 'berat_badan', 'ciri_fisik', 'kesehatan', 'karakter_positif', 'karakter_negatif',
      'hobi', 'hal_disukai', 'hal_benci', 'kondisi_keluarga', 'pekerjaan_ortu', 'anak_ke_dari', 'education',
      'riwayat_pendidikan', 'job', 'salary', 'pengalaman_kerja', 'worship_wajib', 'worship_sunnah', 'baca_quran',
      'kajian', 'marriage_vision', 'role_view', 'target_menikah', 'rencana_nafkah', 'poligami', 'harapan_pasangan',
      'kriteria_fisik', 'kriteria_non_fisik'
    ];
    return fields.every(field => {
      const val = myExistingCv[field];
      return val !== undefined && val !== null && val !== '';
    });
  }, [myExistingCv, cvs]);

  const navigateTo = (newTab) => {
    router.push(`/dashboard/${newTab}`);
    if (isMobile) setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!isInitializing && !user) {
      router.push('/login');
    }
  }, [user, isInitializing, router]);

  if (isInitializing) return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#FFFFFF',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '1.5rem',
        animation: 'pulseGently 2s infinite ease-in-out'
      }}>
        <img src="/assets/logo.svg" alt="Separuh Agama Logo" style={{ width: '90px', height: '90px' }} />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '950', color: '#134E39', letterSpacing: '-0.02em' }}>
            Separuh <span style={{ color: '#D4AF37' }}>Agama</span>
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Platform Taaruf Syar'i
          </p>
        </div>
      </div>
      <div style={{ 
        marginTop: '2.5rem', 
        width: '40px', 
        height: '40px', 
        borderRadius: '50%', 
        border: '3px solid rgba(19, 78, 57, 0.08)', 
        borderTopColor: '#D4AF37', 
        animation: 'spin 0.8s linear infinite' 
      }} />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseGently {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.03); opacity: 1; }
        }
      `}</style>
    </div>
  );



  const deleteNotification = async (id) => {
    await supabase.from('notifications').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const renderAlertBanner = () => {
    if (!user || isAdmin) return null;
    const isProfileComplete = user.profile_complete;
    
    if (!isProfileComplete && (!hideBanner || activeTab === 'home')) {
      return (
        <div style={{ background: '#fee2e2', borderBottom: '1px solid #fecaca', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', position: 'sticky', top: 0, zIndex: 1100 }}>
          <AlertCircle size={16} color="#dc2626" />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#991b1b' }}>Biodata Anda belum lengkap! Harap lengkapi di menu Pengaturan Akun.</span>
          <button onClick={() => router.push('/dashboard/account?edit=true')} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>Lengkapi Sekarang</button>
          <button onClick={() => setHideBanner(true)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      );
    }
    
    if (!isCvComplete && (!hideBanner || activeTab === 'home')) {
      return (
        <div style={{ background: '#fffbeb', borderBottom: '1px solid #fef3c7', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', position: 'sticky', top: 0, zIndex: 1100 }}>
          <AlertCircle size={16} color="#d97706" />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#92400e' }}>CV Taaruf Anda belum lengkap! Harap lengkapi untuk dapat mencari pasangan dan melihat status taaruf.</span>
          <button onClick={() => router.push('/dashboard/my_cv?edit=true')} style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>Lengkapi CV</button>
          <button onClick={() => setHideBanner(true)} style={{ background: 'none', border: 'none', color: '#d97706', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`app-container ${hideSidebar ? 'academy-mode' : ''}`}>
      {/* Overlay: only on mobile when sidebar is open */}
      {isMobile && isMobileMenuOpen && !hideSidebar && <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {!hideSidebar && (
        <aside className={`sidebar ${isMobileMenuOpen ? 'open' : 'closed'}`} style={{ background: 'linear-gradient(180deg, #134E39 0%, #1a5d46 100%)', color: 'white' }}>
          <div className="sidebar-header" style={{ padding: '2.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Link href="/dashboard" className="sidebar-brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img src="/assets/logo.svg" alt="Logo" style={{ width: 34, height: 34 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: '950', color: 'white' }}>Separuh</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '950', color: '#D4AF37' }}>Agama</span>
              </div>
            </Link>
            <button 
              className="sidebar-close-btn" 
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'rgba(255,255,255,0.8)', 
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.4rem',
                borderRadius: '8px',
                transition: 'background 0.2s',
              }}
            >
              <X size={22} />
            </button>
          </div>
          
          <nav className="sidebar-nav" style={{ padding: '1rem' }}>
            <SidebarLink icon={<LayoutDashboard size={20}/>} label="Beranda" active={activeTab === 'home'} onClick={() => navigateTo('home')} />
            {!isAdmin ? (
              <>
                <SidebarLink icon={<Search size={20}/>} label="Cari Pasangan" active={activeTab === 'find'} onClick={() => navigateTo('find')} locked={!user?.profile_complete || !isCvComplete} />
                <SidebarLink icon={<Activity size={20}/>} label="Status Taaruf" active={activeTab === 'status'} onClick={() => navigateTo('status')} locked={!user?.profile_complete || !isCvComplete} />
                <SidebarLink icon={<FileText size={20}/>} label="CV Taaruf" active={activeTab === 'my_cv'} onClick={() => navigateTo('my_cv')} />
              </>
            ) : (
              <>
                <SidebarLink icon={<FileText size={20}/>} label="Review CV" active={activeTab === 'cv_review'} onClick={() => navigateTo('cv_review')} />
                <SidebarLink icon={<Activity size={20}/>} label="Mediasi Taaruf" active={activeTab === 'mediate'} onClick={() => navigateTo('mediate')} />
                <SidebarLink icon={<Star size={20}/>} label="Review Kandidat" active={activeTab === 'reviews'} onClick={() => navigateTo('reviews')} />
                <SidebarLink icon={<ShieldAlert size={20}/>} label="Laporan" active={activeTab === 'reports'} onClick={() => navigateTo('reports')} />
                <SidebarLink icon={<Quote size={20}/>} label="Testimoni" active={activeTab === 'testimonials'} onClick={() => navigateTo('testimonials')} />
              </>
            )}
            <SidebarLink icon={<MessageSquare size={20}/>} label="Saran & Masukan" active={activeTab === 'feedback'} onClick={() => navigateTo('feedback')} />
          </nav>

          <div style={{ padding: '1.5rem', marginTop: 'auto' }}>
            <button onClick={() => router.push(isAdmin ? '/dashboard/courses' : '/dashboard/materi')} className="academy-promo-btn">
              <div style={{ width: 40, height: 40, borderRadius: '5px', background: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}>
                 <GraduationCap size={22} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '900', color: 'white' }}>{isAdmin ? 'STUDIO' : 'Separuh Agama ACADEMY'}</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: '600', color: 'white' }}>Ilmu Pernikahan</div>
              </div>
            </button>
          </div>
        </aside>
      )}

      <div className="main-wrapper" style={hideSidebar ? { marginLeft: 0, width: '100%' } : {}}>
        {renderAlertBanner()}
        {isAcademyMode ? (
          <header className="academy-header" style={{
            height: 'auto', minHeight: '80px', background: 'white', 
            display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) auto minmax(150px, 1fr)', alignItems: 'center',
            padding: '1rem 2%', position: 'sticky', top: 0, 
            zIndex: 1000, borderBottom: '1px solid #f1f5f9',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            gap: '12px',
            flexShrink: 0
          }}>
            {/* Left: Navigation Items */}
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div className="academy-nav-group" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {!isAdmin ? (
                <>
                  <button 
                    onClick={() => {
                      setLmsView('dashboard');
                      router.push('/dashboard/materi');
                    }}
                    className={`academy-nav-btn ${lmsView === 'dashboard' && activeTab === 'materi' ? 'active' : ''}`}
                    style={{ 
                      background: lmsView === 'dashboard' && activeTab === 'materi' ? '#134E39' : 'none', 
                      border: 'none', display: 'flex', alignItems: 'center', gap: '6px', 
                      color: lmsView === 'dashboard' && activeTab === 'materi' ? 'white' : '#64748b', 
                      padding: '0.5rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <Activity size={18} /> <span className="hide-on-tablet">DASHBOARD</span>
                  </button>
                  <button 
                    onClick={() => {
                      setLmsView('catalog');
                      router.push('/dashboard/materi');
                    }}
                    className={`academy-nav-btn ${lmsView === 'catalog' && activeTab === 'materi' ? 'active' : ''}`}
                    style={{ 
                      background: lmsView === 'catalog' && activeTab === 'materi' ? '#134E39' : 'none', 
                      border: 'none', display: 'flex', alignItems: 'center', gap: '6px', 
                      color: lmsView === 'catalog' && activeTab === 'materi' ? 'white' : '#64748b', 
                      padding: '0.5rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <BookOpen size={18} /> <span className="hide-on-tablet">DAFTAR KELAS</span>
                  </button>
                  <button 
                    onClick={() => {
                      router.push('/dashboard/leaderboard');
                    }}
                    className={`academy-nav-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
                    style={{ 
                      background: activeTab === 'leaderboard' ? '#134E39' : 'none', 
                      border: 'none', display: 'flex', alignItems: 'center', gap: '6px', 
                      color: activeTab === 'leaderboard' ? 'white' : '#64748b', 
                      padding: '0.5rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <Award size={18} /> <span className="hide-on-tablet">PERINGKAT BELAJAR</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => router.push('/dashboard/courses?sub=curriculum')}
                    className={`academy-nav-btn ${subTab === 'curriculum' ? 'active' : ''}`}
                    style={{ 
                      background: subTab === 'curriculum' ? '#134E39' : 'none', 
                      border: 'none', display: 'flex', alignItems: 'center', gap: '6px', 
                      color: subTab === 'curriculum' ? 'white' : '#64748b', 
                      padding: '0.5rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <Zap size={18} /> <span className="hide-on-tablet">KURIKULUM</span>
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard/courses?sub=enrollment')}
                    className={`academy-nav-btn ${subTab === 'enrollment' ? 'active' : ''}`}
                    style={{ 
                      background: subTab === 'enrollment' ? '#134E39' : 'none', 
                      border: 'none', display: 'flex', alignItems: 'center', gap: '6px', 
                      color: subTab === 'enrollment' ? 'white' : '#64748b', 
                      padding: '0.5rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <UserCheck size={18} /> <span className="hide-on-tablet">PENDAFTARAN</span>
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard/courses?sub=progress')}
                    className={`academy-nav-btn ${subTab === 'progress' ? 'active' : ''}`}
                    style={{ 
                      background: subTab === 'progress' ? '#134E39' : 'none', 
                      border: 'none', display: 'flex', alignItems: 'center', gap: '6px', 
                      color: subTab === 'progress' ? 'white' : '#64748b', 
                      padding: '0.5rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <Activity size={18} /> <span className="hide-on-tablet">PROGRES</span>
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard/courses?sub=category')}
                    className={`academy-nav-btn ${subTab === 'category' ? 'active' : ''}`}
                    style={{ 
                      background: subTab === 'category' ? '#134E39' : 'none', 
                      border: 'none', display: 'flex', alignItems: 'center', gap: '6px', 
                      color: subTab === 'category' ? 'white' : '#64748b', 
                      padding: '0.5rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <Tag size={18} /> <span className="hide-on-tablet">KATEGORI</span>
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard/courses?sub=leaderboard')}
                    className={`academy-nav-btn ${subTab === 'leaderboard' ? 'active' : ''}`}
                    style={{ 
                      background: subTab === 'leaderboard' ? '#134E39' : 'none', 
                      border: 'none', display: 'flex', alignItems: 'center', gap: '6px', 
                      color: subTab === 'leaderboard' ? 'white' : '#64748b', 
                      padding: '0.5rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <Award size={18} /> <span className="hide-on-tablet">KELOLA PERINGKAT</span>
                  </button>
                </>
              )}
              </div>
              
              <div className="hide-on-mobile" style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 3px', flexShrink: 0 }}></div>

              <button 
                onClick={() => {
                  setLmsView('welcome');
                  router.push('/dashboard/home');
                }} 
                className="academy-nav-btn"
                style={{ 
                  background: '#f0fdf4', color: '#134E39', border: '1px solid #dcfce7', 
                  padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '800', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  flexShrink: 0
                }}
              >
                <LayoutDashboard size={18} /> <span className="hide-on-tablet">TAARUF</span>
              </button>
            </div>

            {/* Center: Branding */}
            <div className="academy-branding" style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              justifyContent: 'center'
            }}>
              <div className="academy-branding-text hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: '950', color: '#134E39', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Separuh Agama</span>
                <span style={{ fontSize: '0.95rem', fontWeight: '950', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  {isAdmin && activeTab === 'courses' ? 'STUDIO' : 'Academy'}
                </span>
              </div>
              <div className="academy-branding-icon">
                <img src="/assets/logo.svg" alt="Separuh Agama Logo" style={{ width: 34, height: 34 }} />
              </div>
            </div>

            {/* Right: User Actions */}
            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'flex-end', minWidth: 0 }}>
              <div className="notification-wrapper" style={{ position: 'relative' }}>
                <button className="icon-btn" onClick={toggleNotifications} style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={22} color="#64748b" />
                  {unreadCount > 0 && (
                    <span className="notification-badge" style={{ 
                      position: 'absolute', top: '-4px', right: '-6px', background: '#10b981', 
                      color: 'white', fontSize: '0.6rem', fontWeight: '900', width: '18px', height: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                      border: '2px solid white'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notif-header">
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#134E39' }}>Notifikasi</h3>
                      <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
                    </div>
                    <div className="notif-list custom-scrollbar">
                      {notifications.length === 0 ? <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Belum ada notifikasi.</p> : notifications.map(n => (
                        <div key={n.id} className="notif-item">
                          <div className="notif-content"><p>{n.text}</p><span>{n.time}</span></div>
                          <button onClick={() => deleteNotification(n.id)} className="notif-delete-btn"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-menu-wrapper">
                <button className="profile-card-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                  <div className="profile-card-avatar"><span>{user?.name?.charAt(0).toUpperCase() || 'I'}</span></div>
                  <div className="profile-card-info">
                    <span className="profile-card-name">{user?.name || 'User'}</span>
                  </div>
                  <ChevronDown size={14} />
                </button>
                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <button className="dropdown-action-btn" onClick={() => { setShowProfileMenu(false); router.push(isAdmin ? '/dashboard/admin' : '/dashboard/account'); }}>
                      <Settings size={16} />
                      <span>Pengaturan</span>
                    </button>
                    <button className="dropdown-action-btn logout" onClick={handleLogout}>
                      <LogOut size={16} />
                      <span>Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        ) : isAccountMode ? (
          <header className="top-header" style={{ background: '#ffffff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', padding: '0 2rem' }}>
            <button 
              onClick={() => router.push('/dashboard/home')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'transparent', 
                border: 'none', 
                fontSize: '0.85rem', 
                fontWeight: '800', 
                color: '#134E39', 
                cursor: 'pointer',
                padding: '0.5rem 0',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <ArrowLeft size={18} /> KEMBALI KE BERANDA
            </button>
          </header>
        ) : (
          <header className="top-header" style={{ background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
            <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu size={20} />
            </button>
            <div className="header-right">
              <div className="notification-wrapper" style={{ position: 'relative' }}>
                <button className="icon-btn" onClick={toggleNotifications}>
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="notification-badge" style={{ 
                      position: 'absolute', top: '-4px', right: '-6px', background: '#10b981', 
                      color: 'white', fontSize: '0.6rem', fontWeight: '900', width: '18px', height: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                      border: '2px solid white'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notif-header">
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#134E39' }}>Notifikasi</h3>
                      <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={20} color="#64748b" /></button>
                    </div>
                    <div className="notif-list custom-scrollbar">
                      {notifications.length === 0 ? <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Belum ada notifikasi.</p> : notifications.map(n => (
                        <div key={n.id} className="notif-item">
                          <div className="notif-content"><p>{n.text}</p><span>{n.time}</span></div>
                          <button onClick={() => deleteNotification(n.id)} className="notif-delete-btn"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="profile-menu-wrapper">
                <button className="profile-card-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                  <div className="profile-card-avatar"><span>{user?.name?.charAt(0).toUpperCase()}</span></div>
                  <div className="profile-card-info">
                    <span className="profile-card-name">{user?.name}</span>
                  </div>
                  <ChevronDown size={14} />
                </button>
                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <button className="dropdown-action-btn" onClick={() => { setShowProfileMenu(false); router.push(isAdmin ? '/dashboard/admin' : '/dashboard/account'); }}>
                      <Settings size={16} />
                      <span>Pengaturan</span>
                    </button>
                    <button className="dropdown-action-btn logout" onClick={handleLogout}>
                      <LogOut size={16} />
                      <span>Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        <main className="main-content" style={{ padding: '0' }}>
          {children}
        </main>
      </div>
      <ReportModal />

      {/* Floating CS WhatsApp Button */}
      {(() => {
        const activeCs = (csContacts || []).filter(c => c.is_active);
        if (activeCs.length === 0 || isAdmin) return null;
        return (
          <>
            {/* CS Popup */}
            {showCsPopup && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 3500 }} onClick={() => setShowCsPopup(false)}>
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'fixed', bottom: '100px', right: '24px', zIndex: 3501,
                    width: '320px', maxHeight: '400px',
                    background: 'white', borderRadius: '18px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    animation: 'csPopupIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#134E39' }}>Customer Service</h4>
                      <button onClick={() => setShowCsPopup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                        <X size={18} color="#94a3b8" />
                      </button>
                    </div>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Butuh bantuan? Chat CS via WhatsApp</p>
                  </div>
                  <div style={{ padding: '0.75rem', maxHeight: '280px', overflowY: 'auto' }} className="custom-scrollbar">
                    {activeCs.map(cs => (
                      <a
                        key={cs.id}
                        href={`https://wa.me/${cs.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Assalamu'alaikum, saya membutuhkan bantuan.")}`}
                        target="_blank" rel="noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '0.85rem 1rem', borderRadius: '12px',
                          textDecoration: 'none', color: '#1e293b',
                          transition: 'all 0.15s', marginBottom: '4px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
                          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '1rem', fontWeight: '900'
                        }}>
                          {cs.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b' }}>{cs.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>
                            {cs.label} • {cs.phone_number}
                          </div>
                        </div>
                        <MessageCircle size={18} color="#25D366" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Floating Button */}
            <button
              onClick={() => setShowCsPopup(!showCsPopup)}
              style={{
                position: 'fixed', bottom: '28px', right: '28px', zIndex: 3499,
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                border: 'none', cursor: 'pointer', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(37,211,102,0.4)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: showCsPopup ? 'scale(0.9) rotate(45deg)' : 'scale(1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = showCsPopup ? 'scale(0.95) rotate(45deg)' : 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(37,211,102,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = showCsPopup ? 'scale(0.9) rotate(45deg)' : 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,211,102,0.4)'; }}
            >
              {showCsPopup ? <X size={24} /> : <MessageCircle size={26} />}
            </button>

            <style>{`
              @keyframes csPopupIn {
                from { opacity: 0; transform: translateY(12px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
          </>
        );
      })()}
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick, locked }) {
  return (
    <button 
      onClick={onClick}
      className={`sidebar-link ${active ? 'active' : ''}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
        padding: '0.8rem 1rem', borderRadius: '8px', border: 'none',
        background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: active ? '#D4AF37' : 'rgba(255,255,255,0.7)',
        fontWeight: active ? '800' : '600', cursor: 'pointer', marginBottom: '4px',
        position: 'relative'
      }}
    >
      {icon} <span>{label}</span>
      {locked && (
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', opacity: 0.8, color: '#D4AF37' }}>
          <Lock size={14} />
        </span>
      )}
    </button>
  );
}
