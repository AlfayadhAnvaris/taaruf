"use client";
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Award } from 'lucide-react';

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext();



if (typeof window !== 'undefined') {
  // 0. Synchronously remove simulator pre-loader if present to prevent hydration mismatch
  (function() {
    function removeLoader() {
      const el = document.querySelector('.simulator-pre-loader, .simulator');
      if (el) {
        el.remove();
        return true;
      }
      return false;
    }
    if (removeLoader()) return;
    const observer = new MutationObserver(() => {
      if (removeLoader()) {
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('DOMContentLoaded', () => {
      removeLoader();
      observer.disconnect();
    });
  })();

  // Patch removeChild to handle React 19 style hoisting unmount mismatch
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      if (child.parentNode) {
        return originalRemoveChild.call(child.parentNode, child);
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  // 1. Mute unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || '';
    const name = event.reason?.name || '';
    if (
      name === 'AbortError' || 
      name === 'AuthRetryableFetchError' || 
      msg.includes('steal') || 
      msg.includes('Failed to fetch') || 
      msg.includes('refresh_token') || 
      msg.includes('Refresh Token') ||
      msg.includes('refresh token')
    ) {
      event.preventDefault(); // Mute Next.js dev overlay
    }
  });

  // 2. Mute console.error so Next.js doesn't pop up the overlay for internal Supabase SDK errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const firstArg = args[0];
    if (firstArg) {
      const msgStr = typeof firstArg === 'string' ? firstArg : (firstArg.message || '');
      const isAuthError = 
        (typeof firstArg === 'object' && (firstArg.name === 'AuthRetryableFetchError' || msgStr.includes('Refresh Token') || msgStr.includes('refresh_token') || msgStr.includes('refresh token'))) ||
        (typeof firstArg === 'string' && (
          firstArg.includes('AuthRetryableFetchError') || 
          firstArg.includes('Failed to fetch') || 
          firstArg.includes('Lock') || 
          firstArg.includes('refresh_token') || 
          firstArg.includes('Refresh Token') || 
          firstArg.includes('refresh token')
        ));
      if (isAuthError) return; // Mute
    }
    originalConsoleError(...args);
  };
}

export const AppContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cvs, setCvs] = useState([]);
  const [taarufRequests, setTaarufRequests] = useState([]);
  const [usersDb, setUsersDb] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [profileNeedsCompletion, setProfileNeedsCompletion] = useState(false);
  const [academyLevels, setAcademyLevels] = useState({});
  const [claimedBadges, setClaimedBadges] = useState({});
  const [hideBanner, setHideBanner] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [toast, setToast] = useState(null);
  const [reportModalState, setReportModalState] = useState({
    isOpen: false,
    reportedUserId: null,
    reportedCvId: null,
    reportedAlias: ''
  });
  const [lmsView, setLmsView] = useState('welcome');
  const [csContacts, setCsContacts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const showAlert = (title, message, type = 'info') => {
    setModalState({ isOpen: true, title, message, type });
  };

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  const addNotification = async (text, targetUserId) => {
    const finalTargetId = targetUserId || user?.id;
    if (!finalTargetId) return;
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', finalTargetId)
      .eq('content', text)
      .gt('created_at', tenMinsAgo)
      .limit(1);
    if (existing && existing.length > 0) return;
    const { data: inserted } = await supabase
      .from('notifications')
      .insert({ user_id: finalTargetId, content: text })
      .select();
    if (inserted && inserted.length > 0 && finalTargetId === user?.id) {
      const newNotif = {
        id: inserted[0].id,
        text: inserted[0].content,
        time: new Date(inserted[0].created_at).toLocaleTimeString(),
        is_read: inserted[0].is_read
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('academy_leaderboard')
        .select('*')
        .order('completed_lessons_count', { ascending: false })
        .order('last_completed_at', { ascending: true });
      if (!error && data) {
        setLeaderboard(data);
      }
    } catch (err) {
      console.warn("AppContext: fetchLeaderboard warning:", err);
    }
  }, []);

  const getBadgeCount = useCallback((userId) => {
    if (!userId) return 0;
    if (user && userId === user.id) {
      return academyLevels[user.id] || 0;
    }
    const found = leaderboard.find(item => item.user_id === userId);
    return found ? found.completed_lessons_count : 0;
  }, [user, academyLevels, leaderboard]);

  const fetchAllData = useCallback(async () => {
    try {
      // 1. Fetch CVs
      let allVisibleCvs = [];
      if (isAdmin) {
        const { data: allCvData } = await supabase.from('cv_profiles').select('*').order('updated_at', { ascending: false });
        allVisibleCvs = allCvData || [];
      } else {
        // Public approved CVs
        const { data: pubCvData } = await supabase.from('cv_profiles').select('*').eq('status', 'approved');
        allVisibleCvs = pubCvData || [];
        // Current user's CV (any status)
        if (user) {
          const { data: myCvData } = await supabase.from('cv_profiles').select('*').eq('user_id', user.id);
          if (myCvData) {
            // Merge and remove duplicates by ID
            const merged = [...allVisibleCvs, ...myCvData];
            allVisibleCvs = Array.from(new Map(merged.map(cv => [cv.id, cv])).values());
          }
        }
      }
      setCvs(allVisibleCvs);

      // 2. Fetch Taaruf Requests
      const { data: reqData } = await supabase.from('taaruf_requests').select('*');
      let mappedReqs = [];
      if (reqData) {
        mappedReqs = reqData.map(req => ({
          ...req,
          senderId: req.sender_id,
          receiverId: req.target_user_id,
          senderAlias: req.sender_alias || allVisibleCvs.find(c => c.user_id === req.sender_id)?.alias || 'Kandidat',
          targetAlias: req.target_alias || allVisibleCvs.find(c => c.id === req.target_cv_id)?.alias || 'Kandidat',
          senderEmail: req.sender_email || 'Email Tidak Tersedia',
          targetEmail: req.target_email || 'Email Tidak Tersedia',
          targetCvId: req.target_cv_id,
          updatedAt: req.updated_at,
          createdAt: req.created_at
        }));
        setTaarufRequests(mappedReqs);
      }

      // 3. Fetch Notifications
      if (user) {
        const { data: notifData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
        if (notifData) setNotifications(notifData.map(n => ({ id: n.id, text: n.content, time: new Date(n.created_at).toLocaleTimeString(), is_read: n.is_read })));
      }

      // 4. Fetch Bookmarks
      if (user) {
        const { data: bmarkData } = await supabase.from('user_bookmarks').select('*').eq('user_id', user.id);
        if (bmarkData) setBookmarks(bmarkData);
      }

      // 5. Fetch Academy Levels (Count how many lessons completed per user in active classes)
      let lessonToClass = {};
      let userSuspendedClasses = new Set();
      try {
        const [lessonsRes, coursesRes, enrollmentsRes] = await Promise.all([
          supabase.from('lessons').select('id, course_id'),
          supabase.from('courses').select('id, class_id'),
          supabase.from('course_enrollments').select('user_id, class_id, is_suspended')
        ]);

        if (lessonsRes.data && coursesRes.data) {
          const courseToClass = {};
          coursesRes.data.forEach(c => {
            courseToClass[c.id] = c.class_id;
          });
          lessonsRes.data.forEach(l => {
            lessonToClass[l.id] = courseToClass[l.course_id];
          });
        }

        if (enrollmentsRes.data) {
          enrollmentsRes.data.forEach(e => {
            if (e.is_suspended) {
              userSuspendedClasses.add(`${e.user_id}_${e.class_id}`);
            }
          });
        }
      } catch (err) {
        console.warn('Error fetching relations for academy levels:', err);
      }

      const { data: progData } = await supabase.from('user_lesson_progress').select('user_id, completed, lesson_id');
      if (progData) {
        const levels = {};
        progData.forEach(p => {
          if (p.completed) {
            const classId = lessonToClass[p.lesson_id];
            const isSuspended = classId ? userSuspendedClasses.has(`${p.user_id}_${classId}`) : false;
            if (!isSuspended) {
              levels[p.user_id] = (levels[p.user_id] || 0) + 1;
            }
          }
        });
        setAcademyLevels(levels);
      }

      // 6. Fetch Messages
      const { data: msgData } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (msgData) {
        // Group by taaruf_request_id (matching the correct database column name)
        const grouped = {};
        msgData.forEach(m => {
          const tId = m.taaruf_request_id;
          if (!tId) return;

          if (!grouped[tId]) {
            grouped[tId] = { taarufId: tId, chats: [] };
          }
          
          // Find the corresponding taaruf request to get correct email and alias
          const req = mappedReqs.find(r => r.id === tId);
          let senderEmail = 'Email Tidak Tersedia';
          let senderAlias = 'Kandidat';
          if (req) {
            if (m.sender_id === req.senderId) {
              senderEmail = req.senderEmail;
              senderAlias = req.senderAlias;
            } else if (m.sender_id === req.receiverId) {
              senderEmail = req.targetEmail;
              senderAlias = req.targetAlias;
            }
          }

          grouped[tId].chats.push({
            sender: senderEmail,
            senderAlias: senderAlias,
            text: m.text, // matching the correct 'text' database column name
            timestamp: m.created_at
          });
        });
        setMessages(Object.values(grouped));
      }

      // 7. Fetch Users (Admin Only)
      if (isAdmin) {
        const { data: uData } = await supabase.from('profiles').select('*');
        if (uData) setUsersDb(uData);
      }

      // 8. Fetch CS Contacts
      try {
        const { data: csData } = await supabase.from('cs_contacts').select('*').order('created_at', { ascending: true });
        if (csData) setCsContacts(csData);
      } catch (err) {
        console.warn('cs_contacts table not available yet:', err);
      }

      // 9. Fetch Leaderboard
      await fetchLeaderboard();
    } catch (err) {
      console.error('AppContext: fetchAllData error:', err);
    }
  }, [user, isAdmin, fetchLeaderboard]);

  useEffect(() => {
    if (user) fetchAllData();
    
    const handleRefresh = () => { if (user) fetchAllData(); };
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, [user, fetchAllData]);

  const fetchSessionUser = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setIsAdmin(false);
      return;
    }
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
      if (profile) {
        setUser({ ...authUser, ...profile });
        setIsAdmin(profile.role === 'admin');
        setProfileNeedsCompletion(!profile.profile_complete && profile.role !== 'admin');
      } else {
        setUser(authUser);
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('AppContext: fetchSessionUser error:', err);
      setUser(authUser);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error, forcing local signout:', err);
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    } finally {
      setUser(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const initSession = async () => {
      try {
        // Fetch session with a 3-second timeout to prevent getting stuck on load
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 3000))
        ]).catch(err => {
          console.warn('Session init caught/timeout:', err);
          return { data: { session: null }, error: err };
        });

        const { data: { session }, error: sessionError } = sessionResult;
        
        const clearLocalAuthData = () => {
          if (typeof window !== 'undefined') {
            try {
              const params = new URLSearchParams(window.location.search);
              const sid = params.get('sid');
              // Remove tokens with current sid prefix or global auth-tokens
              for (let i = window.localStorage.length - 1; i >= 0; i--) {
                const key = window.localStorage.key(i);
                if (key && (key.startsWith('sb-') || key.includes('auth-token'))) {
                  if (!sid || key.includes(sid) || !key.includes('-')) {
                    window.localStorage.removeItem(key);
                  }
                }
              }
            } catch (e) {
              console.warn('Failed to clear local auth data:', e);
            }
          }
        };

        if (sessionError) {
          console.warn('Session Warning (Ignored in Dev):', sessionError.message || sessionError);
          // If the refresh token is invalid / not found, local signout and clear local storage
          clearLocalAuthData();
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          setUser(null);
        } else if (session) {
          // Fetch user profile with a 3-second timeout
          await Promise.race([
            fetchSessionUser(session.user),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 3000))
          ]).catch(err => {
            console.warn('fetchSessionUser caught/timeout:', err);
            setUser(session.user); // Fallback to auth user
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('AppContext: initSession warning (Ignored in Dev):', err.message || err);
        if (typeof window !== 'undefined') {
          try {
            for (let i = window.localStorage.length - 1; i >= 0; i--) {
              const key = window.localStorage.key(i);
              if (key && (key.startsWith('sb-') || key.includes('auth-token'))) {
                window.localStorage.removeItem(key);
              }
            }
          } catch {}
        }
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        setUser(null);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
        fetchSessionUser(session?.user);
      } else if (_event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchSessionUser]);

  const markNotificationsAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  // Derived: count notifications that are not read (don't have is_read: true)
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppContext.Provider value={{ 
        user, setUser, cvs, setCvs, taarufRequests, setTaarufRequests, usersDb, setUsersDb, 
        messages, setMessages, notifications, setNotifications, isAdmin, setIsAdmin, 
        bookmarks, setBookmarks, userReviews, setUserReviews,
        showAlert, showToast, addNotification, profileNeedsCompletion, setProfileNeedsCompletion,
        academyLevels, setAcademyLevels, claimedBadges, setClaimedBadges,
        hideBanner, setHideBanner, setConfirmState,
        modalState, setModalState, confirmState, isInitializing,
        lmsView, setLmsView, handleLogout, unreadCount, markNotificationsAsRead,
        reportModalState, setReportModalState, csContacts, setCsContacts,
        leaderboard, fetchLeaderboard, getBadgeCount,
        getAcademyBadge: (completedCount, iconSize = 14) => {
          const count = Number(completedCount) || 0;
          if (count < 1) return null;
          if (count >= 4) return { label: 'Mumtaz (Full Mastery)', icon: <Award size={iconSize} />, color: '#D4AF37' };
          if (count >= 3) return { label: 'Mushlih (Expert)', icon: <Star size={iconSize} fill="#D4AF37" />, color: '#D4AF37' };
          if (count >= 2) return { label: 'Mujtahid (Intermediate)', icon: <Star size={iconSize} fill="#A8A9AD" />, color: '#71717A' };
          return { label: 'Mubtadi (Beginner)', icon: <Star size={iconSize} fill="#cd7f32" />, color: '#cd7f32' };
        }
      }}>
      {children}

      {/* 🔔 GLOBAL ALERT MODAL 🔔 */}
      {modalState.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1.5rem',
          animation: 'fadeIn 0.2s ease'
        }} onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '95%',
            maxWidth: '400px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid #f1f5f9',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '2rem 1.5rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: modalState.type === 'error' ? '#fef2f2' : (modalState.type === 'success' ? '#f0fdf4' : '#f0f9ff'),
                color: modalState.type === 'error' ? '#ef4444' : (modalState.type === 'success' ? '#22c55e' : '#3b82f6')
              }}>
                {modalState.type === 'error' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                ) : modalState.type === 'success' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                )}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#1e293b' }}>{modalState.title}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '500', lineHeight: 1.5 }}>{modalState.message}</p>
            </div>
            <div style={{
              background: '#f8fafc',
              padding: '1rem 1.5rem',
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid #f1f5f9'
            }}>
              <button 
                onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                style={{
                  background: '#134E39',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ❓ GLOBAL CONFIRM MODAL ❓ */}
      {confirmState.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1.5rem',
          animation: 'fadeIn 0.2s ease'
        }} onClick={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '95%',
            maxWidth: '400px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid #f1f5f9',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '2rem 1.5rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: confirmState.confirmColor === '#134E39' ? '#f0fdf4' : '#fef2f2',
                color: confirmState.confirmColor || '#ef4444'
              }}>
                {confirmState.confirmColor === '#134E39' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                )}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#1e293b' }}>{confirmState.title}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '500', lineHeight: 1.5 }}>{confirmState.message}</p>
            </div>
            <div style={{
              background: '#f8fafc',
              padding: '1rem 1.5rem',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              borderTop: '1px solid #f1f5f9'
            }}>
              <button 
                onClick={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                style={{
                  background: 'white',
                  color: '#475569',
                  border: '1.5px solid #e2e8f0',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  if (confirmState.onConfirm) {
                    confirmState.onConfirm();
                  }
                  setConfirmState(prev => ({ ...prev, isOpen: false }));
                }}
                style={{
                  background: confirmState.confirmColor || '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {confirmState.confirmText || 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🍞 GLOBAL TOAST NOTIFICATION 🍞 */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 999999,
          padding: '0.85rem 1.5rem', borderRadius: '10px', fontWeight: '800',
          fontSize: '0.875rem', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          background: toast.type === 'error' ? '#ef4444' : (toast.type === 'warning' ? '#f59e0b' : '#134E39'),
          color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          {toast.type === 'error' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          ) : toast.type === 'warning' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          )}
          {toast.msg}
        </div>
      )}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);
