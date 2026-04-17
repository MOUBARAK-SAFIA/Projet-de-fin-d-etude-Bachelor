import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

// État initial
const initialState = {
  user: null,
  token: localStorage.getItem('diploma_token'),
  isAuthenticated: !!localStorage.getItem('diploma_token'), // true si token existe
  loading: true,
};

// Actions
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGOUT = 'LOGOUT';
const LOAD_USER = 'LOAD_USER';
  const AUTH_ERROR = 'AUTH_ERROR';

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case LOAD_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case AUTH_ERROR:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    default:
      return state;
  }
};

// Créer le contexte
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('diploma_token');
      if (token) {
        try {
          const response = await api.get('/auth/verify');
          dispatch({
            type: LOAD_USER,
            payload: response.data.data.user,
          });
        } catch (error) {
          dispatch({ type: AUTH_ERROR });
          localStorage.removeItem('diploma_token');
        }
      } else {
        dispatch({ type: AUTH_ERROR });
      }
    };

    loadUser();
  }, []);

  // Login
  const login = async (email, password, role) => {
    try {
      const response = await api.post('/auth/login', { email, password, role });
      const { token, user } = response.data.data;
      
      localStorage.setItem('diploma_token', token);
      dispatch({
        type: LOGIN_SUCCESS,
        payload: { token, user },
      });
      
      return { success: true };
    } catch (error) {
      const apiMessage = error.response?.data?.message;
      if (apiMessage) {
        return { success: false, message: apiMessage };
      }
      if (!error.response) {
        return {
          success: false,
          message:
            'Serveur injoignable. Démarrez le backend (dossier backend, commande « npm run dev » ou « node server.js ») sur le port 5000, puis réessayez. Vérifiez aussi VITE_API_URL dans frontend/.env.',
        };
      }
      return {
        success: false,
        message: `Erreur serveur (${error.response.status}).`,
      };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('diploma_token');
    dispatch({ type: LOGOUT });
  };

  // Update user
  const updateUser = (userData) => {
    dispatch({ type: LOGIN_SUCCESS, payload: userData });
  };

  const value = {
    ...state,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
