import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/api/app';
import { pool } from '../src/database/index';

describe('Transactions API', () => {
  let token = '';
  let accountId = '';
  let categoryId = '';

  beforeAll(async () => {
    // 1. Limpa tudo (do filho para o pai para respeitar as Foreign Keys)
    try { await pool.query('DELETE FROM transactions'); } catch(e) {}
    try { await pool.query('DELETE FROM categories'); } catch(e) {}
    try { await pool.query('DELETE FROM accounts'); } catch(e) {}
    await pool.query('DELETE FROM users');

    // 2. Cria usuário e faz login
    await request(app).post('/api/users').send({ email: 'teste_transacao@financia.com', password: '123' });
    const loginRes = await request(app).post('/api/login').send({ email: 'teste_transacao@financia.com', password: '123' });
    token = loginRes.body.token;

    // 3. Cria uma Conta e guarda o ID
    const accRes = await request(app).post('/api/accounts').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Carteira', balance: 100 });
    accountId = accRes.body.id;

    // 4. Cria uma Categoria e guarda o ID
    const catRes = await request(app).post('/api/categories').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Supermercado', type: 'expense', color: '#000' });
    categoryId = catRes.body.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('deve criar uma nova transação com sucesso', async () => {
    const response = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        account_id: accountId,
        category_id: categoryId,
        amount: 50.25,
        type: 'expense',
        description: 'Compra no mercado',
        date: '2026-08-23'
      });

    // Esperamos que a transação seja criada (201)
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('amount', '50.25'); // Valores decimais no Postgres costumam voltar como string
    expect(response.body).toHaveProperty('description', 'Compra no mercado');
  });

  it('não deve permitir transação sem token', async () => {
    const response = await request(app)
      .post('/api/transactions')
      .send({ amount: 100, type: 'income' });

    expect(response.status).toBe(401);
  });
});