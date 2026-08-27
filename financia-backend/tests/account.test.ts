import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/api/app';
import { pool } from '../src/database/index';

describe('Accounts API', () => {
  let token = '';

  beforeAll(async () => {
    // 1. Limpa as tabelas (A ordem importa por causa das regras do banco)
    // Se a tabela 'accounts' ainda não existir, o teste vai nos avisar na Fase Green
    try {
      await pool.query('DELETE FROM accounts');
    } catch (e) {
      // Ignora erro se a tabela ainda não existir no banco de dados local
    }
    await pool.query('DELETE FROM users');
    
    // 2. Cria um usuário de teste
    await request(app)
      .post('/api/users')
      .send({ email: 'teste_conta@financia.com', password: 'senha123' });

    // 3. Faz o login para capturar o Token JWT
    const loginRes = await request(app)
      .post('/api/login')
      .send({ email: 'teste_conta@financia.com', password: 'senha123' });

    token = loginRes.body.token; // Guardamos o token aqui!
  });

  afterAll(async () => {
    await pool.end();
  });

  it('deve criar uma conta bancária com um token válido', async () => {
    const response = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${token}`) // Enviando a chave de acesso!
      .send({
        name: 'Conta Corrente Principal',
        balance: 1500.00
      });

    // Esperamos um 201 (Created)
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'Conta Corrente Principal');
  });

  it('deve bloquear a criação de conta sem token de acesso', async () => {
    const response = await request(app)
      .post('/api/accounts')
      // Note que NÃO enviamos o .set('Authorization'...) aqui
      .send({
        name: 'Conta Fantasma',
        balance: 50000.00
      });

    // Esperamos um 401 (Não Autorizado)
    expect(response.status).toBe(401);
  });
});