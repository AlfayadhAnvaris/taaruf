"use client";
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Award } from 'lucide-react';

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext();

if (typeof globalThis !== 'undefined') {
  globalThis.globalSessionPromise = globalThis.globalSessionPromise || null;
}

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
    if (name === 'AbortError' || name === 'AuthRetryableFetchError' || msg.includes('steal') || msg.includes('Failed to fetch')) {
      event.preventDefault(); // Mute Next.js dev overlay
    }
  });

  // 2. Mute console.error so Next.js doesn't pop up the overlay for internal Supabase SDK errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const firstArg = args[0];
    if (firstArg) {
      const isAuthError = (typeof firstArg === 'object' && firstArg.name === 'AuthRetryableFetchError') ||
                          (typeof firstArg === 'string' && (firstArg.includes('AuthRetryableFetchError') || firstArg.includes('Failed to fetch') || firstArg.includes('Lock')));
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
  const [reportModalState, setReportModalState] = useState({
    isOpen: false,
    reportedUserId: null,
    reportedCvId: null,
    reportedAlias: ''
  });
  const [lmsView, setLmsView] = useState('welcome');

  const showAlert = (title, message, type = 'info') => {
    setModalState({ isOpen: true, title, message, type });
  };

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

  const fetchAllData = useCallback(async () => {
    try {
      // 1. Fetch CVs
      // Public approved CVs
      const { data: pubCvData } = await supabase.from('cv_profiles').select('*').eq('status', 'approved');
      
      // Current user's CV (any status)
      let allVisibleCvs = pubCvData || [];
      if (user) {
        const { data: myCvData } = await supabase.from('cv_profiles').select('*').eq('user_id', user.id);
        if (myCvData) {
          // Merge and remove duplicates by ID
          const merged = [...allVisibleCvs, ...myCvData];
          allVisibleCvs = Array.from(new Map(merged.map(cv => [cv.id, cv])).values());
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
          receiverId: req.receiver_id,
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

      // 5. Fetch Academy Levels (Count how many lessons completed per user)
      const { data: progData } = await supabase.from('user_lesson_progress').select('user_id, completed');
      if (progData) {
        const levels = {};
        progData.forEach(p => {
          if (p.completed) {
            levels[p.user_id] = (levels[p.user_id] || 0) + 1;
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
    } catch (err) {
      console.error('AppContext: fetchAllData error:', err);
    }
  }, [user, isAdmin]);

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
        if (!globalThis.globalSessionPromise) {
          globalThis.globalSessionPromise = supabase.auth.getSession().catch(err => {
            console.warn('Session init caught:', err);
            return { data: { session: null }, error: err };
          });
        }
        const { data: { session }, error: sessionError } = await globalThis.globalSessionPromise;
        
        if (sessionError) {
          console.warn('Session Warning (Ignored in Dev):', sessionError.message);
          // If the refresh token is invalid / not found, standard signOut might throw an exception.
          // In that case, we fall back to a local-only signout so the client is cleared properly.
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          setUser(null);
        } else if (session) {
          await fetchSessionUser(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('AppContext: initSession warning (Ignored in Dev):', err.message || err);
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
        showAlert, addNotification, profileNeedsCompletion, setProfileNeedsCompletion,
        academyLevels, setAcademyLevels, claimedBadges, setClaimedBadges,
        hideBanner, setHideBanner, setConfirmState,
        modalState, setModalState, confirmState, isInitializing,
        lmsView, setLmsView, handleLogout, unreadCount, markNotificationsAsRead,
        reportModalState, setReportModalState,
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
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);
