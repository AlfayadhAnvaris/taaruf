import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, Outlet, Link, useLocation } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManageUsersPage from './pages/ManageUsersPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import { 
  Heart, XCircle, CheckCircle, AlertCircle, Search, UserCheck, 
  FileText, User as UserIcon, Activity, Bell, BookOpen, Menu, X, 
  LogOut, LayoutDashboard, ChevronDown, ChevronLeft, Settings, 
  Shield, ShieldCheck, GraduationCap, Award, Star, MessageSquare, Trash2, Quote 
} from 'lucide-react';
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
          Maaf, Anda tidak memiliki izin untuk mengakses fitur ini. Halaman ini hanya tersedia untuk Administrator Separuh Agama.
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
  const location = useLocation();
  const { tab, id } = useParams();
  const activeTab = location.pathname.split('/')[2] || 'home';

  const adminOnlyTabs = ['mediate', 'courses', 'feedback_admin', 'admin', 'users'];
  if (adminOnlyTabs.includes(tab) && !isAdmin) {
    return <AccessDenied />;
  }

  const navigateTo = (newTab) => {
    navigate(`/app/${newTab}`);
    if (window.innerWidth <= 1024) setIsMobileMenuOpen(false);
  };

  const isAcademyMode = (activeTab === 'materi' || activeTab === 'certificate') && !isAdmin;
  const isAdminAcademy = activeTab === 'courses' && isAdmin;
  const isHome = activeTab === 'home' || !activeTab;

  // Global Profile Completion Alert logic
  const renderAlertBanner = () => {
    if (!user || isAdmin) return null;
    const isComplete = user.profile_complete;
    if (!isComplete && (!hideBanner || isHome)) {
      return (
        <div style={{ background: '#fee2e2', borderBottom: '1px solid #fecaca', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', position: 'sticky', top: 0, zIndex: 1100, animation: 'fadeInDown 0.4s ease' }}>
          <AlertCircle size={16} color="#dc2626" />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#991b1b' }}>Biodata Anda belum lengkap! Harap lengkapi di menu Pengaturan Akun.</span>
          <button onClick={() => navigateTo('account')} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>Lengkapi Sekarang</button>
          <button onClick={() => { setHideBanner(true); localStorage.setItem('separuh_hide_profile_banner', 'true'); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.2rem' }}><X size={16} /></button>
        </div>
      );
    }
    return null;
  };

  if (isAcademyMode || isAdminAcademy) {
    const getHeaderTitle = () => {
      if (isAdminAcademy) return { main: 'SEPARUH AGAMA', sub: 'STUDIO', icon: <BookOpen size={20} color="white" /> };
      return { main: 'SEPARUH AGAMA', sub: 'ALAMAD ACADEMY', icon: <GraduationCap size={20} color="white" /> };
    };
    const headerBrand = getHeaderTitle();

    return (
      <div className="app-container academy-fullscreen">
        <div className="main-wrapper" style={{ marginLeft: 0, width: '100%' }}>
          {renderAlertBanner()}
          <header className="top-header academy-top-header" style={{ left: 0, width: '100%', borderBottom: '1px solid #e2e8f0', background: 'white', zIndex: 1000 }}>
             <div className="header-left academy-header-left academy-nav-btns" style={{ display: 'flex', gap: '8px' }}>
                <button title="Portal Utama" onClick={() => navigate('/app/home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(19,78,57,0.05)', color: '#134E39', border: '1px solid rgba(19,78,57,0.1)', padding: '0.6rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <LayoutDashboard size={18} /> <span className="btn-text">{isAdmin ? 'MANAGEMENT PORTAL' : 'PORTAL UTAMA'}</span>
                </button>
                {!isAdmin ? (
                  <>
                    <button key="btn-catalog" title="Katalog" onClick={() => navigate('/app/materi/catalog')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: id === 'catalog' ? '#134E39' : 'transparent', color: id === 'catalog' ? 'white' : '#64748b', border: 'none', padding: '0.6rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <BookOpen size={18} /> <span className="btn-text">KATALOG</span>
                    </button>
                    <button key="btn-progress" title="Progress Saya" onClick={() => navigate('/app/materi/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: id === 'dashboard' ? '#134E39' : 'transparent', color: id === 'dashboard' ? 'white' : '#64748b', border: 'none', padding: '0.6rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}>
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
                  <div className="profile-menu-wrapper">
                    <button className="profile-card-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                      <div className="profile-card-avatar"><span>{user?.name.charAt(0).toUpperCase()}</span></div>
                      <ChevronDown size={14} className={`profile-chevron hide-on-mobile ${showProfileMenu ? 'open' : ''}`} />
                    </button>
                    {showProfileMenu && (
                      <div className="profile-dropdown" style={{ right: 0 }}>
                        <div className="profile-dropdown-header">
                            <div>
                              <div className="profile-dropdown-name">{user?.name}</div>
                              <div className="profile-dropdown-email">{user?.email}</div>
                            </div>
                        </div>
                        <div className="profile-dropdown-menu">
                          <button className="profile-dropdown-item" onClick={() => { setShowProfileMenu(false); navigate(isAdmin ? '/app/admin' : '/app/account'); }}>
                            <Settings size={15} /> <span>Pengaturan</span>
                          </button>
                          <button className="profile-dropdown-logout" onClick={handleLogout}>
                            <LogOut size={15} /> <span>Keluar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
             </div>
          </header>
          <main className="main-content" style={{ height: 'calc(100vh - 80px)', overflowY: 'auto', padding: 0 }}>
             <style>{`
               .academy-fullscreen .main-content::-webkit-scrollbar,
               .academy-fullscreen .main-content *::-webkit-scrollbar {
                 display: none !important;
               }
               .academy-fullscreen .main-content,
               .academy-fullscreen .main-content * {
                 -ms-overflow-style: none !important;
                 scrollbar-width: none !important;
               }
             `}</style>
             <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ 
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', 
            backdropFilter: 'blur(4px)', zIndex: 2900, animation: 'fadeIn 0.3s' 
          }}
        ></div>
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{ 
        background: 'linear-gradient(180deg, #134E39 0%, #1a5d46 100%)', 
        color: 'white', display: 'flex', flexDirection: 'column' 
      }}>
        <div className="sidebar-header" style={{ padding: '2rem 1.5rem' }}>
           <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/assets/logo.svg" alt="Logo" style={{ width: 32, height: 32 }} />
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.03em' }}>Separuh Agama</span>
          </div>
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
              <SidebarLink icon={<Activity size={20}/>} label="Mediasi Taaruf" active={activeTab === 'mediate'} onClick={() => navigateTo('mediate')} />
              <SidebarLink icon={<UserCheck size={20}/>} label="Manajemen User" active={activeTab === 'users'} onClick={() => navigateTo('users')} />
              <SidebarLink icon={<ShieldCheck size={20}/>} label="Verifikasi Identitas" active={activeTab === 'verification'} onClick={() => navigateTo('verification')} />
              <SidebarLink icon={<Quote size={20}/>} label="Testimoni" active={activeTab === 'testimonials'} onClick={() => navigateTo('testimonials')} />
            </>
          )}
          <SidebarLink icon={<MessageSquare size={20}/>} label="Saran & Masukan" active={activeTab === 'feedback'} onClick={() => navigateTo('feedback')} />
        </nav>

        <div style={{ padding: '1.5rem', marginTop: 'auto' }}>
          <button 
            onClick={() => navigateTo(isAdmin ? 'courses' : 'materi')} 
            className="academy-promo-btn"
            style={{ 
              width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '20px', padding: '1.25rem', color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s'
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}>
               <GraduationCap size={22} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '900' }}>{isAdmin ? 'STUDIO' : 'SEPARUH AGAMA ACADEMY'}</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: '600' }}>Ilmu Pernikahan</div>
            </div>
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        {renderAlertBanner()}
        <header className="top-header" style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9' }}>
          <div className="header-left">
            <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: '#f8fafc', width: 42, height: 42, borderRadius: '12px' }}>
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          <div className="header-right">
             <div className="notification-wrapper">
               <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)} style={{ background: 'white', borderRadius: '12px', position: 'relative' }}>
                 <Bell size={20} />
                 {unreadCount > 0 && <span className="notification-badge" style={{ border: '2px solid white' }}>{unreadCount}</span>}
               </button>

               {showNotifications && (
                 <div className="notification-dropdown">
                    <div className="notif-header">
                       <h3>Notifikasi</h3>
                       <div className="notif-actions">
                          {unreadCount > 0 && <button onClick={markAllAsRead}>Tandai Semua Dibaca</button>}
                          <button onClick={deleteAllNotifications} className="danger">Hapus Semua</button>
                       </div>
                    </div>
                    <div className="notif-list">
                       {notifications.length === 0 ? (
                         <div className="notif-empty">
                            <Bell size={32} opacity={0.2} />
                            <p>Belum ada notifikasi baru</p>
                         </div>
                       ) : (
                         notifications.map(n => (
                           <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                              <div className="notif-icon">
                                 {n.text.toLowerCase().includes('selamat') ? <CheckCircle size={18} color="#10B981" /> : <Bell size={18} color="#64748b" />}
                              </div>
                              <div className="notif-content">
                                 <p className="notif-text">{n.text}</p>
                                 <span className="notif-time">{n.time}</span>
                              </div>
                              <div className="notif-item-actions">
                                   {!n.read && (
                                     <button onClick={async (e) => {
                                       e.stopPropagation();
                                       await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
                                       setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                                     }} title="Tandai Dibaca"><CheckCircle size={14} /></button>
                                   )}
                                   <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id, n.text); }} className="notif-delete-btn" title="Hapus"><X size={14} /></button>
                              </div>
                           </div>
                         ))
                       )}
                    </div>
                 </div>
               )}
             </div>
             
             <div className="profile-menu-wrapper">
               <button className="profile-card-btn" onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '6px 12px' }}>
                 <div className="profile-card-avatar" style={{ background: '#134E39', color: 'white' }}><span>{user?.name.charAt(0).toUpperCase()}</span></div>
                 <div className="profile-card-info">
                   <span className="profile-card-name" style={{ fontWeight: '800' }}>{user?.name}</span>
                   <span className="profile-card-role" style={{ color: '#94a3b8' }}>{isAdmin ? 'Administrator' : 'Calon Kandidat'}</span>
                 </div>
                 <ChevronDown size={14} color="#94a3b8" />
               </button>
               {showProfileMenu && (
                 <div className="profile-dropdown" style={{ borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', top: '75px' }}>
                    <div style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#134E39' }}>{user?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user?.email}</div>
                    </div>
                    <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button className="dropdown-action-btn" onClick={() => { setShowProfileMenu(false); navigateTo(isAdmin ? 'admin' : 'account'); }}>
                        <Settings size={16} /> <span>Akun & Keamanan</span>
                      </button>
                      <button className="dropdown-action-btn logout" onClick={() => { setShowProfileMenu(false); handleLogout(); }}>
                        <LogOut size={16} /> <span>Keluar Sistem</span>
                      </button>
                    </div>
                 </div>
               )}
             </div>
          </div>
        </header>

        <main className="main-content" style={{ padding: '2rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const SidebarLink = ({ icon, label, active, onClick }) => (
  <button 
    className={`nav-link ${active ? 'active' : ''}`} 
    onClick={onClick}
    style={{
      padding: '0.85rem 1.25rem', borderRadius: '14px', border: 'none',
      display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
      cursor: 'pointer', transition: 'all 0.2s',
      background: active ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
      color: active ? '#D4AF37' : 'rgba(255,255,255,0.7)',
      fontWeight: active ? '800' : '600'
    }}
  >
    <div style={{ color: active ? '#D4AF37' : 'rgba(255,255,255,0.5)' }}>{icon}</div>
    <span>{label}</span>
  </button>
);

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
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [profileNeedsCompletion, setProfileNeedsCompletion] = useState(false);
  const [hideBanner, setHideBanner] = useState(() => {
    return localStorage.getItem('separuh_hide_profile_banner') === 'true';
  });
  const [academyLevels, setAcademyLevels] = useState({});
  const [claimedBadges, setClaimedBadges] = useState(() => {
    const saved = localStorage.getItem('Separuh Agama_claimed_badges');
    return saved ? JSON.parse(saved) : {};
  });

  const getAcademyBadge = (completedCount, userId = null) => {
    const count = Number(completedCount) || 0;
    if (count < 1) return null;
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

  const unreadCount = notifications.filter(n => !n.read).length;

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
      // 1. Fetch CVs
      let cvQuery = supabase.from('cv_profiles').select('*, user:user_id(is_verified)');
      if (!isAdmin) cvQuery = cvQuery.or(`status.eq.approved,user_id.eq.${user.id}`);
      const { data: cvData } = await cvQuery;
      if (cvData) {
        setCvs(cvData.map(c => ({ ...c, is_verified: c.user?.is_verified || false })));
      }

      // 2. Fetch Notifications with Soft Delete Filtering
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (notifData) {
        const unique = [];
        const seen = new Set();
        notifData.forEach(n => {
          const key = `${n.content.trim()}_${new Date(n.created_at).toISOString().slice(0, 13)}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push({ id: n.id, text: n.content, read: n.is_read, time: new Date(n.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', year: 'numeric' }) });
          }
        });
        setNotifications(unique);
      }

      // 3. Fetch Taaruf Requests
      const { data: reqData } = await supabase.from('taaruf_requests').select('*, sender:sender_id(email, name, wali_phone), target:target_cv_id(*), target_user:target_user_id(email, name, wali_phone)');
      if (reqData) {
        setTaarufRequests(reqData.map(r => ({
          id: r.id, senderId: r.sender_id, senderEmail: r.sender.email, senderAlias: r.sender.name, senderWaliPhone: r.sender.wali_phone,
          targetCvId: r.target_cv_id, targetUserId: r.target_user_id, targetAlias: r.target.alias, targetEmail: r.target_user?.email, targetWaliPhone: r.target_user?.wali_phone, status: r.status, updatedAt: r.updated_at
        })));
      }
      
      // 4. Fetch Messages
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
      
      // 5. Academy Levels Calculation (Module-based)
      const { data: allCourses } = await supabase.from('courses').select('id');
      const { data: allLessons } = await supabase.from('lessons').select('id, course_id');
      const { data: allProgress } = await supabase.from('user_lesson_progress').select('user_id, lesson_id').eq('completed', true);

      if (allCourses && allLessons && allProgress) {
        const courseRequiredLessons = {};
        allLessons.forEach(l => {
          if (!courseRequiredLessons[l.course_id]) courseRequiredLessons[l.course_id] = new Set();
          courseRequiredLessons[l.course_id].add(l.id);
        });

        const userDone = {};
        allProgress.forEach(p => {
          if (!userDone[p.user_id]) userDone[p.user_id] = new Set();
          userDone[p.user_id].add(p.lesson_id);
        });

        const levels = {};
        Object.keys(userDone).forEach(uid => {
          let coursesCompleted = 0;
          allCourses.forEach(course => {
            const requiredIds = Array.from(courseRequiredLessons[course.id] || []);
            // Modul dianggap selesai jika user sudah mengerjakan semua pelajaran di dalamnya
            if (requiredIds.length > 0 && requiredIds.every(lid => userDone[uid].has(lid))) {
              coursesCompleted++;
            }
          });
          levels[String(uid)] = coursesCompleted;
        });
        setAcademyLevels(levels);
      }
    };
    fetchData();

    // Real-time Subscriptions
    const notifSub = supabase.channel('notif-changes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
      setNotifications(prev => {
        const text = payload.new.content;
        const time = new Date(payload.new.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', year: 'numeric' });
        const isDuplicate = prev.some(n => n.text === text && (n.time === time || Math.abs(new Date(n.time).getTime() - new Date(payload.new.created_at).getTime()) < 60000));
        if (isDuplicate) return prev;
        return [{ id: payload.new.id, text, read: payload.new.is_read, time }, ...prev];
      });
    }).subscribe();

    const requestSub = supabase.channel('request-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'taaruf_requests' }, () => {
      fetchData();
    }).subscribe();

    const messageSub = supabase.channel('message-changes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
      fetchData();
    }).subscribe();

    return () => {
      supabase.removeChannel(notifSub);
      supabase.removeChannel(requestSub);
      supabase.removeChannel(messageSub);
    };
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
    // DB Soft Delete
    await supabase.from('notifications').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const deleteAllNotifications = () => {
    setConfirmState({
      isOpen: true,
      title: 'Bersihkan Semua Notifikasi?',
      message: 'Ini akan menyembunyikan seluruh riwayat notifikasi dari pandangan Anda secara permanen.',
      onConfirm: async () => {
        await supabase.from('notifications').update({ deleted_at: new Date().toISOString() }).eq('user_id', user.id);
        setNotifications([]);
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const addNotification = async (text, targetUserId) => {
    const finalTargetId = targetUserId || user.id;
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
        <img src="/assets/logo.svg" alt="Separuh Agama" style={{ width: '100px', marginBottom: '2rem', animation: 'pulse 2s infinite' }} />
        <div style={{ background: '#e2e8f0', width: '200px', height: '8px', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #2C5F4D, #4ade80)', width: '60%', borderRadius: '10px', animation: 'loading-bar 1.5s ease-in-out infinite' }} />
        </div>
        <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>MEMUAT...</p>
      </div>
    );
  }


  return (
    <AppContext.Provider value={{ 
        user, setUser, cvs, setCvs, taarufRequests, setTaarufRequests, usersDb, setUsersDb, 
        messages, setMessages, notifications, setNotifications, isAdmin, setIsAdmin, 
        showAlert, addNotification, profileNeedsCompletion, setProfileNeedsCompletion,
        academyLevels, setAcademyLevels, getAcademyBadge, claimedBadges, setClaimedBadges,
        hideBanner, setHideBanner, setConfirmState
      }}>
      <BrowserRouter>
        {modalState.isOpen && (
          <div className="modal-overlay" onClick={closeModal} style={{ animation: 'none' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ animation: 'none' }}>
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
        {confirmState.isOpen && (
          <div className="modal-overlay" style={{ zIndex: 10001, animation: 'none' }} onClick={() => setConfirmState({...confirmState, isOpen: false})}>
            <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem', animation: 'none' }} onClick={e => e.stopPropagation()}>
               <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                 <Trash2 size={30} />
               </div>
               <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>{confirmState.title}</h3>
               <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '2rem' }}>{confirmState.message}</p>
               <div style={{ display: 'flex', gap: '1rem' }}>
                 <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setConfirmState({...confirmState, isOpen: false})}>Batal</button>
                 <button className="btn btn-danger" style={{ flex: 1, background: '#ef4444', color: 'white' }} onClick={confirmState.onConfirm}>Hapus</button>
               </div>
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
            <Route path="users" element={isAdmin ? <ManageUsersPage /> : <UserDashboard />} />
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
