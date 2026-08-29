import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuração inteligente: usa a nuvem em produção ou o localhost em desenvolvimento
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/financia',
  
  // O SSL é necessário para conexões com bancos em nuvem (como Supabase/Render)
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Função simples para testar se o Node consegue "falar" com o banco
export const testConnection = async () => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW()');
    return res.rows[0];
  } finally { 
    client.release();
  }
};