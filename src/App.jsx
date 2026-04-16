import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, Outlet, Link } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CompleteProfilePage from './pages/CompleteProfilePage';
import { Heart, XCircle, CheckCircle, AlertCircle, Search, UserCheck, FileText, User as UserIcon, Activity, Bell, BookOpen, Menu, X, LogOut, LayoutDashboard, ChevronDown, ChevronLeft, Settings, Shield, GraduationCap, Award } from 'lucide-react';
import { supabase } from './supabase';

export const AppContext = createContext();

// --- Private Route Helper ---
const PrivateRoute = ({ children, user }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// --- Dashboard Layout Component ---
const DashboardLayout = ({ isMobileMenuOpen, setIsMobileMenuOpen, handleLogout, unreadCount, notifications, deleteNotification, markAllAsRead, showNotifications, setShowNotifications, showProfileMenu, setShowProfileMenu, user, isAdmin }) => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const activeTab = tab || 'home';

  const navigateTo = (newTab) => {
    navigate(`/app/${newTab}`);
    if (window.innerWidth <= 1024) setIsMobileMenuOpen(false);
  };

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
              <button className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => navigateTo('home')}><LayoutDashboard size={20}/> <span>Beranda Admin</span></button>
              <button className={`nav-link ${activeTab === 'review' ? 'active' : ''}`} onClick={() => navigateTo('review')}><FileText size={20}/> <span>Review CV</span></button>
              <button className={`nav-link ${activeTab === 'mediate' ? 'active' : ''}`} onClick={() => navigateTo('mediate')}><Activity size={20}/> <span>Mediasi Taaruf</span></button>
              <button className={`nav-link ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => navigateTo('courses')}><GraduationCap size={20}/> <span>Kelola Kursus</span></button>
            </>
          ) : (
            <>
              <button className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => navigateTo('home')}><LayoutDashboard size={18}/> <span>Beranda</span></button>
              <button className={`nav-link ${activeTab === 'materi' ? 'active' : ''}`} onClick={() => navigateTo('materi')}><BookOpen size={18}/> <span>Materi Belajar</span></button>
              <button className={`nav-link ${activeTab === 'find' ? 'active' : ''}`} onClick={() => navigateTo('find')}><Search size={18}/> <span>Cari Pasangan</span></button>
              <button className={`nav-link ${activeTab === 'status' ? 'active' : ''}`} onClick={() => navigateTo('status')}><Activity size={18}/> <span>Status Taaruf</span></button>
              <button className={`nav-link ${activeTab === 'my_cv' ? 'active' : ''}`} onClick={() => navigateTo('my_cv')}><FileText size={18}/> <span>CV Taaruf</span></button>
            </>
          )}
        </nav>
      </aside>

      <div className="main-wrapper">
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
                    {unreadCount > 0 && <button className="mark-read-btn" onClick={markAllAsRead}>Tandai dibaca</button>}
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
                    <button className="profile-dropdown-item" onClick={() => { setShowProfileMenu(false); navigateTo('account'); }}>
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [profileNeedsCompletion, setProfileNeedsCompletion] = useState(false);

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
      let cvQuery = supabase.from('cv_profiles').select('*');
      if (!isAdmin) cvQuery = cvQuery.or(`status.eq.approved,user_id.eq.${user.id}`);
      const { data: cvData } = await cvQuery;
      if (cvData) setCvs(cvData);

      const { data: notifData } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (notifData) {
        setNotifications(notifData.map(n => ({ id: n.id, text: n.content, read: n.is_read, time: new Date(n.created_at).toLocaleString() })));
      }
      
      const { data: reqData } = await supabase.from('taaruf_requests').select('*, sender:sender_id(email, name, wali_phone), target:target_cv_id(*), target_user:target_user_id(email, name, wali_phone)');
      if (reqData) {
        setTaarufRequests(reqData.map(r => ({
          id: r.id, senderEmail: r.sender.email, senderAlias: r.sender.name, senderWaliPhone: r.sender.wali_phone,
          targetCvId: r.target_cv_id, targetAlias: r.target.alias, targetEmail: r.target_user?.email, 
          targetWaliPhone: r.target_user?.wali_phone, status: r.status, updatedAt: r.updated_at
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
    };
    fetchData();

    const notifSub = supabase.channel('notif-changes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
      setNotifications(prev => [{ id: payload.new.id, text: payload.new.content, read: payload.new.is_read, time: new Date(payload.new.created_at).toLocaleString() }, ...prev]);
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

  const addNotification = async (text, targetUserId = user.id) => {
    const { data } = await supabase.from('notifications').insert({ user_id: targetUserId, content: text }).select().single();
    if (data && targetUserId === user.id) {
      setNotifications(prev => [{ id: data.id, text: data.content, read: false, time: new Date().toLocaleString() }, ...prev]);
    }
  };

  if (isInitializing) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <img src="/assets/logo.svg" alt="Mawaddah" style={{ width: '100px', marginBottom: '2rem', animation: 'pulse 2s infinite' }} />
        <div style={{ background: '#e2e8f0', width: '200px', height: '8px', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #2C5F4D, #4ade80)', width: '60%', borderRadius: '10px', animation: 'loading-bar 1.5s ease-in-out infinite' }} />
        </div>
        <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>MEMUAT KEBERKAHAN...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{ user, cvs, setCvs, taarufRequests, setTaarufRequests, usersDb, setUsersDb, messages, setMessages, showAlert, addNotification, handleLogout }}>
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
                deleteNotification={deleteNotification} markAllAsRead={markAllAsRead}
                showNotifications={showNotifications} setShowNotifications={setShowNotifications}
                showProfileMenu={showProfileMenu} setShowProfileMenu={setShowProfileMenu}
                user={user} isAdmin={isAdmin}
              />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="home" replace />} />
            <Route path=":tab" element={isAdmin ? <AdminDashboard /> : <UserDashboard />} />
          </Route>

          <Route path="/complete-profile" element={<PrivateRoute user={user}><CompleteProfilePage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;
