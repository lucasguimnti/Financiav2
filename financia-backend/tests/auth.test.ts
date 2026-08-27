import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/api/app';
import { pool } from '../src/database/index';
import bcrypt from 'bcrypt';

describe('Authentication API', () => {
  beforeAll(async () => {
    // 1. Limpa a base
    await pool.query('DELETE FROM users');
    
    // 2. Cria um usuário "injetado" direto no banco para testarmos o login
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('senhaDeAcesso123', saltRounds);
    await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
      ['login@financia.com', passwordHash]
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it('deve fazer login com sucesso e retornar um token JWT', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        email: 'login@financia.com',
        password: 'senhaDeAcesso123' // A senha correta
      });

    // Esperamos que o login dê certo (200 OK)
    expect(response.status).toBe(200);
    
    // O servidor DEVE nos devolver um token
    expect(response.body).toHaveProperty('token');
  });

  it('deve bloquear o login com senha incorreta', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        email: 'login@financia.com',
        password: 'senhaErrada'
      });

    // Esperamos um erro 401 (Unauthorized - Não autorizado)
    expect(response.status).toBe(401);
  });
});