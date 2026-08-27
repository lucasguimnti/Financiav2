import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/api/app';
import { pool } from '../src/database/index';

describe('Categories API', () => {
  let token = '';

  beforeAll(async () => {
    // 1. Limpa as tabelas (ignorando erro se a tabela ainda não existir)
    try {
      await pool.query('DELETE FROM categories');
    } catch (e) {}
    
    // Precisamos limpar os usuários também para evitar conflito de e-mail
    await pool.query('DELETE FROM users');
    
    // 2. Cria o usuário e pega o token
    await request(app)
      .post('/api/users')
      .send({ email: 'teste_categoria@financia.com', password: 'senha123' });

    const loginRes = await request(app)
      .post('/api/login')
      .send({ email: 'teste_categoria@financia.com', password: 'senha123' });

    token = loginRes.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('deve criar uma nova categoria com um token válido', async () => {
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Alimentação',
        type: 'expense', // Pode ser 'expense' (despesa) ou 'income' (receita)
        color: '#FF5733' // Uma cor em hexadecimal para ficar bonito no Frontend depois!
      });

    // Esperamos que crie com sucesso
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'Alimentação');
    expect(response.body).toHaveProperty('type', 'expense');
  });

  it('não deve permitir a criação de categoria sem o token', async () => {
    const response = await request(app)
      .post('/api/categories')
      .send({
        name: 'Invasão',
        type: 'income'
      });

    // O nosso Middleware de segurança deve barrar com 401
    expect(response.status).toBe(401);
  });
});