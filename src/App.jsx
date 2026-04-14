import React, { createContext, useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Heart, XCircle, CheckCircle, AlertCircle, Search, UserCheck, FileText, User as UserIcon, Activity, Bell, BookOpen, Menu, X, LogOut, LayoutDashboard, ChevronDown, Settings, Shield } from 'lucide-react';
import { supabase } from './supabase';

export const AppContext = createContext();

function App() {
  const [user, setUser] = useState(null); // { username: '', role: 'admin' | 'user', name: '' }
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Real Database States
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [usersDb, setUsersDb] = useState([]); // Removed dummy
  const [cvs, setCvs] = useState([]);
  const [taarufRequests, setTaarufRequests] = useState([]);
  const [messages, setMessages] = useState([]);

  // Session Restoration
  useEffect(() => {
    const fetchSessionUser = async (sessionUser) => {
      if (!sessionUser) {
        setUser(null);
        setIsInitializing(false);
        return;
      }
      try {
        // Use upsert to handle: new user, existing user, or RLS-blocked SELECT
        const profilePayload = {
           id: sessionUser.id,
           name: sessionUser.user_metadata?.name || sessionUser.email.split('@')[0],
           email: sessionUser.email,
           role: 'user',
           gender: sessionUser.user_metadata?.gender || null,
           wali_phone: sessionUser.user_metadata?.wali_phone || ''
        };
        const { data: upsertedProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'id', ignoreDuplicates: false })
          .select()
          .single();

        let profile = upsertedProfile;
        if (upsertError || !profile) {
          // Upsert failed – try plain SELECT (row might already exist but upsert was blocked)
          const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).single();
          profile = existingProfile;
        }

        if (profile) {
          profile.waliPhone = profile.wali_phone || profile.waliPhone; // mapping untuk UI
          setUser(profile);
          // Set initial tab based on role if they are logging in via session
          setActiveTab(profile.role === 'admin' ? 'review' : 'home');
          setShowLanding(false);
        } else {
          // Profile tidak dapat diambil/dibuat, logout paksa untuk mencegah bug blank
          console.error('Gagal buat/ambil profil dari DB, memaksa logout.');
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.error('Error fetching profile from session:', err);
      }
      setIsInitializing(false);
    };

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchSessionUser(session?.user);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchSessionUser(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data on login
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      // 1. Fetch CVs
      let cvQuery = supabase.from('cv_profiles').select('*');
      if (user.role !== 'admin') {
        cvQuery = cvQuery.or(`status.eq.approved,user_id.eq.${user.id}`);
      }
      const { data: cvData } = await cvQuery;
      if (cvData) setCvs(cvData);

      // 2. Fetch Notifications specific to user
      const { data: notifData } = await supabase.from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (notifData) {
        setNotifications(notifData.map(n => ({ id: n.id, text: n.content, read: n.is_read, time: new Date(n.created_at).toLocaleString() })));
      }
      
      // 3. Fetch Taaruf Requests
      const { data: reqData } = await supabase.from('taaruf_requests')
        .select('*, sender:sender_id(email, name), target:target_cv_id(*), target_user:target_user_id(email, name)');
      
      if (reqData) {
        const mappedReqs = reqData.map(r => ({
          id: r.id,
          senderEmail: r.sender.email,
          senderAlias: r.sender.name, // Will be CV alias if we joined CV for sender, but name is fine for now
          targetCvId: r.target_cv_id,
          targetAlias: r.target.alias,
          targetEmail: r.target_user?.email, // for frontend matching
          status: r.status,
          updatedAt: r.updated_at
        }));
        setTaarufRequests(mappedReqs);
      }

      // 4. Fetch Messages
      const { data: msgData } = await supabase.from('messages')
        .select('*, sender:sender_id(email, name)')
        .order('created_at', { ascending: true });
        
      if (msgData) {
        // Group by request ID to match legacy state format
        const grouped = {};
        msgData.forEach(m => {
          if (!grouped[m.taaruf_request_id]) grouped[m.taaruf_request_id] = [];
          grouped[m.taaruf_request_id].push({
            id: m.id,
            sender: m.sender.email,
            senderAlias: m.sender.name,
            text: m.text,
            timestamp: m.created_at
          });
        });
        setMessages(Object.keys(grouped).map(reqId => ({
          taarufId: reqId,
          chats: grouped[reqId]
        })));
      }
    };
    
    fetchData();

    // Setup Realtime Subscription
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'taaruf_requests' },
        (payload) => {
          console.log('Realtime taaruf_requests!', payload);
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('Realtime messages!', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    if (user) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    }
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const addNotification = async (text, targetUserId = null) => {
    const notifUserId = targetUserId || (user ? user.id : null);
    if (notifUserId) {
      await supabase.from('notifications').insert({ user_id: notifUserId, content: text });
      // Fetch ulang notif
      if (notifUserId === user?.id) {
         setNotifications(prev => [{ id: Date.now(), text, read: false, time: 'Baru saja' }, ...prev]);
      }
    }
  };

  const showAlert = (title, message, type = 'info') => {
    setModalState({ isOpen: true, title, message, type });
  };
  
  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  const handleLogin = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        let errorMsg = 'Email/No HP atau password salah!';
        if (error.message.toLowerCase().includes('email not confirmed')) {
           errorMsg = 'Email belum dikonfirmasi. Mohon cek inbox email Anda atau matikan pengaturan "Confirm Email" di Supabase Dashboard.';
        } else {
           errorMsg = error.message;
        }
        showAlert('Gagal Masuk', errorMsg, 'error');
        return;
      }

      if (data?.user) {
        // Ambil profil dari tabel 'profiles'
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (!profile) {
          // Jika tidak ada trigger Supabase, buat profil via upsert (handles RLS + race conditions)
          const newProfileDb = {
             id: data.user.id,
             name: data.user.user_metadata?.name || email.split('@')[0],
             email: data.user.email,
             role: 'user', // default role
             gender: data.user.user_metadata?.gender || null,
             wali_phone: data.user.user_metadata?.wali_phone || ''
          };
          const { data: upsertedProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert(newProfileDb, { onConflict: 'id', ignoreDuplicates: false })
            .select()
            .single();
          if (upsertedProfile) {
             profile = upsertedProfile;
          } else {
             console.error("Gagal buat/upsert profil di database:", upsertError);
             showAlert(
               'Profil Gagal Dibuat',
               'Akun Anda berhasil login, namun profil tidak dapat disimpan ke database. ' +
               'Pastikan RLS (Row Level Security) mengizinkan INSERT pada tabel "profiles". ' +
               'Detail: ' + (upsertError?.message || 'Unknown error'),
               'error'
             );
             await supabase.auth.signOut();
             return;
          }
        }
          
        if (profile) {
          profile.waliPhone = profile.wali_phone || profile.waliPhone; // mapping untuk UI
          setUser(profile);
          setActiveTab(profile.role === 'admin' ? 'review' : 'home');
        } else {
          showAlert('Penting', 'Gagal memuat profil dari database.', 'error');
          await supabase.auth.signOut();
        }
      }
    } catch (err) {
      console.error(err);
      showAlert('Error', 'Gagal menghubungkan ke Supabase. Pastikan .env sudah benar.', 'error');
    }
  };

  const handleRegister = async (email, password, name, waliPhone, gender) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            wali_phone: waliPhone,
            gender: gender
          }
        }
      });
      
      if (error) {
        showAlert('Gagal Mendaftar', error.message, 'error');
        return;
      }
      
      showAlert('Berhasil', `Berhasil mendaftar! Silakan login.`, 'success');
    } catch (err) {
      showAlert('Error', 'Sistem gagal mendaftar.', 'error');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowLanding(true);
    setActiveTab('home');
  };

  if (isInitializing) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--primary)' }}>
        <Heart size={48} style={{ animation: 'float 2s ease-in-out infinite', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Mawaddah Match</h2>
        <p style={{ color: 'var(--text-muted)' }}>Memuat sesi Anda...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ user, cvs, setCvs, taarufRequests, setTaarufRequests, usersDb, messages, setMessages, showAlert, addNotification }}>
      {modalState.isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className={`modal-header ${modalState.type}`}>
               {modalState.type === 'error' && <XCircle size={48} />}
               {modalState.type === 'success' && <CheckCircle size={48} />}
               {modalState.type === 'info' && <AlertCircle size={48} />}
               <h3>{modalState.title}</h3>
            </div>
            <div className="modal-body">
              <p>{modalState.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={closeModal}>Mengerti</button>
            </div>
          </div>
        </div>
      )}

      {!user ? (
        showLanding ? (
          <LandingPage onEnter={() => setShowLanding(false)} />
        ) : (
          <AuthPage onLogin={handleLogin} onRegister={handleRegister} showAlert={showAlert} />
        )
      ) : (
        <div className="app-container">
          {/* Mobile overlay */}
          {isMobileMenuOpen && <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}

          {/* Sidebar */}
          <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <div className="sidebar-brand">
                <Heart size={28} />
                <span>Mawaddah Match</span>
              </div>

            </div>
            
            <nav className="sidebar-nav">
              {user.role === 'admin' ? (
                <>
                  <button className={`nav-link ${activeTab === 'review' ? 'active' : ''}`} onClick={() => { setActiveTab('review'); setIsMobileMenuOpen(false); }}><FileText size={20}/> <span>Review CV</span></button>
                  <button className={`nav-link ${activeTab === 'mediate' ? 'active' : ''}`} onClick={() => { setActiveTab('mediate'); setIsMobileMenuOpen(false); }}><Activity size={20}/> <span>Mediasi Taaruf</span></button>
                </>
              ) : (
                <>
                  <button className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { setActiveTab('home'); setIsMobileMenuOpen(false); }}><LayoutDashboard size={20}/> <span>Beranda</span></button>
                  <button className={`nav-link ${activeTab === 'find' ? 'active' : ''}`} onClick={() => { setActiveTab('find'); setIsMobileMenuOpen(false); }}><Search size={20}/> <span>Cari Pasangan</span></button>
                  <button className={`nav-link ${activeTab === 'status' ? 'active' : ''}`} onClick={() => { setActiveTab('status'); setIsMobileMenuOpen(false); }}><UserCheck size={20}/> <span>Status Taaruf</span></button>
                  <button className={`nav-link ${activeTab === 'my_cv' ? 'active' : ''}`} onClick={() => { setActiveTab('my_cv'); setIsMobileMenuOpen(false); }}><FileText size={20}/> <span>CV Saya</span></button>
                  <button className={`nav-link ${activeTab === 'materi' ? 'active' : ''}`} onClick={() => { setActiveTab('materi'); setIsMobileMenuOpen(false); }}><BookOpen size={20}/> <span>Pembelajaran</span></button>
                </>
              )}
            </nav>
          </aside>

          {/* Main area: header + content */}
          <div className="main-wrapper">

            {/* Top Header Bar */}
            <header className="top-header">
              <div className="header-left">
                <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                  {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
                <div className="header-brand">
                  <Heart size={18} />
                  <span>Mawaddah Match</span>
                </div>
              </div>

              <div className="header-right">
                {/* Notification */}
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
                          <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                            <div className="notification-text">{notif.text}</div>
                            <div className="notification-time">{notif.time}</div>
                          </div>
                        )) : (
                          <div className="notification-empty">Tidak ada notifikasi</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Card Dropdown */}
                <div className="profile-menu-wrapper">
                  <button
                    className="profile-card-btn"
                    onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                  >
                    <div className="profile-card-avatar">
                      <span>{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="profile-card-info">
                      <span className="profile-card-name">{user.name}</span>
                      <span className="profile-card-role">{user.role === 'admin' ? 'Ustadz / Admin' : 'Pengguna'}</span>
                    </div>
                    <ChevronDown size={14} className={`profile-chevron ${showProfileMenu ? 'open' : ''}`} />
                  </button>

                  {showProfileMenu && (
                    <div className="profile-dropdown">
                      {/* Profile Header */}
                      <div className="profile-dropdown-header">
                        <div className="profile-dropdown-avatar">
                          <span>{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="profile-dropdown-name">{user.name}</div>
                          <div className="profile-dropdown-email">{user.email}</div>
                        </div>
                      </div>

                      <div className="profile-dropdown-divider" />

                      {/* Menu Items */}
                      <div className="profile-dropdown-menu">
                        <button
                          className="profile-dropdown-item"
                          onClick={() => {
                            setShowProfileMenu(false);
                            if (user.role !== 'admin') setActiveTab('account');
                          }}
                        >
                          <div className="profile-dropdown-item-icon" style={{ background: 'rgba(44,95,77,0.1)', color: 'var(--primary)' }}>
                            <Settings size={15} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Pengaturan Profil</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ubah data akun Anda</div>
                          </div>
                        </button>

                        <button
                          className="profile-dropdown-item"
                          onClick={() => {
                            setShowProfileMenu(false);
                            if (user.role !== 'admin') setActiveTab('account');
                          }}
                        >
                          <div className="profile-dropdown-item-icon" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--secondary)' }}>
                            <Shield size={15} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Keamanan Akun</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Password & verifikasi</div>
                          </div>
                        </button>
                      </div>

                      <div className="profile-dropdown-divider" />

                      {/* Logout */}
                      <div style={{ padding: '0.5rem' }}>
                        <button
                          className="profile-dropdown-logout"
                          onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                        >
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
              {user.role === 'admin' ? <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} /> : <UserDashboard activeTab={activeTab} setActiveTab={setActiveTab} />}
            </main>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export default App;
