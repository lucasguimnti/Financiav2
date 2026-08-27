import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/api/app';
import { pool } from '../src/database/index';

describe('Financial Engine API', () => {
  let token = '';
  let accountId = '';
  let categoryId = '';

  beforeAll(async () => {
    // 1. Limpeza de ambiente
    try { await pool.query('DELETE FROM transactions'); } catch(e) {}
    try { await pool.query('DELETE FROM categories'); } catch(e) {}
    try { await pool.query('DELETE FROM accounts'); } catch(e) {}
    await pool.query('DELETE FROM users');

    // 2. Setup do Usuário e Token
    await request(app).post('/api/users').send({ email: 'engine@financia.com', password: '123' });
    const loginRes = await request(app).post('/api/login').send({ email: 'engine@financia.com', password: '123' });
    token = loginRes.body.token;

    // 3. Cria uma Conta 
    const accRes = await request(app).post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Conta Principal', balance: 0 });
    accountId = accRes.body.id;

    // 4. Cria uma Categoria 
    const catRes = await request(app).post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Geral', type: 'expense', color: '#000' });
    categoryId = catRes.body.id;

    // 5. Injeta as Transações (Matemática: 1000 - 250 = 750)
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`).send({
      account_id: accountId, category_id: categoryId, amount: 1000, type: 'income', description: 'Salário', date: '2026-08-01'
    });
    
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`).send({
      account_id: accountId, category_id: categoryId, amount: 250, type: 'expense', description: 'Conta de Luz', date: '2026-08-05'
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('deve calcular o saldo seguro da conta (Receitas - Despesas)', async () => {
    // Chamamos a rota que ainda não existe, passando o ID da conta na URL
    const response = await request(app)
      .get(`/api/accounts/${accountId}/balance`)
      .set('Authorization', `Bearer ${token}`);

    // Esperamos sucesso
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('balance');
    
    // O banco costuma devolver decimais como string, então convertemos para Number
    expect(Number(response.body.balance)).toBe(750);
  });
});