import dotenv from 'dotenv';
dotenv.config(); // Carrega o .env obrigatoriamente antes de tudo

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; 
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../database/index';
import { authMiddleware, AuthRequest } from './authMiddleware';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'financia_super_secret_key_2026';

// ==========================================
// ROTA MÁGICA: SETUP DO BANCO DE DADOS
// ==========================================
app.get('/api/setup', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        UNIQUE(user_id, category_id)
      );

      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        target_amount DECIMAL(10, 2) NOT NULL,
        current_amount DECIMAL(10, 2) DEFAULT 0,
        color VARCHAR(20) DEFAULT '#3b82f6',
        deadline DATE
      );
    `);
    res.send('<h1>Tabelas de Metas criadas com sucesso no banco de dados! 🚀</h1><p>Você já pode voltar para o sistema.</p>');
  } catch (error: any) {
    console.error('🔥 ERRO NO SETUP:', error);
    res.send(`<h1>Erro ao criar tabelas:</h1> <p>${error.message}</p>`);
  }
});

// ==========================================
// USUÁRIOS, REGISTRO E LOGIN
// ==========================================

// (Mantido por compatibilidade com requisições antigas, idêntico ao /api/register)
app.post('/api/users', async (req, res) => {
  try {
    const { email, password } = req.body;
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('ERRO USERS:', error);
    if (error.code === '23505') return res.status(409).json({ error: 'Este e-mail já está em uso.' });
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Nova rota de Registro Oficial (Usada pelo frontend na página /register)
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Ajustado para inserir no Postgres usando o 'pool' e 'name'
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: 'Usuário criado com sucesso!', user: result.rows[0] });
    
  } catch (error: any) {
    console.error('Erro no registro:', error);
    if (error.code === '23505') return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    res.status(500).json({ error: 'Erro interno no servidor ao criar usuário' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) return res.status(401).json({ error: 'E-mail ou senha incorretos' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ token });
  } catch (error) {
    console.error('ERRO LOGIN:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ==========================================
// CONTAS E CATEGORIAS
// ==========================================
app.post('/api/accounts', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, balance } = req.body;
    const result = await pool.query('INSERT INTO accounts (user_id, name, balance) VALUES ($1, $2, $3) RETURNING id, name, balance', [req.userId, name, balance]);
    res.status(201).json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Erro interno' }); }
});

app.get('/api/accounts', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY name ASC', [req.userId]);
    res.status(200).json(result.rows);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Erro interno' }); }
});

app.put('/api/accounts/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, balance } = req.body;
    const result = await pool.query(`UPDATE accounts SET name = COALESCE($1, name), balance = COALESCE($2, balance) WHERE id = $3 AND user_id = $4 RETURNING *`, [name, balance, req.params.id, req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Não encontrada' });
    res.status(200).json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Erro interno' }); }
});

app.post('/api/categories', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, type, color } = req.body;
    const result = await pool.query('INSERT INTO categories (user_id, name, type, color) VALUES ($1, $2, $3, $4) RETURNING id, name, type, color', [req.userId, name, type, color]);
    res.status(201).json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Erro interno' }); }
});

app.get('/api/categories', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE user_id = $1 ORDER BY name ASC', [req.userId]);
    res.status(200).json(result.rows);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Erro interno' }); }
});

app.delete('/api/categories/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    res.status(204).send(); 
  } catch (error: any) {
    console.error(error);
    // Se o banco de dados avisar que a categoria já está sendo usada em alguma transação (código 23503)
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Esta categoria está sendo usada em um lançamento e não pode ser excluída.' });
    }
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ==========================================
// TRANSAÇÕES E REEMBOLSOS
// ==========================================
app.get('/api/transactions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(`SELECT t.*, tp.name as third_party_name, tp.color as third_party_color FROM transactions t LEFT JOIN third_parties tp ON t.third_party_id = tp.id WHERE t.user_id = $1 ORDER BY t.date DESC`, [req.userId]);
    res.json(result.rows);
  } catch (error) { console.error('ERRO TRANSACTIONS GET:', error); res.status(500).json({ error: 'Erro interno' }); }
});

// ==========================================
// ROTA: LINHA DO TEMPO (Fatos + Provisões)
// ==========================================
app.get('/api/timeline', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { month, year } = req.query; 
    
    if (!month || !year) {
      return res.status(400).json({ error: 'Parâmetros month e year são obrigatórios.' });
    }

    const m = Number(month);
    const y = Number(year);
    const lastDay = new Date(y, m, 0).getDate(); 
    
    const startOfMonth = `${y}-${String(m).padStart(2, '0')}-01`;
    const endOfMonth = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;

    const transactionsRes = await pool.query(
      `SELECT id, description, amount, type, date as due_date, is_paid, credit_card_id, 'transaction' as source
       FROM transactions
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date ASC`,
      [req.userId, startOfMonth, endOfMonth]
    );

    const subscriptionsRes = await pool.query(
      `SELECT id, description, amount, type, due_day, credit_card_id, 'subscription' as source
       FROM subscriptions
       WHERE user_id = $1 AND status = 'active'`,
      [req.userId]
    );

    const timeline = [];
    const targetMonthDateStr = `${y}-${String(m).padStart(2, '0')}`;

    transactionsRes.rows.forEach(t => {
      timeline.push({
        id: `t_${t.id}`,
        description: t.description,
        amount: Math.abs(Number(t.amount)),
        type: t.type,
        due_date: new Date(t.due_date).toISOString().split('T')[0],
        day: parseInt(new Date(t.due_date).toISOString().split('T')[0].split('-')[2], 10),
        is_paid: t.is_paid,
        credit_card_id: t.credit_card_id,
        source: t.source
      });
    });

    subscriptionsRes.rows.forEach(sub => {
      const projectedDateStr = `${targetMonthDateStr}-${String(sub.due_day).padStart(2, '0')}`;
      
      const isAlreadyMaterialized = timeline.some(item => 
         item.source === 'transaction' &&
         item.description.toLowerCase() === sub.description.toLowerCase() &&
         Number(item.amount) === Math.abs(Number(sub.amount)) &&
         item.type === sub.type
      );

      if (!isAlreadyMaterialized) {
        timeline.push({
          id: `s_${sub.id}`,
          description: `${sub.description} (Projetado)`,
          amount: Math.abs(Number(sub.amount)),
          type: sub.type,
          due_date: projectedDateStr,
          day: sub.due_day,
          is_paid: false, 
          credit_card_id: sub.credit_card_id,
          source: sub.source
        });
      }
    });

    timeline.sort((a, b) => a.day - b.day);
    res.json(timeline);

  } catch (error) {
    console.error('Erro na Timeline:', error);
    res.status(500).json({ error: 'Erro ao gerar linha do tempo.' });
  }
});

app.post('/api/transactions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { account_id, category_id, credit_card_id, installments = 1, amount, type, description, date, is_paid = true, payment_type, third_party_id } = req.body;
    const totalInstallments = Number(installments) || 1;

    if (payment_type === 'credit_card' && totalInstallments > 1) {
      const insertedTransactions = [];
      const installmentValue = parseFloat((amount / totalInstallments).toFixed(2));
      const [year, month, day] = date.split('-');

      for (let i = 0; i < totalInstallments; i++) {
        const installmentDate = new Date(parseInt(year), parseInt(month) - 1 + i, parseInt(day));
        const formattedDate = installmentDate.toISOString().split('T')[0]; 
        const installmentDesc = `${description} (${i + 1}/${totalInstallments})`;
        const result = await pool.query(
          `INSERT INTO transactions (user_id, account_id, category_id, credit_card_id, installments, installment_number, amount, type, description, date, is_paid, payment_type, third_party_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
          [req.userId, account_id || null, category_id || null, credit_card_id || null, totalInstallments, i + 1, installmentValue, type, installmentDesc, formattedDate, false, payment_type || 'account', third_party_id || null]
        );
        insertedTransactions.push(result.rows[0]);
      }
      return res.status(201).json(insertedTransactions[0]); 
    } else {
      const result = await pool.query(
        `INSERT INTO transactions (user_id, account_id, category_id, credit_card_id, installments, installment_number, amount, type, description, date, is_paid, payment_type, third_party_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
        [req.userId, account_id || null, category_id || null, credit_card_id || null, 1, 1, amount, type, description, date, is_paid, payment_type || 'account', third_party_id || null]
      );
      return res.status(201).json(result.rows[0]);
    }
  } catch (error) { console.error(error); res.status(500).json({ error: 'Erro interno' }); }
});

app.put('/api/transactions/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { account_id, category_id, credit_card_id, payment_type, amount, description, type, date, is_paid, third_party_id } = req.body;
    const result = await pool.query(
      `UPDATE transactions SET amount = COALESCE($1, amount), description = COALESCE($2, description), type = COALESCE($3, type), date = COALESCE($4, date), account_id = $5, category_id = $6, is_paid = COALESCE($7, is_paid), credit_card_id = $8, payment_type = COALESCE($9, payment_type), third_party_id = $10 WHERE id = $11 AND user_id = $12 RETURNING *`,
      [amount, description, type, date, account_id || null, category_id || null, is_paid, credit_card_id || null, payment_type, third_party_id || null, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Não encontrada' });
    res.status(200).json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Erro interno' }); }
});

app.delete('/api/transactions/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Não encontrada' });
    res.status(204).send(); 
  } catch (error) { console.error(error); res.status(500).json({ error: 'Erro interno' }); }
});

app.put('/api/transactions/:id/reimburse', authMiddleware, async (req: AuthRequest, res) => {
  const { is_reimbursed, account_id, date } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updateRes = await client.query(`UPDATE transactions SET is_reimbursed = $1 WHERE id = $2 AND user_id = $3 RETURNING *`, [is_reimbursed, req.params.id, req.userId]);
    if (updateRes.rows.length === 0) throw new Error('Não encontrada');
    const originalTransaction = updateRes.rows[0];
    if (is_reimbursed && account_id) {
      const tpRes = await client.query('SELECT name FROM third_parties WHERE id = $1', [originalTransaction.third_party_id]);
      const tpName = tpRes.rows[0]?.name || 'Terceiro';
      await client.query(`INSERT INTO transactions (user_id, account_id, amount, type, description, date, is_paid, payment_type) VALUES ($1, $2, $3, 'income', $4, $5, true, 'account')`, [req.userId, account_id, Math.abs(Number(originalTransaction.amount)), `Reembolso - ${tpName} (Ref: ${originalTransaction.description})`, date]);
    }
    await client.query('COMMIT');
    res.status(200).json(originalTransaction);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally { client.release(); }
});

// ==========================================
// ROTAS DE ASSINATURAS E CONTAS FIXAS
// ==========================================
app.get('/api/subscriptions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY status ASC, due_day ASC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar assinaturas.' });
  }
});

app.post('/api/subscriptions', authMiddleware, async (req: AuthRequest, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { description, amount, type, category_id, account_id, credit_card_id, frequency, due_day, start_date } = req.body;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthKey = `${currentYear}-${currentMonth}`;

    const subResult = await client.query(
      `INSERT INTO subscriptions (user_id, description, amount, type, category_id, account_id, credit_card_id, frequency, due_day, start_date, status, last_processed_month)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', $11) RETURNING *`,
      [req.userId, description, amount, type, category_id, account_id || null, credit_card_id || null, frequency || 'monthly', due_day, start_date, currentMonthKey]
    );
    const newSub = subResult.rows[0];

    const dueDateStr = `${currentYear}-${currentMonth}-${String(due_day).padStart(2, '0')}`;
    
    await client.query(
      `INSERT INTO transactions (user_id, account_id, credit_card_id, category_id, amount, date, description, type, is_paid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)`,
      [
        req.userId, 
        account_id || null, 
        credit_card_id || null, 
        category_id, 
        type === 'expense' ? -Math.abs(amount) : Math.abs(amount), 
        dueDateStr, 
        description, 
        type
      ]
    );

    await client.query('COMMIT');
    res.json(newSub);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({ error: 'Erro ao criar assinatura e projetar transação.' });
  } finally {
    client.release();
  }
});

app.put('/api/subscriptions/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { description, amount, category_id, account_id, credit_card_id, due_day, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE subscriptions 
       SET description = COALESCE($1, description), amount = COALESCE($2, amount), category_id = COALESCE($3, category_id), 
           account_id = $4, credit_card_id = $5, due_day = COALESCE($6, due_day), status = COALESCE($7, status)
       WHERE id = $8 AND user_id = $9 RETURNING *`,
      [description, amount, category_id, account_id || null, credit_card_id || null, due_day, status, id, req.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar assinatura.' });
  }
});

app.delete('/api/subscriptions/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await pool.query('DELETE FROM subscriptions WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir assinatura.' });
  }
});

// ==========================================
// TERCEIROS E CARTÕES DE CRÉDITO
// ==========================================
app.get('/api/third-parties', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(`SELECT tp.*, COALESCE((SELECT SUM(ABS(amount)) FROM transactions t WHERE t.third_party_id = tp.id AND t.is_reimbursed = false), 0) AS total_pending FROM third_parties tp WHERE tp.user_id = $1 ORDER BY tp.name ASC`, [req.userId]);
    res.status(200).json(result.rows);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Erro interno' }); }
});

app.post('/api/third-parties', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(`INSERT INTO third_parties (user_id, name, color) VALUES ($1, $2, $3) RETURNING *`, [req.userId, req.body.name, req.body.color || '#3b82f6']);
    res.status(201).json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Erro interno' }); }
});

app.delete('/api/third-parties/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await pool.query('DELETE FROM third_parties WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.status(200).json({ message: 'Deletado' });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Erro interno' }); }
});

app.post('/api/credit-cards', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, limit_amount, closing_day, due_day, color } = req.body;
    const result = await pool.query(`INSERT INTO credit_cards (user_id, name, limit_amount, closing_day, due_day, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [req.userId, name, limit_amount, closing_day, due_day, color]);
    res.status(201).json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Erro interno' }); }
});

app.get('/api/credit-cards', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT * FROM credit_cards WHERE user_id = $1 ORDER BY name ASC', [req.userId]);
    res.status(200).json(result.rows);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Erro interno' }); }
});

app.get('/api/credit-cards/:id/invoices/:year/:month', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id, year, month } = req.params;
    const result = await pool.query(`SELECT t.*, tp.name as third_party_name, tp.color as third_party_color FROM transactions t LEFT JOIN third_parties tp ON t.third_party_id = tp.id WHERE t.credit_card_id = $1 AND t.user_id = $2 AND EXTRACT(YEAR FROM t.date) = $3 AND EXTRACT(MONTH FROM t.date) = $4 ORDER BY t.date ASC`, [id, req.userId, year, month]);
    const totalAmount = result.rows.reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);
    const isPaid = result.rows.length > 0 && result.rows.every(t => t.is_paid);
    res.json({ month, year, total: totalAmount, is_paid: isPaid, transactions: result.rows });
  } catch (error: any) { console.error(error); res.status(500).json({ error: 'Erro' }); }
});

app.post('/api/credit-cards/:id/invoices/pay', authMiddleware, async (req: AuthRequest, res) => {
  const { year, month, account_id } = req.body;
  const client = await pool.connect(); 
  try {
    await client.query('BEGIN');
    const invoiceRes = await client.query(`SELECT SUM(ABS(amount)) as total FROM transactions WHERE credit_card_id = $1 AND user_id = $2 AND EXTRACT(YEAR FROM date) = $3 AND EXTRACT(MONTH FROM date) = $4 AND is_paid = false`, [req.params.id, req.userId, year, month]);
    const totalAmount = invoiceRes.rows[0].total || 0;
    if (totalAmount === 0) throw new Error('Não há valor pendente.');
    const cardRes = await client.query('SELECT name FROM credit_cards WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    await client.query(`INSERT INTO transactions (user_id, description, amount, type, date, account_id, payment_type, is_paid) VALUES ($1, $2, $3, 'expense', CURRENT_DATE, $4, 'account', true)`, [req.userId, `Pagamento Fatura - ${cardRes.rows[0]?.name || 'Cartão'} (${month}/${year})`, -totalAmount, account_id]);
    await client.query(`UPDATE transactions SET is_paid = true WHERE credit_card_id = $1 AND user_id = $2 AND EXTRACT(YEAR FROM date) = $3 AND EXTRACT(MONTH FROM date) = $4`, [req.params.id, req.userId, year, month]);
    await client.query('COMMIT');
    res.json({ message: 'Fatura paga!' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(400).json({ error: error.message });
  } finally { client.release(); }
});

// ==========================================
// METAS E ORÇAMENTOS 
// ==========================================
app.get('/api/budgets', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(`SELECT b.*, c.name as category_name, c.color as category_color FROM budgets b JOIN categories c ON b.category_id = c.id WHERE b.user_id = $1 ORDER BY c.name ASC`, [req.userId]);
    res.json(result.rows);
  } catch (error) { console.error('🔥 ERRO BUDGETS GET:', error); res.status(500).json({ error: 'Erro interno' }); }
});

app.post('/api/budgets', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { category_id, amount } = req.body;
    const result = await pool.query(`INSERT INTO budgets (user_id, category_id, amount) VALUES ($1, $2, $3) ON CONFLICT (user_id, category_id) DO UPDATE SET amount = $3 RETURNING *`, [req.userId, category_id, amount]);
    res.status(201).json(result.rows[0]);
  } catch (error) { console.error('🔥 ERRO BUDGETS POST:', error); res.status(500).json({ error: 'Erro interno' }); }
});

app.delete('/api/budgets/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await pool.query('DELETE FROM budgets WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.status(204).send();
  } catch (error) { console.error('🔥 ERRO BUDGETS DELETE:', error); res.status(500).json({ error: 'Erro interno' }); }
});

app.get('/api/goals', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY deadline ASC', [req.userId]);
    res.json(result.rows);
  } catch (error) { console.error('🔥 ERRO GOALS GET:', error); res.status(500).json({ error: 'Erro interno' }); }
});

app.post('/api/goals', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, target_amount, color, deadline } = req.body;
    const result = await pool.query(`INSERT INTO goals (user_id, name, target_amount, color, deadline) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [req.userId, name, target_amount, color || '#3b82f6', deadline || null]);
    res.status(201).json(result.rows[0]);
  } catch (error) { console.error('🔥 ERRO GOALS POST:', error); res.status(500).json({ error: 'Erro interno' }); }
});

app.put('/api/goals/:id/add', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { amount } = req.body;
    const result = await pool.query(
      `UPDATE goals 
       SET current_amount = current_amount + $1 
       WHERE id = $2 AND user_id = $3 
       RETURNING *`,
      [amount, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) { 
    console.error('🔥 ERRO AO MOVIMENTAR SALDO DA META:', error); 
    res.status(500).json({ error: 'Erro interno' }); 
  }
});

app.delete('/api/goals/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await pool.query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.status(204).send();
  } catch (error) { console.error('🔥 ERRO GOALS DELETE:', error); res.status(500).json({ error: 'Erro interno' }); }
});

// ==========================================
// ROTA DE IMPORTAÇÃO EM MASSA (Bulk Import)
// ==========================================
app.post('/api/transactions/bulk', authMiddleware, async (req: AuthRequest, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Nenhuma transação enviada no arquivo.' });
    }

    const errors: string[] = [];
    let successCount = 0;

    const accounts = (await client.query('SELECT id, name FROM accounts WHERE user_id = $1', [req.userId])).rows;
    const cards = (await client.query('SELECT id, name FROM credit_cards WHERE user_id = $1', [req.userId])).rows;
    let categories = (await client.query('SELECT id, name, type FROM categories WHERE user_id = $1', [req.userId])).rows;
    let thirdParties = (await client.query('SELECT id, name FROM third_parties WHERE user_id = $1', [req.userId])).rows;

    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      const rowNum = i + 2;

      if (!t.data || !t.tipo || !t.descricao || !t.valor || !t.categoria || !t.meio_pagamento || !t.origem) {
        errors.push(`Linha ${rowNum}: Faltam campos obrigatórios.`);
        continue;
      }

      const type = t.tipo.toLowerCase().trim() === 'receita' ? 'income' : 'expense';

      const dateParts = t.data.split('/');
      if (dateParts.length !== 3) {
        errors.push(`Linha ${rowNum}: Data inválida "${t.data}". Use DD/MM/AAAA.`);
        continue;
      }
      const isoDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;

// ==========================================
      // NOVA BLINDAGEM ABSOLUTA DE VALORES
      // ==========================================
      let rawValue = String(t.valor);
      
      // 1. Pega apenas a parte numérica (ignora R$, espaços, e sinais de menos do Excel)
      const matches = rawValue.match(/[\d.,]+/);
      
      if (!matches) {
        errors.push(`Linha ${rowNum}: Valor não reconhecido ("${t.valor}").`);
        continue;
      }

      let numericString = matches[0];

      // 2. Resolve o problema de milhar e decimal (Padrão BR)
      // Se tiver ponto E vírgula (ex: 1.500,00), remove o ponto e troca vírgula por ponto
      if (numericString.includes('.') && numericString.includes(',')) {
        numericString = numericString.replace(/\./g, '').replace(',', '.');
      } 
      // Se tiver só vírgula (ex: 150,00), troca por ponto
      else if (numericString.includes(',')) {
        numericString = numericString.replace(',', '.');
      }
      
      let amount = parseFloat(numericString);

      // 3. Verifica se não é zero absoluto
      if (isNaN(amount) || amount === 0) {
        errors.push(`Linha ${rowNum}: O valor não pode ser zero ("${t.valor}").`);
        continue;
      }

      // 4. A mágica final: O sinal quem dita é a coluna "Tipo", ignorando a formatação do Excel!
      if (type === 'expense') {
        amount = -Math.abs(amount); // Força a ser Despesa (negativo)
      } else {
        amount = Math.abs(amount);  // Força a ser Receita (positivo)
      }
      // ==========================================

      const catName = t.categoria.trim();
      let category = categories.find(c => c.name.toLowerCase() === catName.toLowerCase() && c.type === type);
      if (!category) {
        const newCat = await client.query(
          'INSERT INTO categories (user_id, name, type, color, icon) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [req.userId, catName, type, '#94a3b8', 'tag']
        );
        category = newCat.rows[0];
        categories.push(category);
      }

      const paymentMethod = t.meio_pagamento.trim().toLowerCase();
      const originName = t.origem.trim().toLowerCase();
      const installments = parseInt(t.parcelas) || 1;
      
      let matchedAccount = null;
      let matchedCard = null;

      if (paymentMethod === 'conta / dinheiro') {
        if (installments > 1) {
          errors.push(`Linha ${rowNum}: Transações em "Conta / Dinheiro" não podem ser parceladas.`);
          continue;
        }
        matchedAccount = accounts.find(a => a.name.toLowerCase() === originName);
        if (!matchedAccount) {
          errors.push(`Linha ${rowNum}: Conta "${t.origem}" não encontrada.`);
          continue;
        }
      } else if (paymentMethod === 'cartão de crédito') {
        matchedCard = cards.find(c => c.name.toLowerCase() === originName);
        if (!matchedCard) {
          errors.push(`Linha ${rowNum}: Cartão de Crédito "${t.origem}" não encontrado.`);
          continue;
        }
      } else {
        errors.push(`Linha ${rowNum}: Meio de Pagamento "${t.meio_pagamento}" inválido.`);
        continue;
      }

      let thirdPartyId = null;
      if (t.terceiro && t.terceiro.trim() !== '' && t.terceiro.trim().toLowerCase() !== 'nenhum') {
        const tpName = t.terceiro.trim();
        let matchedTp = thirdParties.find(tp => tp.name.toLowerCase() === tpName.toLowerCase());
        if (!matchedTp) {
          const newTp = await client.query(
            'INSERT INTO third_parties (user_id, name, color) VALUES ($1, $2, $3) RETURNING *',
            [req.userId, tpName, '#f59e0b']
          );
          matchedTp = newTp.rows[0];
          thirdParties.push(matchedTp);
        }
        thirdPartyId = matchedTp.id;
      }

      const isPaid = t.status?.toLowerCase().trim() === 'pago';

      if (installments > 1 && type === 'expense' && matchedCard) {
        const instAmount = amount / installments;
        for (let inst = 1; inst <= installments; inst++) {
          const instDate = new Date(isoDate);
          instDate.setMonth(instDate.getMonth() + (inst - 1));
          const instDateStr = instDate.toISOString().split('T')[0];
          const instDesc = `${t.descricao.trim()} (${inst}/${installments})`;
          
          await client.query(
            `INSERT INTO transactions (user_id, account_id, credit_card_id, category_id, amount, date, description, type, is_paid, third_party_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [req.userId, null, matchedCard.id, category.id, instAmount, instDateStr, instDesc, type, isPaid, thirdPartyId]
          );
          successCount++;
        }
      } else {
        await client.query(
          `INSERT INTO transactions (user_id, account_id, credit_card_id, category_id, amount, date, description, type, is_paid, third_party_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [req.userId, matchedAccount ? matchedAccount.id : null, matchedCard ? matchedCard.id : null, category.id, amount, isoDate, t.descricao.trim(), type, isPaid, thirdPartyId]
        );
        successCount++;
      }
    }

    if (errors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Importação cancelada devido a divergências.', details: errors });
    }

    await client.query('COMMIT');
    res.json({ success: true, message: `${successCount} transações importadas com sucesso!` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('🔥 ERRO NO BULK IMPORT:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao processar o arquivo.' });
  } finally {
    client.release();
  }
});

// ==========================================
// ROTA: ANALYTICS E RELATÓRIOS
// ==========================================
app.get('/api/analytics', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { month, year } = req.query;

    const historyRes = await pool.query(
      `SELECT 
         to_char(date, 'YYYY-MM') as month_raw,
         SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
         SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as expense
       FROM transactions
       WHERE user_id = $1 AND date >= date_trunc('month', current_date - interval '5 months')
       GROUP BY to_char(date, 'YYYY-MM')
       ORDER BY month_raw ASC`,
      [req.userId]
    );

    const history = historyRes.rows.map(r => {
      const [y, m] = r.month_raw.split('-');
      const date = new Date(Number(y), Number(m) - 1);
      return {
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''),
        income: Number(r.income),
        expense: Number(r.expense)
      };
    });

    let catQuery = `
      SELECT 
        c.name, 
        c.color,
        SUM(ABS(t.amount)) as value
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND t.type = 'expense'
    `;
    const params: any[] = [req.userId];
    
    if (month && year) {
      catQuery += ` AND EXTRACT(MONTH FROM t.date) = $2 AND EXTRACT(YEAR FROM t.date) = $3`;
      params.push(month, year);
    } else {
      catQuery += ` AND EXTRACT(MONTH FROM t.date) = EXTRACT(MONTH FROM current_date) AND EXTRACT(YEAR FROM t.date) = EXTRACT(YEAR FROM current_date)`;
    }
    
    catQuery += ` GROUP BY c.name, c.color ORDER BY value DESC`;
    const categoryRes = await pool.query(catQuery, params);

    res.json({
      history,
      categories: categoryRes.rows.map(r => ({ ...r, value: Number(r.value) }))
    });
  } catch (error) {
    console.error('Erro no Analytics:', error);
    res.status(500).json({ error: 'Erro ao gerar relatórios.' });
  }
});

// ==========================================
// ROTA: IA INSIGHTS (Motor Comportamental Nativo)
// ==========================================
app.get('/api/ai-insights', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { month, year } = req.query;

    const [incomeRes, expenseRes, catRes] = await Promise.all([
      pool.query(`SELECT SUM(amount) as val FROM transactions WHERE user_id = $1 AND type = 'income' AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`, [req.userId, month, year]),
      pool.query(`SELECT SUM(ABS(amount)) as val FROM transactions WHERE user_id = $1 AND type = 'expense' AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`, [req.userId, month, year]),
      pool.query(`SELECT c.name, SUM(ABS(t.amount)) as val FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.user_id = $1 AND t.type = 'expense' AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3 GROUP BY c.name ORDER BY val DESC LIMIT 3`, [req.userId, month, year])
    ]);

    const income = Number(incomeRes.rows[0]?.val || 0);
    const expense = Number(expenseRes.rows[0]?.val || 0);
    const saldoLivre = income - expense;
    const taxaPoupanca = income > 0 ? ((saldoLivre / income) * 100) : 0;
    const topCategory = catRes.rows[0] ? catRes.rows[0].name : 'Despesas Gerais';
    const topCategoryVal = catRes.rows[0] ? Number(catRes.rows[0].val) : 0;

    let aiHtmlResponse = "";

    if (income === 0 && expense === 0) {
      aiHtmlResponse = `
        <p><strong>Painel limpo para recomeçar!</strong> ✨ O mês está começando agora e nenhuma movimentação foi registrada ainda. Mantenha a calma e registre suas primeiras entradas ou deixe suas assinaturas guiarem o fluxo.</p>
        <p><strong>Micro-Ação:</strong> Cadastre sua principal fonte de renda ou verifique se suas contas fixas estão alinhadas na Agenda Financeira.</p>
      `;
    } else if (saldoLivre >= 0) {
      aiHtmlResponse = `
        <p><strong>Parabéns pela disciplina!</strong> 🎯 Você fechou o ciclo no verde com um respiro de <strong>R$ ${saldoLivre.toFixed(2)}</strong> e taxa de poupança de <strong>${taxaPoupanca.toFixed(1)}%</strong>. Seu maior foco de consumo foi em <strong>${topCategory}</strong> (R$ ${topCategoryVal.toFixed(2)}).</p>
        <p>Dinheiro sob controle traz paz mental. Considere direcionar parte desse respiro para acelerar suas metas de longo prazo ou aproveitar o presente sem culpa.</p>
        <p><strong>Micro-Ação:</strong> Reserve 10% do seu saldo livre atual para um aporte direto em um dos seus cofrinhos amanhã.</p>
      `;
    } else {
      aiHtmlResponse = `
        <p><strong>O mês apertou, mas o controle é recuperável.</strong> 💡 Suas despesas superaram as receitas em <strong>R$ ${Math.abs(saldoLivre).toFixed(2)}</strong>, impulsionadas principalmente por gastos em <strong>${topCategory}</strong>.</p>
        <p>Não se culpe por desvios de rota, imprevistos acontecem. O segredo da inteligência financeira não é nunca errar, mas sim ajustar os ponteiros rápido antes que vire bola de neve.</p>
        <p><strong>Micro-Ação:</strong> Olhe atentamente para os próximos 7 dias na sua Agenda Financeira e evite qualquer compra não essencial até o próximo ciclo.</p>
      `;
    }

    res.json({ insight: aiHtmlResponse });

  } catch (error) {
    console.error('Erro no motor nativo de insights:', error);
    res.status(500).json({ error: 'Erro ao processar consultoria.' });
  }
});

export default app;