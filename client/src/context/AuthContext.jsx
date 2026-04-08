import React, { createContext, useReducer, useEffect } from 'react';
import api from '../lib/axios.js';

export const AuthContext = createContext(null);

const initialState = {
  ca: null,
  isAuthenticated: false,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ca: action.payload, isAuthenticated: true, loading: false };
    case 'LOGOUT':
      return { ca: null, isAuthenticated: false, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'UPDATE_CA':
      return { ...state, ca: { ...state.ca, ...action.payload } };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Try to restore session using refresh token
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/auth/me').then(({ data }) => {
        dispatch({ type: 'LOGIN', payload: data });
      }).catch(() => {
        localStorage.removeItem('accessToken');
        dispatch({ type: 'LOGOUT' });
      });
    } else {
      // Try refresh
      api.post('/auth/refresh').then(({ data }) => {
        localStorage.setItem('accessToken', data.accessToken);
        return api.get('/auth/me');
      }).then(({ data }) => {
        dispatch({ type: 'LOGIN', payload: data });
      }).catch(() => {
        dispatch({ type: 'LOGOUT' });
      });
    }
  }, []);

  const login = (accessToken, ca) => {
    localStorage.setItem('accessToken', accessToken);
    dispatch({ type: 'LOGIN', payload: ca });
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('accessToken');
    dispatch({ type: 'LOGOUT' });
  };

  const updateCa = (updates) => {
    dispatch({ type: 'UPDATE_CA', payload: updates });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateCa }}>
      {children}
    </AuthContext.Provider>
  );
}
