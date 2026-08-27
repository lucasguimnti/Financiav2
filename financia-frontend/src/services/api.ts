import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000', // ou 3001, dependendo de onde o backend estiver
  headers: { 'Content-Type': 'application/json' },
});