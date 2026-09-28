import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from('users').select('*');
    if (data) setAllUsers(data);
  }, []);

  const fetchNotifications = useCallback(async (userId) => {
    const { data } = await supabase.from('notifications').select('*').eq('userId', userId);
    if (data) setNotifications(data);
  }, []);

  const handleSessionUser = useCallback(async (authUser) => {
    if (!authUser?.email) return;
    console.log('Fetching user profile for:', authUser.email);
    const { data, error } = await supabase.from('users').select('*').eq('email', authUser.email).single();
    if (error) {
      console.error('Error fetching user profile:', error);
    }
    if (!error && data) {
      console.log('User profile found:', data);
      setCurrentUser(data);
      setActiveRole(data.role);
      setIsAuthenticated(true);
      await fetchNotifications(data.id);
    } else {
      console.warn('No user profile found for email:', authUser.email);
    }
  }, [fetchNotifications]);

  // Initialize session and auth state listener
  useEffect(() => {
    let subscription;
    async function init() {
      // 1. Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleSessionUser(session.user);
      }
      
      // 2. Listen for auth changes
      const { data } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          if (newSession?.user) {
            await handleSessionUser(newSession.user);
          } else {
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        }
      );
      subscription = data.subscription;

      await fetchUsers();
      setLoading(false);
    }
    init();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [fetchUsers, handleSessionUser]);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      console.error('Error logging in:', error?.message);
      return false;
    }
    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const markNotificationAsRead = useCallback(async (notificationId) => {
    setNotifications((prev) => {
      const notif = prev.find(n => n.id === notificationId);
      if (!notif) return prev;
      const newState = !notif.isRead;
      supabase.from('notifications').update({ isRead: newState }).eq('id', notificationId).then();
      return prev.map((n) => (n.id === notificationId ? { ...n, isRead: newState } : n));
    });
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!currentUser) return;
    await supabase.from('notifications').update({ isRead: true }).eq('userId', currentUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, [currentUser]);

  const updateUserProfile = useCallback(async (updates) => {
    if (!currentUser) return;
    const { error } = await supabase.from('users').update(updates).eq('id', currentUser.id);
    if (!error) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }
  }, [currentUser]);

  const value = useMemo(
    () => ({
      currentUser,
      activeRole,
      setActiveRole,
      isAuthenticated,
      loading,
      login,
      logout,
      notifications,
      unreadNotificationsCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      updateUserProfile,
      allUsers,
    }),
    [
      currentUser,
      activeRole,
      setActiveRole,
      isAuthenticated,
      loading,
      login,
      logout,
      notifications,
      unreadNotificationsCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      updateUserProfile,
      allUsers,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
