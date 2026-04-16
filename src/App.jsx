import React, { createContext, useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CompleteProfilePage from './pages/CompleteProfilePage';
import { Heart, XCircle, CheckCircle, AlertCircle, Search, UserCheck, FileText, User as UserIcon, Activity, Bell, BookOpen, Menu, X, LogOut, LayoutDashboard, ChevronDown, ChevronLeft, Settings, Shield, GraduationCap, Award } from 'lucide-react';
import { supabase } from './supabase';

export const AppContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // ─── BROWSER HISTORY SUPPORT (BACK BUTTON) ─────────────────────────
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#/', '');
      
      if (hash === 'auth') {
        if (user) navigateTo('home'); // Redirect jika sudah login
        else setShowLanding(false);
      } else if (!hash || hash === 'landing') {
        if (!user) setShowLanding(true);
      } else {
        setShowLanding(false);
        setActiveTab(hash);
      }
    };
    
    // Check initial hash on mount (for non-logged in users)
    if (!user) {
      const initialHash = window.location.hash.replace('#/', '');
      if (initialHash === 'auth') setShowLanding(false);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  const navigateTo = (tab) => {
    if (tab === 'landing') {
      setShowLanding(true);
      window.history.pushState(null, '', '#/');
      return;
    }
    
    if (tab === 'auth') {
      setShowLanding(false);
      window.history.pushState(null, '', '#/auth');
      return;
    }

    setShowLanding(false);
    setActiveTab(tab);
    window.history.pushState(null, '', `#/${tab}`);
  };
  
  // Derived state: Cek apakah profil perlu dilengkapi (khusus user biasa)
  // Admin dilewati (cek role 'admin', email mengandung 'admin', atau nama adalah 'admin')
  const isAdmin = user && (
    user.role?.toLowerCase() === 'admin' || 
    user.email?.toLowerCase().includes('admin') || 
    user.name?.toLowerCase() === 'admin'
  );
  const profileNeedsCompletion = user && !isAdmin && !user.profile_complete;

  // Real Database States
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [usersDb, setUsersDb] = useState([]); // Removed dummy
  const [cvs, setCvs] = useState([]);
  const [taarufRequests, setTaarufRequests] = useState([]);
  const [messages, setMessages] = useState([]);

  // Ref untuk melacak ID user yang sedang aktif — mencegah reset tab saat Supabase
  // men-trigger ulang auth event (TOKEN_REFRESHED, SIGNED_IN) ketika pindah browser tab.
  const currentUserIdRef = React.useRef(null);

  // Session Restoration
  useEffect(() => {
    const fetchSessionUser = async (sessionUser) => {
      if (!sessionUser) {
        currentUserIdRef.current = null;
        setUser(null);
        setIsInitializing(false);
        return;
      }
      try {
        // Try SELECT first; upsert only if no row exists yet
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (!profile) {
          // New user: insert minimal record
          const profilePayload = {
            id: sessionUser.id,
            name: sessionUser.user_metadata?.name || sessionUser.email.split('@')[0],
            email: sessionUser.email,
            role: 'user',
            profile_complete: false,
          };
          const { data: upsertedProfile } = await supabase
            .from('profiles')
            .upsert(profilePayload, { onConflict: 'id', ignoreDuplicates: false })
            .select()
            .single();
          profile = upsertedProfile;
        }

        if (profile) {
          profile.waliPhone = profile.wali_phone || profile.waliPhone;

          // HANYA UNTUK USER: Cek apakah email sudah dikonfirmasi (verifikasi)
          // Admin dilewati agar langsung bisa akses (sesuai request)
          if (profile.role === 'user' && !sessionUser.email_confirmed_at) {
            console.warn('User belum verifikasi email, memutus sesi.');
            setUser(null);
            currentUserIdRef.current = null;
            setIsInitializing(false);
            return;
          }

          // Sinkronisasi Tab dengan URL Hash (misal: #/certificate atau #/auth)
          const hash = window.location.hash.replace('#/', '');
          
          if (hash === 'auth' || !hash) {
             // Jika sisa-sisa URL auth terbawa saat login, paksa ke home
             navigateTo('home');
          } else if (hash) {
             setActiveTab(hash);
             setShowLanding(false);
          } else {
             setActiveTab('home');
          }

          setUser(profile);
          // Jika sudah login, paksa keluar dari landing page
          setShowLanding(false);
        } else {
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

    // 2. Listen for auth changes (semua event: INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, dll.)
    // Tidak perlu cek event type — ref currentUserIdRef yang menentukan apakah tab di-reset.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchSessionUser(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Loading Quotes Array ───
  const loadingQuotes = [
    "Barakallahu lakuma wa baraka 'alaikuma...",
    "Menanti keberkahan dalam setiap langkah.",
    "Persiapan ilmu adalah kunci sakinah.",
    "Bismillah, memuat akademi Mawaddah.",
    "Menyatukan hati dalam ketaatan.",
    "Sakinah, Mawaddah, wa Rahmah."
  ];
  const [currentQuote] = useState(loadingQuotes[Math.floor(Math.random() * loadingQuotes.length)]);

  // Fetch data on login
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      // 1. Fetch CVs
      let cvQuery = supabase.from('cv_profiles').select('*');
      if (!isAdmin) {
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
        .select('*, sender:sender_id(email, name, wali_phone), target:target_cv_id(*), target_user:target_user_id(email, name, wali_phone)');
      
      if (reqData) {
        const mappedReqs = reqData.map(r => ({
          id: r.id,
          senderEmail: r.sender.email,
          senderAlias: r.sender.name,
          senderWaliPhone: r.sender.wali_phone,
          targetCvId: r.target_cv_id,
          targetAlias: r.target.alias,
          targetEmail: r.target_user?.email, 
          targetWaliPhone: r.target_user?.wali_phone,
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

      // 5. Fetch All Users (Admin only) for statistics
      if (isAdmin) {
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('*')
          .order('name', { ascending: true });
        if (allUsers) setUsersDb(allUsers);
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
          // Jika ada request baru dan target adalah user aktif, beri notif instan
          if (payload.eventType === 'INSERT' && payload.new.target_user_id === user.id) {
             showAlert('Pengajuan Baru!', 'Seseorang baru saja mengirimkan pengajuan taaruf kepada Anda. Cek tab Status Taaruf.', 'info');
          }
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log('Realtime notifications!', payload);
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cv_profiles' },
        (payload) => {
          console.log('Realtime cv_profiles!', payload);
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Realtime profiles!', payload);
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

  const deleteNotification = async (id) => {
    if (user) {
      await supabase.from('notifications').delete().eq('id', id);
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addNotification = async (text, targetUserId = null) => {
    const notifUserId = targetUserId || (user ? user.id : null);
    if (notifUserId) {
      const { error } = await supabase.from('notifications').insert({ 
        user_id: notifUserId, 
        content: text,
        is_read: false
      });
      
      if (error) {
        console.error('Gagal kirim notifikasi:', error);
      } else {
        console.log('Notifikasi berhasil dikirim ke:', notifUserId);
      }

      // Update local state if it's for current user
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
        let errorMsg = 'Email atau password salah!';
        if (error.message.toLowerCase().includes('email not confirmed')) {
           errorMsg = 'Email belum dikonfirmasi. Khusus Admin: Jika ingin bypass verifikasi, silakan matikan pengaturan "Confirm Email" di Supabase Dashboard (Authentication -> Settings).';
        } else {
           errorMsg = error.message;
        }
        showAlert('Gagal Masuk', errorMsg, 'error');
        return;
      }

      if (data?.user) {
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (!profile) {
          const newProfileDb = {
             id: data.user.id,
             name: data.user.user_metadata?.name || email.split('@')[0],
             email: data.user.email,
             role: 'user',
             profile_complete: false,
          };
          const { data: upsertedProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert(newProfileDb, { onConflict: 'id', ignoreDuplicates: false })
            .select()
            .single();
          if (upsertedProfile) {
             profile = upsertedProfile;
          } else {
             console.error('Gagal buat/upsert profil di database:', upsertError);
             showAlert('Profil Gagal Dibuat', 'Detail: ' + (upsertError?.message || 'Unknown error'), 'error');
             await supabase.auth.signOut();
             return;
          }
        }
          
        if (profile) {
          profile.waliPhone = profile.wali_phone || profile.waliPhone;

          // Logika Verifikasi Login (Request: Admin Bypass)
          // Jika role bukan admin dan email belum konfirmasi, blok akses.
          if (profile.role !== 'admin' && !data.user.email_confirmed_at) {
            showAlert(
              'Email Belum Terverifikasi', 
              'Mohon verifikasi email Anda terlebih dahulu melalui link yang dikirim saat pendaftaran.', 
              'warning'
            );
            await supabase.auth.signOut();
            return;
          }

          const isActualAdmin = profile.role?.toLowerCase() === 'admin';
          setUser(profile);
          setActiveTab(isActualAdmin ? 'home' : 'home');
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

  // Dipanggil setelah CompleteProfilePage berhasil submit
  const handleProfileCompleted = async () => {
    // Re-fetch profil terbaru agar user state ter-update (gender, domisili, dll.)
    if (user) {
      const { data: freshProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (freshProfile) {
        freshProfile.waliPhone = freshProfile.wali_phone;
        setUser(freshProfile);
      }
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
    currentUserIdRef.current = null;
    await supabase.auth.signOut();
    setUser(null);
    setShowLanding(true);
    setActiveTab('home');
  };

  if (isInitializing) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', 
        justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
        color: '#2C5F4D', textAlign: 'center', padding: '2rem'
      }}>
        <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
          {/* Decorative ring */}
          <div style={{ 
            position: 'absolute', inset: '-20px', border: '2px solid rgba(44,95,77,0.1)', 
            borderRadius: '50%', animation: 'spin 10s linear infinite' 
          }} />
          <div style={{ 
            width: '100px', height: '100px', background: 'white', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 15px 35px rgba(0,0,0,0.05)', animation: 'pulse 2s ease-in-out infinite' 
          }}>
            <Heart size={44} fill="#2C5F4D" color="#2C5F4D" />
          </div>
        </div>
        
        <h2 style={{ fontSize: '1.75rem', fontWeight: '900', margin: '0 0 0.5rem', letterSpacing: '-0.02em', color: '#1A2E25' }}>
          MAWADDAH <span style={{ color: '#D4AF37' }}>MATCH</span>
        </h2>
        
        <div style={{ maxWidth: '300px', width: '100%', marginBottom: '1.5rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500', marginBottom: '1.5rem', fontStyle: 'italic' }}>
            "{currentQuote}"
          </p>
          
          <div style={{ height: '4px', background: 'rgba(44,95,77,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', background: 'linear-gradient(90deg, #2C5F4D, #4ade80)', 
              width: '60%', borderRadius: '10px', animation: 'loading-bar 1.5s ease-in-out infinite' 
            }} />
          </div>
        </div>
        
        <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          MEMUAT KEBERKAHAN...
        </p>

        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 15px 35px rgba(0,0,0,0.05); }
            50% { transform: scale(1.05); box-shadow: 0 20px 45px rgba(44,95,77,0.15); }
            100% { transform: scale(1); box-shadow: 0 15px 35px rgba(0,0,0,0.05); }
          }
          @keyframes loading-bar {
            0% { width: 0%; transform: translateX(-100%); }
            50% { width: 70%; transform: translateX(20%); }
            100% { width: 0%; transform: translateX(100%); }
          }
          @keyframes spin {
             from { transform: rotate(0deg); }
             to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ user, cvs, setCvs, taarufRequests, setTaarufRequests, usersDb, setUsersDb, messages, setMessages, showAlert, addNotification }}>
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
          <LandingPage onEnter={() => navigateTo('auth')} />
        ) : (
          <AuthPage onLogin={handleLogin} onRegister={handleRegister} showAlert={showAlert} onBack={() => navigateTo('landing')} />
        )
      ) : profileNeedsCompletion ? (
        <CompleteProfilePage onComplete={handleProfileCompleted} />
      ) : (
        <div className="app-container">
          {/* Mobile overlay */}
          {isMobileMenuOpen && <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}

          {/* Sidebar */}
          <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <div className="sidebar-brand">
                <img src="/assets/logo.svg" alt="Mawaddah Logo" style={{ width: '54px', height: '54px', objectFit: 'contain' }} />
                <span style={{ marginLeft: '12px', fontSize: '1.25rem' }}>Mawaddah</span>
              </div>
            </div>
            
            <nav className="sidebar-nav">
              {isAdmin ? (
                <>
                  <button className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { navigateTo('home'); setIsMobileMenuOpen(false); }}><LayoutDashboard size={20}/> <span>Beranda Admin</span></button>
                  <button className={`nav-link ${activeTab === 'review' ? 'active' : ''}`} onClick={() => { navigateTo('review'); setIsMobileMenuOpen(false); }}><FileText size={20}/> <span>Review CV</span></button>
                  <button className={`nav-link ${activeTab === 'mediate' ? 'active' : ''}`} onClick={() => { navigateTo('mediate'); setIsMobileMenuOpen(false); }}><Activity size={20}/> <span>Mediasi Taaruf</span></button>
                  <button className={`nav-link ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => { navigateTo('courses'); setIsMobileMenuOpen(false); }}><GraduationCap size={20}/> <span>Kelola Kursus</span></button>
                </>
              ) : (
                <>
                  <button className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { navigateTo('home'); setIsMobileMenuOpen(false); }}><LayoutDashboard size={18}/> <span>Beranda</span></button>
                  <button className={`nav-link ${activeTab === 'materi' ? 'active' : ''}`} onClick={() => { navigateTo('materi'); setIsMobileMenuOpen(false); }}><BookOpen size={18}/> <span>Materi Belajar</span></button>
                  <button className={`nav-link ${activeTab === 'find' ? 'active' : ''}`} onClick={() => { navigateTo('find'); setIsMobileMenuOpen(false); }}><Search size={18}/> <span>Cari Pasangan</span></button>
                  <button className={`nav-link ${activeTab === 'status' ? 'active' : ''}`} onClick={() => { navigateTo('status'); setIsMobileMenuOpen(false); }}><Activity size={18}/> <span>Status Taaruf</span></button>
                  <button className={`nav-link ${activeTab === 'my_cv' ? 'active' : ''}`} onClick={() => { navigateTo('my_cv'); setIsMobileMenuOpen(false); }}><FileText size={18}/> <span>CV Taaruf</span></button>
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
                <div className="header-brand" style={{ color: '#2C5F4D', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src="/assets/logo.svg" alt="Mawaddah Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                  <span style={{ fontWeight: '800' }}>Mawaddah</span>
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
                      <span className="profile-card-role">{isAdmin ? 'Ustadz / Admin' : 'Pengguna'}</span>
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
                            if (!isAdmin) setActiveTab('account');
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
              {activeTab === 'certificate' ? (
                <CertificateView user={user} onBack={() => navigateTo('materi')} />
              ) : isAdmin ? (
                <AdminDashboard activeTab={activeTab} setActiveTab={navigateTo} />
              ) : (
                <UserDashboard activeTab={activeTab} setActiveTab={navigateTo} />
              )}
            </main>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

// ─── NEW COMPONENT: CertificateView ──────────────────────────────────────────
function CertificateView({ user, onBack }) {
  useEffect(() => {
    // Print automatically but allow back
    setTimeout(() => window.print(), 1000);
  }, []);

  const completedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#fdfaf3', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="no-print" style={{ width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button onClick={onBack} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ChevronLeft size={18} /> Kembali ke Materi
        </button>
        <button onClick={() => window.print()} className="btn btn-primary">
          <Award size={18} /> Cetak/Download PDF
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        .cert-outer { padding: 10px; border: 15px solid #2C5F4D; background: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
        .cert-inner { width: 900px; padding: 60px; border: 2px solid #D4AF37; text-align: center; background: white; position: relative; }
        .corner-pattern { position: absolute; width: 100px; height: 100px; opacity: 0.2; }
        .top-left { top: 20px; left: 20px; border-top: 5px solid #D4AF37; border-left: 5px solid #D4AF37; }
        .top-right { top: 20px; right: 20px; border-top: 5px solid #D4AF37; border-right: 5px solid #D4AF37; }
        .bottom-left { bottom: 20px; left: 20px; border-bottom: 5px solid #D4AF37; border-left: 5px solid #D4AF37; }
        .bottom-right { bottom: 20px; right: 20px; border-bottom: 5px solid #D4AF37; border-right: 5px solid #D4AF37; }
        .cert-h1 { font-family: 'Cinzel', serif; font-size: 3.5rem; color: #2C5F4D; margin: 0.5rem 0; letter-spacing: 0.1em; }
        .cert-sub { color: #D4AF37; font-weight: 700; font-size: 1.2rem; letter-spacing: 0.3em; margin-bottom: 3rem; }
        .cert-name { font-size: 3rem; font-family: 'Cinzel', serif; font-weight: 800; color: #1A2E25; margin: 1rem 0; border-bottom: 2px solid #D4AF37; display: inline-block; padding-bottom: 0.5rem; }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: white; }
          .cert-outer { box-shadow: none; border-width: 20px; }
        }
      `}</style>

      <div className="cert-outer">
        <div className="cert-inner">
          <div className="corner-pattern top-left"></div>
          <div className="corner-pattern top-right"></div>
          <div className="corner-pattern bottom-left"></div>
          <div className="corner-pattern bottom-right"></div>
          <div style={{ fontSize: '5rem', marginBottom: '-20px' }}>🏆</div>
          <h1 className="cert-h1">Sertifikat</h1>
          <div className="cert-sub">MAWADDAH ACADEMY</div>
          <div style={{ fontStyle: 'italic', color: '#64748b' }}>Diberikan kepada:</div>
          <div className="cert-name">{user.name?.toUpperCase()}</div>
          <div style={{ fontSize: '1.2rem', color: '#334155', lineHeight: '1.8', maxWidth: '650px', margin: '2rem auto' }}>
            Atas keberhasilan dalam menyelesaikan seluruh program pembelajaran <strong>"Kurikulum Pra-Nikah Islami"</strong> dengan hasil sangat memuaskan.
          </div>
          <div style={{ marginTop: '3rem', display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'flex-end' }}>
             <div>
               <div style={{ fontWeight: 700, color: '#2C5F4D' }}>{completedDate}</div>
               <div style={{ borderTop: '1px solid #94a3b8', width: '200px', fontSize: '0.8rem' }}>Tanggal Lulus</div>
             </div>
             <div>
               <div style={{ fontFamily: 'Cinzel', fontWeight: 700, color: '#2C5F4D' }}>USTADZ ABDULLAH TASLIM</div>
               <div style={{ borderTop: '1px solid #94a3b8', width: '200px', fontSize: '0.8rem' }}>Pembimbing Utama</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
