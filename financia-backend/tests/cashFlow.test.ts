import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/api/app';
import { pool } from '../src/database/index';

describe('Cash Flow Forecast API', () => {
  let token = '';
  let accountId = '';
  let categoryId = '';

  beforeAll(async () => {
    // 1. Limpeza
    try { await pool.query('DELETE FROM transactions'); } catch(e) {}
    try { await pool.query('DELETE FROM categories'); } catch(e) {}
    try { await pool.query('DELETE FROM accounts'); } catch(e) {}
    await pool.query('DELETE FROM users');

    // 2. Setup
    await request(app).post('/api/users').send({ email: 'fluxo@financia.com', password: '123' });
    const loginRes = await request(app).post('/api/login').send({ email: 'fluxo@financia.com', password: '123' });
    token = loginRes.body.token;

    const accRes = await request(app).post('/api/accounts').set('Authorization', `Bearer ${token}`).send({ name: 'Conta Corrente', balance: 0 });
    accountId = accRes.body.id;

    const catRes = await request(app).post('/api/categories').set('Authorization', `Bearer ${token}`).send({ name: 'Geral', type: 'expense', color: '#000' });
    categoryId = catRes.body.id;

    // 3. Transações de AGOSTO/2026
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
      .send({ account_id: accountId, category_id: categoryId, amount: 3000, type: 'income', description: 'Salário', date: '2026-08-05' });
    
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
      .send({ account_id: accountId, category_id: categoryId, amount: 800, type: 'expense', description: 'Aluguel', date: '2026-08-10' });

    // 4. A PEGADINHA: Transação de SETEMBRO/2026 (Não deve entrar no cálculo de Agosto!)
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
      .send({ account_id: accountId, category_id: categoryId, amount: 5000, type: 'income', description: 'Bônus', date: '2026-09-01' });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('deve retornar a projeção de fluxo de caixa apenas para o mês solicitado', async () => {
    // Chamamos a rota passando ano e mês na URL (Query Parameters)
    const response = await request(app)
      .get(`/api/accounts/${accountId}/cash-flow?year=2026&month=08`) 
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_income');
    expect(response.body).toHaveProperty('total_expense');
    expect(response.body).toHaveProperty('projected_balance');

    // A matemática de Agosto: 3000 (Receita) - 800 (Despesa) = 2200 de saldo projetado.
    // Os 5000 de Setembro DEVEM ser ignorados.
    expect(Number(response.body.total_income)).toBe(3000);
    expect(Number(response.body.total_expense)).toBe(800);
    expect(Number(response.body.projected_balance)).toBe(2200);
  });
});