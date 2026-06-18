"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Search, Activity, FileText, UserCheck, Star, 
  Quote, MessageSquare, GraduationCap, Menu, Bell, X, Trash2, 
  CheckCircle, ChevronDown, Settings, LogOut, Shield, AlertCircle, ShieldAlert, Heart, BookOpen,
  Zap
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
    lmsView, setLmsView, reportModalState, markNotificationsAsRead
  } = useAppContext();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
      // On mobile, start with sidebar closed
      if (mobile) setIsMobileMenuOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeTab = pathname.split('/')[2] || 'home';
  const isAcademyMode = activeTab === 'materi' || activeTab === 'courses';
  const subTab = searchParams.get('sub') || 'curriculum';

  const navigateTo = (newTab) => {
    const restrictedTabs = ['find', 'my_cv'];
    if (restrictedTabs.includes(newTab)) {
      if (!user?.profile_complete) {
        showAlert('Profil Belum Lengkap', 'Silakan lengkapi profil Anda (Nama, WhatsApp, & Domisili) di menu Akun sebelum mengakses fitur ini.', 'error');
        router.push('/dashboard/account?edit=true');
        if (window.innerWidth <= 1024) setIsMobileMenuOpen(false);
        return;
      }
    }
    router.push(`/dashboard/${newTab}`);
    if (isMobile) setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!isInitializing && !user) {
      router.push('/login');
    }
  }, [user, isInitializing, router]);

  if (isInitializing) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
       <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: '#134E39', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
       <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );



  const deleteNotification = async (id) => {
    await supabase.from('notifications').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const renderAlertBanner = () => {
    if (!user || isAdmin) return null;
    const isComplete = user.profile_complete;
    if (!isComplete && (!hideBanner || activeTab === 'home')) {
      return (
        <div style={{ background: '#fee2e2', borderBottom: '1px solid #fecaca', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', position: 'sticky', top: 0, zIndex: 1100 }}>
          <AlertCircle size={16} color="#dc2626" />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#991b1b' }}>Biodata Anda belum lengkap! Harap lengkapi di menu Pengaturan Akun.</span>
          <button onClick={() => router.push('/dashboard/account?edit=true')} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>Lengkapi Sekarang</button>
          <button onClick={() => setHideBanner(true)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`app-container ${isAcademyMode ? 'academy-mode' : ''}`}>
      {/* Overlay: only on mobile when sidebar is open */}
      {isMobile && isMobileMenuOpen && !isAcademyMode && <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {!isAcademyMode && (
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
                <SidebarLink icon={<Search size={20}/>} label="Cari Pasangan" active={activeTab === 'find'} onClick={() => navigateTo('find')} />
                <SidebarLink icon={<Activity size={20}/>} label="Status Taaruf" active={activeTab === 'status'} onClick={() => navigateTo('status')} />
                <SidebarLink icon={<FileText size={20}/>} label="CV Taaruf" active={activeTab === 'my_cv'} onClick={() => navigateTo('my_cv')} />
              </>
            ) : (
              <>
                <SidebarLink icon={<FileText size={20}/>} label="Review CV" active={activeTab === 'cv_review'} onClick={() => navigateTo('cv_review')} />
                <SidebarLink icon={<Activity size={20}/>} label="Mediasi Taaruf" active={activeTab === 'mediate'} onClick={() => navigateTo('mediate')} />
                <SidebarLink icon={<Star size={20}/>} label="Log Review" active={activeTab === 'reviews'} onClick={() => navigateTo('reviews')} />
                <SidebarLink icon={<ShieldAlert size={20}/>} label="Laporan" active={activeTab === 'reports'} onClick={() => navigateTo('reports')} />
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

      <div className="main-wrapper" style={isAcademyMode ? { marginLeft: 0, width: '100%' } : {}}>
        {renderAlertBanner()}
        {isAcademyMode ? (
          <header className="academy-header" style={{
            height: 'auto', minHeight: '80px', background: 'white', 
            display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) auto minmax(150px, 1fr)', alignItems: 'center',
            padding: '1rem 4%', position: 'sticky', top: 0, 
            zIndex: 1000, borderBottom: '1px solid #f1f5f9',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            gap: '15px'
          }}>
            {/* Left: Navigation Items */}
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div className="academy-nav-group" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {!isAdmin ? (
                <>
                  <button 
                    onClick={() => {
                      setLmsView('dashboard');
                      router.push('/dashboard/materi');
                    }}
                    className={`academy-nav-btn ${lmsView === 'dashboard' ? 'active' : ''}`}
                    style={{ 
                      background: lmsView === 'dashboard' ? '#134E39' : 'none', 
                      border: 'none', display: 'flex', alignItems: 'center', gap: '8px', 
                      color: lmsView === 'dashboard' ? 'white' : '#64748b', 
                      padding: '0.6rem 1rem', borderRadius: '10px',
                      fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
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
                    className={`academy-nav-btn ${lmsView === 'catalog' ? 'active' : ''}`}
                    style={{ 
                      background: lmsView === 'catalog' ? '#134E39' : 'none', 
                      border: 'none', display: 'flex', alignItems: 'center', gap: '8px', 
                      color: lmsView === 'catalog' ? 'white' : '#64748b', 
                      padding: '0.6rem 1rem', borderRadius: '10px',
                      fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <BookOpen size={18} /> <span className="hide-on-tablet">DAFTAR KELAS</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => router.push('/dashboard/courses?sub=curriculum')}
                    className={`academy-nav-btn ${subTab === 'curriculum' ? 'active' : ''}`}
                    style={{ 
                      background: subTab === 'curriculum' ? '#134E39' : 'none', 
                      border: 'none', display: 'flex', alignItems: 'center', gap: '8px', 
                      color: subTab === 'curriculum' ? 'white' : '#64748b', 
                      padding: '0.6rem 1rem', borderRadius: '10px',
                      fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
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
                      border: 'none', display: 'flex', alignItems: 'center', gap: '8px', 
                      color: subTab === 'enrollment' ? 'white' : '#64748b', 
                      padding: '0.6rem 1rem', borderRadius: '10px',
                      fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
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
                      border: 'none', display: 'flex', alignItems: 'center', gap: '8px', 
                      color: subTab === 'progress' ? 'white' : '#64748b', 
                      padding: '0.6rem 1rem', borderRadius: '10px',
                      fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <Activity size={18} /> <span className="hide-on-tablet">PROGRES</span>
                  </button>
                </>
              )}
              </div>
              
              <div className="hide-on-mobile" style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 5px', flexShrink: 0 }}></div>

              <button 
                onClick={() => {
                  setLmsView('welcome');
                  router.push('/dashboard/home');
                }} 
                style={{ 
                  background: '#f0fdf4', color: '#134E39', border: '1px solid #dcfce7', 
                  padding: '0.6rem 1rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
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
            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'flex-end', minWidth: 0, overflow: 'hidden' }}>
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
                    <button onClick={() => setShowNotifications(false)}><X size={20} /></button>
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
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`sidebar-link ${active ? 'active' : ''}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
        padding: '0.8rem 1rem', borderRadius: '8px', border: 'none',
        background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: active ? '#D4AF37' : 'rgba(255,255,255,0.7)',
        fontWeight: active ? '800' : '600', cursor: 'pointer', marginBottom: '4px'
      }}
    >
      {icon} <span>{label}</span>
    </button>
  );
}
