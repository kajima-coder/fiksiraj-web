import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, professional } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(professional);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    return professional;
  };

  const register = async (name, profession, country, city, bio, phone, email, password) => {
    const response = await axios.post(`${API}/auth/register`, {
      name,
      profession,
      country,
      city,
      bio,
      phone,
      email,
      password
    });
    const { access_token, professional } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(professional);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    return professional;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
