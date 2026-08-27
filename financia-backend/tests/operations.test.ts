import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/api/app';
import { pool } from '../src/database/index';

describe('Operations API (Update & Delete)', () => {
  let token = '';
  let transactionId = '';

  beforeAll(async () => {
    // 1. Limpeza
    try { await pool.query('DELETE FROM transactions'); } catch(e) {}
    try { await pool.query('DELETE FROM categories'); } catch(e) {}
    try { await pool.query('DELETE FROM accounts'); } catch(e) {}
    await pool.query('DELETE FROM users');

    // 2. Setup
    await request(app).post('/api/users').send({ email: 'crud@financia.com', password: '123' });
    const loginRes = await request(app).post('/api/login').send({ email: 'crud@financia.com', password: '123' });
    token = loginRes.body.token;

    const accRes = await request(app).post('/api/accounts').set('Authorization', `Bearer ${token}`).send({ name: 'Carteira', balance: 0 });
    const catRes = await request(app).post('/api/categories').set('Authorization', `Bearer ${token}`).send({ name: 'Lazer', type: 'expense', color: '#000' });

    // 3. Criamos uma transação e guardamos o ID dela
    const transRes = await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
      .send({ account_id: accRes.body.id, category_id: catRes.body.id, amount: 50, type: 'expense', description: 'Cinema', date: '2026-08-20' });
    
    transactionId = transRes.body.id; // ID salvo para usarmos nos testes abaixo!
  });

  afterAll(async () => {
    await pool.end();
  });

  it('deve atualizar o valor e a descrição de uma transação existente', async () => {
    // Usamos o verbo PUT para atualização
    const response = await request(app)
      .put(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 85.50,
        description: 'Cinema 3D + Pipoca'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('description', 'Cinema 3D + Pipoca');
    expect(Number(response.body.amount)).toBe(85.50);
  });

  it('deve deletar a transação com sucesso', async () => {
    // Usamos o verbo DELETE
    const response = await request(app)
      .delete(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`);

    // Esperamos 204 (No Content), que é o padrão HTTP para uma exclusão bem-sucedida sem retorno de corpo
    expect(response.status).toBe(204);
    
    // Garantimos que ela realmente sumiu tentando deletar de novo (deve dar erro 404)
    const deleteAgain = await request(app)
      .delete(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`);
      
    expect(deleteAgain.status).toBe(404);
  });
});