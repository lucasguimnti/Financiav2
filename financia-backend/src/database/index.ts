import { Pool } from 'pg';

// Configuração da conexão com o PostgreSQL que está rodando na sua máquina
export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'financia',
  password: 'admin',
  port: 5432,
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