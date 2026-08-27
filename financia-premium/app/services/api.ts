import axios from 'axios';

export const api = axios.create({
  // Coloque aqui a URL correta do seu backend
  baseURL: 'process.env.NEXT_PUBLIC_API_URL', 
});

// O INTERCEPTOR: Antes de qualquer requisição sair, ele executa essa função
api.interceptors.request.use((config) => {
  // Verifica se estamos rodando no navegador (client-side)
  if (typeof window !== 'undefined') {
    // Busca o token que foi salvo no login
    const token = localStorage.getItem('token');
    
    // Se o token existir, injeta no cabeçalho (Header) da requisição
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});