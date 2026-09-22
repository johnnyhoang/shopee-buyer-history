import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AUTH_KEY = 'shopee_ledger_auth_session_v1';

// Cấu hình tài khoản nội bộ dự phòng
const VALID_CREDENTIALS = {
  username: 'thuynga',
  password: 'abcd1234',
  displayName: 'Thùy Nga',
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      return null;
    } catch (e) {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Kiểm tra session Supabase Auth ban đầu
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
          provider: 'google',
          loggedInAt: new Date().toISOString(),
        };
        setUser(userData);
        localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      }
      setIsLoading(false);
    });

    // 2. Đăng ký lắng nghe thay đổi trạng thái xác thực (Login/Logout/OAuth Callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
          provider: 'google',
          loggedInAt: new Date().toISOString(),
        };
        setUser(userData);
        localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      } else if (_event === 'SIGNED_OUT') {
        localStorage.removeItem(AUTH_KEY);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Đăng nhập bằng Google via Supabase Auth
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      console.error('Lỗi khi đăng nhập bằng Google:', error.message);
      throw error;
    }
  };

  // Đăng nhập bằng Form username/password dự phòng
  const login = (inputUsername, inputPassword) => {
    if (
      inputUsername.toLowerCase() === VALID_CREDENTIALS.username.toLowerCase() &&
      inputPassword === VALID_CREDENTIALS.password
    ) {
      const userData = {
        username: VALID_CREDENTIALS.username,
        name: VALID_CREDENTIALS.displayName,
        provider: 'local',
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      setUser(userData);
      return true;
    }
    return false;
  };

  // Đăng xuất
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Lỗi khi đăng xuất Supabase:', e);
    }
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        session,
        isLoading,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
