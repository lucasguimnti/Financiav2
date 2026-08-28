import axios from 'axios';

export const api = axios.create({
  // Tenta puxar a variável, mas se o Cloudflare falhar, usa o link direto como garantia
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://financiav2.onrender.com', 
});

// O INTERCEPTOR: Antes de qualquer requisição sair, ele executa essa função
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});