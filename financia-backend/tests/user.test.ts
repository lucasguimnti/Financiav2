import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/api/app';
import { pool } from '../src/database/index';

describe('User Module API', () => {
  // Limpa a tabela antes dos testes
  beforeAll(async () => {
    await pool.query('DELETE FROM users');
  });

  afterAll(async () => {
    await pool.end();
  });

  it('deve criar um novo usuário com sucesso e NÃO retornar a senha', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'teste@financia.com',
        password: 'senhaSegura123'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).not.toHaveProperty('password_hash');
  });

  it('não deve permitir a criação de um usuário com e-mail duplicado', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'teste@financia.com',
        password: 'outrasenha456'
      });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error');
  });
});