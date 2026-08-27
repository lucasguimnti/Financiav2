import { pool, testConnection } from '../src/database/index';

describe('Database Connection', () => {
  afterAll(async () => {
    // Fecha a conexão após o teste para o terminal não ficar travado
    await pool.end();
  });

  it('deve conectar ao PostgreSQL com sucesso', async () => {
    const result = await testConnection();
    // Verifica se o banco respondeu com a data/hora atual (now)
    expect(result).toHaveProperty('now'); 
  });
});