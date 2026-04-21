import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, Outlet, Link } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CompleteProfilePage from './pages/CompleteProfilePage';
import { Heart, XCircle, CheckCircle, AlertCircle, Search, UserCheck, FileText, User as UserIcon, Activity, Bell, BookOpen, Menu, X, LogOut, LayoutDashboard, ChevronDown, ChevronLeft, Settings, Shield, GraduationCap, Award, Star, MessageSquare } from 'lucide-react';
import { supabase } from './supabase';

export const AppContext = createContext();

// --- Private Route Helper ---
const PrivateRoute = ({ children, user }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// --- Access Denied Component ---
const AccessDenied = () => {
  const navigate = useNavigate();
  return (
    <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', animation: 'fadeIn 0.5s ease' }}>
      <div style={{ background: '#fee2e2', padding: '2rem', borderRadius: '30px', border: '2px solid #fecaca', maxWidth: '500px', boxShadow: '0 20px 50px rgba(220, 38, 38, 0.1)' }}>
        <div style={{ background: '#dc2626', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 20px rgba(220, 38, 38, 0.3)' }}>
          <Shield size={40} color="white" />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#991b1b', margin: '0 0 1rem' }}>Akses Dibatasi</h1>
        <p style={{ color: '#b91c1c', fontWeight: '600', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          Maaf, Anda tidak memiliki izin untuk mengakses fitur ini. Halaman ini hanya tersedia untuk Administrator Mawaddah.
        </p>
        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', marginBottom: '2rem', opacity: 0.6 }}>Error Code: 403 Forbidden</div>
        <button 
          onClick={() => navigate('/app/home')}
          style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: '#dc2626', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 15px rgba(220, 38, 38, 0.2)', transition: 'all 0.2s' }}
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
};

// --- Dashboard Layout Component ---
const DashboardLayout = ({ isMobileMenuOpen, setIsMobileMenuOpen, handleLogout, unreadCount, notifications, deleteNotification, markAllAsRead, deleteAllNotifications, showNotifications, setShowNotifications, showProfileMenu, setShowProfileMenu, user, isAdmin, hideBanner, setHideBanner, cvs }) => {
  const navigate = useNavigate();
  const { tab, id } = useParams();
  const activeTab = tab || 'home';

  const adminOnlyTabs = ['mediate', 'courses', 'feedback_admin', 'admin'];
  if (adminOnlyTabs.includes(tab) && !isAdmin) {
    return <AccessDenied />;
  }

  const navigateTo = (newTab) => {
    navigate(`/app/${newTab}`);
    if (window.innerWidth <= 1024) setIsMobileMenuOpen(false);
  };

  const isAcademyMode = (activeTab === 'materi' || activeTab === 'certificate') && !isAdmin;
  const isAdminAcademy = activeTab === 'courses' && isAdmin;

  // Header Title Logic
  const getHeaderTitle = () => {
    if (isAdminAcademy) return { main: 'MAWADDAH', sub: 'STUDIO', icon: <BookOpen size={20} color="white" /> };
    if (isAcademyMode) return { main: 'MAWADDAH', sub: 'ACADEMY', icon: <GraduationCap size={20} color="white" /> };
    return { main: 'MAWADDAH', sub: 'MATCH', icon: <Heart size={20} color="white" /> };
  };
  const headerBrand = getHeaderTitle();

  if (isAcademyMode || isAdminAcademy) {
    return (
      <div className="app-container academy-fullscreen" style={{ background: '#f8fafc' }}>
        <div className="main-wrapper" style={{ marginLeft: 0, width: '100%' }}>
          {/* Global Profile Completion Alert for Academy */}
          {user && !isAdmin && (
            (() => {
              const isAkhwat = user.gender === 'akhwat';
              const isComplete = user.phone_wa && user.domisili_provinsi && user.domisili_kota && 
                               user.pekerjaan && user.pendidikan_terakhir &&
                               (!isAkhwat || (user.wali_name && user.wali_phone));
              const hasCv = cvs.some(c => c.user_id === user.id);
              if (!isComplete && !hideBanner) {
                return (
                  <div className="academy-alert-banner" style={{ background: '#fee2e2', borderBottom: '1px solid #fecaca', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', position: 'sticky', top: 0, zIndex: 1100, animation: 'fadeInDown 0.4s ease' }}>
                    <AlertCircle size={16} color="#dc2626" />
                    <span className="banner-text" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#991b1b' }}>Biodata Anda belum lengkap! Harap lengkapi di menu Pengaturan Akun.</span>
                    <button className="banner-btn" onClick={() => navigate('/app/account')} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}>Lengkapi sekarang</button>
                    <button onClick={() => { setHideBanner(true); localStorage.setItem('mawaddah_hide_profile_banner', 'true'); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.2rem' }}><X size={16} /></button>
                  </div>
                );
              }
              return null;
            })()
          )}
          <header className="top-header academy-top-header" style={{ left: 0, width: '100%', borderBottom: '1px solid #e2e8f0', background: 'white', zIndex: 1000 }}>
             <div className="header-left academy-header-left academy-nav-btns" style={{ display: 'flex', gap: '8px' }}>
                <button title="Portal Utama" onClick={() => navigate('/app/home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(19,78,57,0.05)', color: '#134E39', border: '1px solid rgba(19,78,57,0.1)', padding: '0.6rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <LayoutDashboard size={18} /> <span className="btn-text">{isAdmin ? 'MANAGEMENT PORTAL' : 'PORTAL UTAMA'}</span>
                </button>
                <div className="btn-divider" style={{ width: '1px', height: '20px', background: '#e2e8f0', alignSelf: 'center' }} />
                {!isAdmin ? (
                  <>
                    <button title="Katalog" onClick={() => navigate('/app/materi/catalog')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: id === 'catalog' ? '#134E39' : 'transparent', color: id === 'catalog' ? 'white' : '#64748b', border: 'none', padding: '0.6rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <BookOpen size={18} /> <span className="btn-text">KATALOG</span>
                    </button>
                    <button title="Progress Saya" onClick={() => navigate('/app/materi/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: id === 'dashboard' ? '#134E39' : 'transparent', color: id === 'dashboard' ? 'white' : '#64748b', border: 'none', padding: '0.6rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <Activity size={18} /> <span className="btn-text">PROGRESS SAYA</span>
                    </button>
                  </>
                ) : (
                  <button title="Academy Studio" onClick={() => navigate('/app/courses')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#134E39', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}>
                    <BookOpen size={18} /> <span className="btn-text">ACADEMY STUDIO</span>
                  </button>
                )}
             </div>
             <div className="header-brand academy-header-brand" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="academy-brand-icon" style={{ background: '#134E39', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {headerBrand.icon}
                </div>
                <span className="academy-brand-text" style={{ fontWeight: '900', color: '#134E39', letterSpacing: '-0.02em', fontSize: '1.1rem' }}>{headerBrand.main} <span style={{ color: '#D4AF37' }}>{headerBrand.sub}</span></span>
             </div>
             <div className="header-right academy-header-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 {/* Notification System */}
                 <div className="notification-wrapper">
                   <button className="icon-btn" onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}>
                     <Bell size={18} />
                     {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                   </button>
                   {showNotifications && (
                     <div className="notification-dropdown" style={{ right: 0 }}>
                       <div className="notification-header">
                         <h4>Notifikasi</h4>
                         <div style={{ display: 'flex', gap: '8px' }}>
                           {unreadCount > 0 && <button className="mark-read-btn" onClick={markAllAsRead}>Baca Semua</button>}
                           {notifications.length > 0 && <button className="mark-read-btn" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }} onClick={deleteAllNotifications}>Hapus Semua</button>}
                         </div>
                       </div>
                       <div className="notification-list">
                         {notifications.length > 0 ? notifications.map(notif => (
                           <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                             <div style={{ flex: 1 }}>
                               <div className="notification-text">{notif.text}</div>
                               <div className="notification-time">{notif.time}</div>
                             </div>
                             <button 
                               onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                               style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                             >
                               <X size={14} />
                             </button>
                           </div>
                         )) : (
                           <div className="notification-empty">Tidak ada notifikasi</div>
                         )}
                       </div>
                     </div>
                   )}
                 </div>

                 <div className="profile-menu-wrapper">
                   <button className="profile-card-btn" onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}>
                     <div className="profile-card-avatar"><span>{user?.name.charAt(0).toUpperCase()}</span></div>
                     <div className="profile-card-info">
                       <span className="profile-card-name" style={{ color: '#0f172a' }}>{user?.name}</span>
                       <span className="profile-card-role" style={{ color: '#64748b' }}>{isAdmin ? 'Administrator' : 'Pelajar'}</span>
                     </div>
                     <ChevronDown size={14} className={`profile-chevron ${showProfileMenu ? 'open' : ''}`} />
                   </button>
                   
                   {showProfileMenu && (
                     <div className="profile-dropdown" style={{ right: 0 }}>
                       <div className="profile-dropdown-header">
                         <div className="profile-dropdown-avatar"><span>{user?.name.charAt(0).toUpperCase()}</span></div>
                         <div>
                           <div className="profile-dropdown-name">{user?.name}</div>
                           <div className="profile-dropdown-email">{user?.email}</div>
                         </div>
                       </div>
                       <div className="profile-dropdown-divider" />
                       <div className="profile-dropdown-menu">
                         <button className="profile-dropdown-item" onClick={() => { setShowProfileMenu(false); navigate(isAdmin ? '/app/admin' : '/app/account'); }}>
                           <div className="profile-dropdown-item-icon" style={{ background: 'rgba(44,95,77,0.1)', color: 'var(--primary)' }}><Settings size={15} /></div>
                           <div>
                             <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Pengaturan Profil</div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ubah data akun Anda</div>
                           </div>
                         </button>
                       </div>
                       <div className="profile-dropdown-divider" />
                       <div style={{ padding: '0.5rem' }}>
                         <button className="profile-dropdown-logout" onClick={() => { setShowProfileMenu(false); handleLogout(); }}>
                           <LogOut size={15} />
                           <span>Keluar dari Akun</span>
                         </button>
                       </div>
                     </div>
                   )}
                 </div>
             </div>
          </header>
          <main className="main-content" style={{ height: 'calc(100vh - 80px)', overflowY: 'auto', overflowX: 'hidden', maxWidth: 'none', width: '100%', padding: '0' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
           <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/assets/logo.svg" alt="Mawaddah Logo" style={{ width: '54px', height: '54px', objectFit: 'contain' }} />
            <span style={{ marginLeft: '12px', fontSize: '1.25rem', color: 'white', fontWeight: '800' }}>Mawaddah</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {isAdmin ? (
            <>
              <div style={{ padding: '0.75rem 1.25rem 0.5rem', fontSize: '0.65rem', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Management Portal</div>
              <button className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => navigateTo('home')}>
                <div className="nav-icon-wrapper"><LayoutDashboard size={20}/></div> 
                <span>Statistik Taaruf & User</span>
              </button>

              <button className={`nav-link ${activeTab === 'mediate' ? 'active' : ''}`} onClick={() => navigateTo('mediate')}>
                <div className="nav-icon-wrapper"><Activity size={20}/></div> 
                <span>Mediasi Taaruf</span>
              </button>
              
              <button className={`nav-link ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => navigateTo('feedback')}>
                <div className="nav-icon-wrapper"><MessageSquare size={20}/></div> 
                <span>Saran dan Masukkan</span>
              </button>

            </>
          ) : (
            <>
              <button className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => navigateTo('home')}>
                <div className="nav-icon-wrapper"><LayoutDashboard size={18}/></div> 
                <span>Beranda</span>
              </button>
              <button className={`nav-link ${activeTab === 'find' ? 'active' : ''}`} onClick={() => navigateTo('find')}>
                <div className="nav-icon-wrapper"><Search size={18}/></div> 
                <span>Cari Pasangan</span>
              </button>
              <button className={`nav-link ${activeTab === 'status' ? 'active' : ''}`} onClick={() => navigateTo('status')}>
                <div className="nav-icon-wrapper"><Activity size={18}/></div> 
                <span>Status Taaruf</span>
              </button>
              <button className={`nav-link ${activeTab === 'my_cv' ? 'active' : ''}`} onClick={() => navigateTo('my_cv')}>
                <div className="nav-icon-wrapper"><FileText size={18}/></div> 
                <span>CV Taaruf</span>
              </button>
              <button className={`nav-link ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => navigateTo('feedback')}>
                <div className="nav-icon-wrapper"><MessageSquare size={18}/></div> 
                <span>Saran & Masukan</span>
              </button>
            </>
          )}
        </nav>

        {isAdmin ? (
          <div className="sidebar-academy-promo" style={{ padding: '1rem', marginTop: 'auto' }}>
            <button 
              onClick={() => navigateTo('courses')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                border: 'none',
                borderRadius: '20px',
                padding: '1.25rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 10px 20px rgba(184, 134, 11, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(184, 134, 11, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(184, 134, 11, 0.2)';
              }}
            >
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.25)', 
                padding: '10px', 
                borderRadius: '14px',
                color: '#134E39'
              }}>
                <BookOpen size={24} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#134E39', fontSize: '0.85rem', fontWeight: '900', letterSpacing: '0.02em' }}>ACADEMY STUDIO</div>
                <div style={{ color: 'rgba(19, 78, 57, 0.7)', fontSize: '0.65rem', fontWeight: '700' }}>Manajemen Materi & Kuis</div>
              </div>
            </button>
          </div>
        ) : (
          <div className="sidebar-academy-promo" style={{ padding: '1rem', marginTop: 'auto' }}>
            <button 
              onClick={() => navigateTo('materi')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                border: 'none',
                borderRadius: '20px',
                padding: '1.25rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 10px 20px rgba(184, 134, 11, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(184, 134, 11, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(184, 134, 11, 0.2)';
              }}
            >
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.25)', 
                padding: '10px', 
                borderRadius: '14px',
                color: '#134E39'
              }}>
                <GraduationCap size={24} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#134E39', fontSize: '0.85rem', fontWeight: '900', letterSpacing: '0.02em' }}>AKADEMI MAWADDAH</div>
                <div style={{ color: 'rgba(19, 78, 57, 0.7)', fontSize: '0.65rem', fontWeight: '700' }}>Belajar Ilmu Pranikah</div>
              </div>
            </button>
          </div>
        )}
      </aside>
      
      <div className="main-wrapper">
        {/* Global Profile Completion Alert */}
        {user && !isAdmin && (
          (() => {
            const isAkhwat = user.gender === 'akhwat';
            const isComplete = user.phone_wa && user.domisili_provinsi && user.domisili_kota && 
                               user.pekerjaan && user.pendidikan_terakhir &&
                               (!isAkhwat || (user.wali_name && user.wali_phone));
            const hasCv = cvs.some(c => c.user_id === user.id);
            if (!isComplete && activeTab !== 'account' && !hideBanner) {
              return (
                <div style={{ background: '#fee2e2', borderBottom: '1px solid #fecaca', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', position: 'sticky', top: 0, zIndex: 1100, animation: 'fadeInDown 0.4s ease' }}>
                  <AlertCircle size={16} color="#dc2626" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#991b1b' }}>Biodata Anda belum lengkap! Harap lengkapi di menu Pengaturan Akun.</span>
                  <button onClick={() => navigateTo('account')} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>Lengkapi Sekarang</button>
                  <button onClick={() => { setHideBanner(true); localStorage.setItem('mawaddah_hide_profile_banner', 'true'); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.2rem' }}><X size={16} /></button>
                </div>
              );
            }
            return null;
          })()
        )}

        <header className="top-header">
          <div className="header-left">
            <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="header-brand" style={{ color: '#2C5F4D', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/assets/logo.svg" alt="Mawaddah Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
              <span style={{ fontWeight: '800' }}>Mawaddah</span>
            </div>
          </div>

          <div className="header-right">
            <div className="notification-wrapper">
              <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={18} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Notifikasi</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {unreadCount > 0 && <button className="mark-read-btn" title="Tandai semua sudah dibaca" onClick={markAllAsRead}>Baca Semua</button>}
                      {notifications.length > 0 && <button className="mark-read-btn" title="Hapus semua riwayat" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }} onClick={deleteAllNotifications}>Hapus Semua</button>}
                    </div>
                  </div>
                  <div className="notification-list">
                    {notifications.length > 0 ? notifications.map(notif => (
                      <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div className="notification-text">{notif.text}</div>
                          <div className="notification-time">{notif.time}</div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                          onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )) : (
                      <div className="notification-empty">Tidak ada notifikasi</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-menu-wrapper">
              <button className="profile-card-btn" onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}>
                <div className="profile-card-avatar"><span>{user?.name.charAt(0).toUpperCase()}</span></div>
                <div className="profile-card-info">
                  <span className="profile-card-name">{user?.name}</span>
                  <span className="profile-card-role">{isAdmin ? 'Ustadz / Admin' : 'Pengguna'}</span>
                </div>
                <ChevronDown size={14} className={`profile-chevron ${showProfileMenu ? 'open' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar"><span>{user?.name.charAt(0).toUpperCase()}</span></div>
                    <div>
                      <div className="profile-dropdown-name">{user?.name}</div>
                      <div className="profile-dropdown-email">{user?.email}</div>
                    </div>
                  </div>
                  <div className="profile-dropdown-divider" />
                  <div className="profile-dropdown-menu">
                    <button className="profile-dropdown-item" onClick={() => { setShowProfileMenu(false); navigateTo(isAdmin ? 'admin' : 'account'); }}>
                      <div className="profile-dropdown-item-icon" style={{ background: 'rgba(44,95,77,0.1)', color: 'var(--primary)' }}><Settings size={15} /></div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Pengaturan Profil</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ubah data akun Anda</div>
                      </div>
                    </button>
                  </div>
                  <div className="profile-dropdown-divider" />
                  <div style={{ padding: '0.5rem' }}>
                    <button className="profile-dropdown-logout" onClick={() => { setShowProfileMenu(false); handleLogout(); }}>
                      <LogOut size={15} />
                      <span>Keluar dari Akun</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [cvs, setCvs] = useState([]);
  const [taarufRequests, setTaarufRequests] = useState([]);
  const [usersDb, setUsersDb] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(window.innerWidth > 1024);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [profileNeedsCompletion, setProfileNeedsCompletion] = useState(false);
  const [hideBanner, setHideBanner] = useState(() => {
    return localStorage.getItem('mawaddah_hide_profile_banner') === 'true';
  });
  const [academyLevels, setAcademyLevels] = useState({}); // user_id -> percent
  const [claimedBadges, setClaimedBadges] = useState(() => {
    const saved = localStorage.getItem('mawaddah_claimed_badges');
    return saved ? JSON.parse(saved) : {};
  });

  const getAcademyBadge = (completedCount, userId = null) => {
    // Threshold: Minimal 1 class to show anything
    const count = Number(completedCount) || 0;
    if (count < 1) return null;
    
    // Check if claimed
    if (userId && !claimedBadges[userId]) return null;

    if (count >= 4) return { label: 'Mumtaz (Full Mastery)', icon: <Award size={14} />, color: '#D4AF37' };
    if (count >= 3) return { label: 'Mushlih (Expert)', icon: <Star size={14} fill="#D4AF37" />, color: '#D4AF37' };
    if (count >= 2) return { label: 'Mujtahid (Intermediate)', icon: <Star size={14} fill="#A8A9AD" />, color: '#71717A' };
    return { label: 'Mubtadi (Beginner)', icon: <Star size={14} fill="#cd7f32" />, color: '#cd7f32' };
  };

  const showAlert = (title, message, type = 'info') => {
    setModalState({ isOpen: true, title, message, type });
  };

  const closeModal = () => setModalState({ ...modalState, isOpen: false });

  const fetchSessionUser = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setIsAdmin(false);
      setIsInitializing(false);
      return;
    }

    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
      if (profile) {
        setUser({ ...authUser, ...profile });
        setIsAdmin(profile.role === 'admin');
        setProfileNeedsCompletion(!profile.profile_complete && profile.role !== 'admin');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
    setIsInitializing(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchSessionUser(session?.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchSessionUser(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      let cvQuery = supabase.from('cv_profiles').select('*, user:user_id(is_verified)');
      if (!isAdmin) cvQuery = cvQuery.or(`status.eq.approved,user_id.eq.${user.id}`);
      const { data: cvData } = await cvQuery;
      if (cvData) {
        setCvs(cvData.map(c => ({
          ...c,
          is_verified: c.user?.is_verified || false
        })));
      }

      const { data: notifData } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (notifData) {
        const uniqueNotifs = [];
        const seen = new Set();
        const duplicateIds = [];

        notifData.forEach(n => {
          const key = `${n.content}_${n.is_read}`; // Strict duplicate within same read status
          if (!seen.has(key)) {
            seen.add(key);
            uniqueNotifs.push({ id: n.id, text: n.content, read: n.is_read, time: new Date(n.created_at).toLocaleString() });
          } else {
            duplicateIds.push(n.id);
          }
        });

        // Backend Cleanup: Hapus duplikat nyata dari DB agar tidak menumpuk
        if (duplicateIds.length > 0) {
          supabase.from('notifications').delete().in('id', duplicateIds).then(() => {
            console.log(`Cleaned up ${duplicateIds.length} spam notifications`);
          });
        }

        setNotifications(uniqueNotifs);
      }
      
      const { data: reqData } = await supabase.from('taaruf_requests').select('*, sender:sender_id(email, name, wali_phone), target:target_cv_id(*), target_user:target_user_id(email, name, wali_phone)');
      if (reqData) {
        setTaarufRequests(reqData.map(r => ({
          id: r.id, 
          senderId: r.sender_id,
          senderEmail: r.sender.email, 
          senderAlias: r.sender.name, 
          senderWaliPhone: r.sender.wali_phone,
          targetCvId: r.target_cv_id, 
          targetUserId: r.target_user_id,
          targetAlias: r.target.alias, 
          targetEmail: r.target_user?.email, 
          targetWaliPhone: r.target_user?.wali_phone, 
          status: r.status, 
          updatedAt: r.updated_at
        })));
      }

      const { data: msgData } = await supabase.from('messages').select('*, sender:sender_id(email, name)').order('created_at', { ascending: true });
      if (msgData) {
        const grouped = {};
        msgData.forEach(m => {
          if (!grouped[m.taaruf_request_id]) grouped[m.taaruf_request_id] = [];
          grouped[m.taaruf_request_id].push({ id: m.id, sender: m.sender.email, senderAlias: m.sender.name, text: m.text, timestamp: m.created_at });
        });
        setMessages(Object.keys(grouped).map(reqId => ({ taarufId: reqId, chats: grouped[reqId] })));
      }

      if (isAdmin) {
        const { data: allUsers } = await supabase.from('profiles').select('*').order('name', { ascending: true });
        if (allUsers) setUsersDb(allUsers);
      }

      // Fetch Academy Progress based on Completed CLASSES (aggregating modules)
      const { data: allClasses } = await supabase.from('lms_classes').select('id');
      const { data: allCourses } = await supabase.from('courses').select('id, class_id');
      const { data: allLessons } = await supabase.from('lessons').select('id, course_id');
      const { data: allProgress } = await supabase.from('user_lesson_progress').select('user_id, lesson_id').eq('completed', true);
      
      if (allClasses && allCourses && allLessons && allProgress) {
        // Build map: class_id -> Set of lesson_ids
        const classRequiredLessons = {};
        allCourses.forEach(c => {
          const courseLessons = allLessons.filter(l => l.course_id === c.id);
          if (!classRequiredLessons[c.class_id]) classRequiredLessons[c.class_id] = new Set();
          courseLessons.forEach(l => classRequiredLessons[c.class_id].add(l.id));
        });

        // Build map: user_id -> Map of class_id -> completion_status
        const userDone = {};
        allProgress.forEach(p => {
          if (!userDone[p.user_id]) userDone[p.user_id] = new Set();
          userDone[p.user_id].add(p.lesson_id);
        });

        const levels = {};
        Object.keys(userDone).forEach(uid => {
          let classesCompleted = 0;
          allClasses.forEach(cls => {
            const requiredIds = Array.from(classRequiredLessons[cls.id] || []);
            if (requiredIds.length > 0 && requiredIds.every(lid => userDone[uid].has(lid))) {
              classesCompleted++;
            }
          });
          levels[String(uid)] = classesCompleted;
        });
        setAcademyLevels(levels);
      }
    };
    fetchData();

    const notifSub = supabase.channel('notif-changes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
      setNotifications(prev => {
        const time = new Date(payload.new.created_at).toLocaleString();
        const key = `${payload.new.content}_${time}`;
        // Anti-spam filter using the same key logic
        const exists = prev.some(n => `${n.text}_${n.time}` === key);
        if (exists) return prev;
        return [{ id: payload.new.id, text: payload.new.content, read: payload.new.is_read, time }, ...prev];
      });
    }).subscribe();

    return () => supabase.removeChannel(notifSub);
  }, [user, isAdmin]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const deleteAllNotifications = async () => {
    if (!window.confirm('Hapus semua notifikasi?')) return;
    await supabase.from('notifications').delete().eq('user_id', user.id);
    setNotifications([]);
  };

  const addNotification = async (text, targetUserId) => {
    const finalTargetId = targetUserId || user.id;
    
    // Anti-spam check: Jangan kirim notifikasi yang sama persis dalam 10 menit terakhir
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', finalTargetId)
      .eq('content', text)
      .gt('created_at', tenMinsAgo)
      .limit(1);

    if (existing && existing.length > 0) return;

    await supabase.from('notifications').insert({ user_id: finalTargetId, content: text }).select().single();
  };

  if (isInitializing) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <img src="/assets/logo.svg" alt="Mawaddah" style={{ width: '100px', marginBottom: '2rem', animation: 'pulse 2s infinite' }} />
        <div style={{ background: '#e2e8f0', width: '200px', height: '8px', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #2C5F4D, #4ade80)', width: '60%', borderRadius: '10px', animation: 'loading-bar 1.5s ease-in-out infinite' }} />
        </div>
        <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>MEMUAT...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{ 
        user, setUser, cvs, setCvs, taarufRequests, setTaarufRequests, usersDb, setUsersDb, 
        messages, setMessages, notifications, setNotifications, isAdmin, setIsAdmin, 
        showAlert, addNotification, profileNeedsCompletion, setProfileNeedsCompletion,
        academyLevels, setAcademyLevels, getAcademyBadge, claimedBadges, setClaimedBadges,
        hideBanner, setHideBanner
      }}>
      <BrowserRouter>
        {modalState.isOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className={`modal-header ${modalState.type}`}>
                 {modalState.type === 'error' && <XCircle size={48} />}
                 {modalState.type === 'success' && <CheckCircle size={48} />}
                 {modalState.type === 'info' && <AlertCircle size={48} />}
                 <h3>{modalState.title}</h3>
              </div>
              <div className="modal-body"><p>{modalState.message}</p></div>
              <div className="modal-footer"><button className="btn btn-primary" onClick={closeModal}>Mengerti</button></div>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage initialIsLogin={true} onLogin={(e, p) => supabase.auth.signInWithPassword({ email: e, password: p })} showAlert={showAlert} />} />
          <Route path="/daftar" element={<AuthPage initialIsLogin={false} onRegister={() => {}} showAlert={showAlert} />} />
          
          <Route path="/app" element={
            <PrivateRoute user={user}>
              <DashboardLayout 
                isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}
                handleLogout={handleLogout} unreadCount={unreadCount} notifications={notifications}
                deleteNotification={deleteNotification} markAllAsRead={markAllAsRead} deleteAllNotifications={deleteAllNotifications}
                showNotifications={showNotifications} setShowNotifications={setShowNotifications}
                showProfileMenu={showProfileMenu} setShowProfileMenu={setShowProfileMenu}
                user={user} isAdmin={isAdmin} hideBanner={hideBanner} setHideBanner={setHideBanner} cvs={cvs}
              />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="home" replace />} />
            <Route path=":tab" element={isAdmin ? <AdminDashboard /> : <UserDashboard />} />
            <Route path=":tab/:id" element={isAdmin ? <AdminDashboard /> : <UserDashboard />} />
            <Route path=":tab/:id/:subId" element={isAdmin ? <AdminDashboard /> : <UserDashboard />} />
          </Route>

          <Route path="/complete-profile" element={<PrivateRoute user={user}><CompleteProfilePage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;
