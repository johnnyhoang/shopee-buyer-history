import React, { createContext, useContext, useState, useEffect } from 'react';

const AUTH_KEY = 'shopee_ledger_auth_session_v1';

// Cấu hình tài khoản đăng nhập
const VALID_CREDENTIALS = {
  username: 'thuynga',
  password: 'abcd1234',
  displayName: 'Thùy Nga',
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.username === VALID_CREDENTIALS.username) {
          return parsed;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const login = (inputUsername, inputPassword) => {
    if (
      inputUsername.toLowerCase() === VALID_CREDENTIALS.username.toLowerCase() &&
      inputPassword === VALID_CREDENTIALS.password
    ) {
      const userData = {
        username: VALID_CREDENTIALS.username,
        name: VALID_CREDENTIALS.displayName,
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
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
