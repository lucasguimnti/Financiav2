import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/api/app';
import { pool } from '../src/database/index';

describe('Reports API', () => {
  let token = '';
  let accountId = '';
  let foodCategoryId = '';
  let transportCategoryId = '';

  beforeAll(async () => {
    // 1. Limpeza de ambiente
    try { await pool.query('DELETE FROM transactions'); } catch(e) {}
    try { await pool.query('DELETE FROM categories'); } catch(e) {}
    try { await pool.query('DELETE FROM accounts'); } catch(e) {}
    await pool.query('DELETE FROM users');

    // 2. Setup
    await request(app).post('/api/users').send({ email: 'relatorios@financia.com', password: '123' });
    const loginRes = await request(app).post('/api/login').send({ email: 'relatorios@financia.com', password: '123' });
    token = loginRes.body.token;

    const accRes = await request(app).post('/api/accounts').set('Authorization', `Bearer ${token}`).send({ name: 'Conta Principal', balance: 0 });
    accountId = accRes.body.id;

    // 3. Cria duas categorias diferentes
    const cat1Res = await request(app).post('/api/categories').set('Authorization', `Bearer ${token}`).send({ name: 'Alimentação', type: 'expense', color: '#FF0000' });
    foodCategoryId = cat1Res.body.id;

    const cat2Res = await request(app).post('/api/categories').set('Authorization', `Bearer ${token}`).send({ name: 'Transporte', type: 'expense', color: '#0000FF' });
    transportCategoryId = cat2Res.body.id;

    // 4. Injeta transações de AGOSTO
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
      .send({ account_id: accountId, category_id: foodCategoryId, amount: 200, type: 'expense', description: 'Mercado', date: '2026-08-10' });
    
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
      .send({ account_id: accountId, category_id: transportCategoryId, amount: 100, type: 'expense', description: 'Uber', date: '2026-08-15' });

    // 5. Injeta transação de JULHO (Para testar se o filtro funciona)
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
      .send({ account_id: accountId, category_id: foodCategoryId, amount: 500, type: 'expense', description: 'Restaurante', date: '2026-07-20' });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('deve buscar apenas as transações de um período específico (Extrato)', async () => {
    // Buscando apenas transações de Agosto
    const response = await request(app)
      .get(`/api/reports/transactions?startDate=2026-08-01&endDate=2026-08-31`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    // Esperamos 2 transações (Mercado e Uber), ignorando a de Julho
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(2);
  });

  it('deve agrupar os gastos por categoria em um mês específico', async () => {
    const response = await request(app)
      .get(`/api/reports/category-expenses?year=2026&month=08`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    
    // Como criamos gastos nas duas categorias em agosto, o relatório deve ter 2 itens
    expect(response.body.length).toBe(2);
    
    // Verifica se os nomes das categorias vieram no agrupamento
    const categoryNames = response.body.map((item: any) => item.category_name);
    expect(categoryNames).toContain('Alimentação');
    expect(categoryNames).toContain('Transporte');
  });
});