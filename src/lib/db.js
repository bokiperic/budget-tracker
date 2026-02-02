/**
 * Database utility module for Budget Tracker
 * Uses Tauri's SQL plugin with SQLite
 */

import Database from '@tauri-apps/plugin-sql';

let db = null;

/**
 * Initialize the SQLite database and create tables if they don't exist
 */
export async function initDatabase() {
  // Connect to SQLite database (creates file if it doesn't exist)
  db = await Database.load('sqlite:budget_tracker.db');

  // Create tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'both')),
      icon TEXT,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'credit_payment')),
      amount REAL NOT NULL,
      description TEXT,
      category_id INTEGER,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS credit_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      last_four_digits TEXT,
      credit_limit REAL,
      billing_day INTEGER,
      due_day INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS credit_card_statements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credit_card_id INTEGER NOT NULL,
      statement_date DATE NOT NULL,
      due_date DATE NOT NULL,
      total_amount REAL NOT NULL,
      minimum_payment REAL,
      paid_amount REAL DEFAULT 0,
      is_paid INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS monthly_budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      income_target REAL,
      expense_limit REAL,
      savings_target_percent REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(month)
    )
  `);

  // Insert default categories if none exist
  const categories = await db.select('SELECT COUNT(*) as count FROM categories');
  if (categories[0].count === 0) {
    await seedDefaultCategories();
  }

  console.log('Database initialized successfully');
  return db;
}

/**
 * Seed default categories
 */
async function seedDefaultCategories() {
  const defaultCategories = [
    { name: 'Salary', type: 'income', icon: '💼', color: '#10b981' },
    { name: 'Freelance', type: 'income', icon: '💻', color: '#06b6d4' },
    { name: 'Investments', type: 'income', icon: '📈', color: '#8b5cf6' },
    { name: 'Other Income', type: 'income', icon: '💵', color: '#22c55e' },
    { name: 'Food & Dining', type: 'expense', icon: '🍽️', color: '#f59e0b' },
    { name: 'Transportation', type: 'expense', icon: '🚗', color: '#3b82f6' },
    { name: 'Utilities', type: 'expense', icon: '💡', color: '#eab308' },
    { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#ec4899' },
    { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#f43f5e' },
    { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#14b8a6' },
    { name: 'Housing', type: 'expense', icon: '🏠', color: '#6366f1' },
    { name: 'Education', type: 'expense', icon: '📚', color: '#a855f7' },
    { name: 'Credit Card', type: 'expense', icon: '💳', color: '#ef4444' },
    { name: 'Other Expense', type: 'expense', icon: '📦', color: '#64748b' },
  ];

  for (const cat of defaultCategories) {
    await db.execute(
      'INSERT INTO categories (name, type, icon, color) VALUES ($1, $2, $3, $4)',
      [cat.name, cat.type, cat.icon, cat.color]
    );
  }
}

/**
 * Check if database is ready
 */
export function isReady() {
  return db !== null;
}

/**
 * Get database instance
 */
export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// ============================================================================
// Transaction Operations
// ============================================================================

export async function addTransaction(type, amount, description, categoryId, date = null) {
  const database = getDb();
  const result = await database.execute(
    `INSERT INTO transactions (type, amount, description, category_id, date) 
     VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE))`,
    [type, amount, description, categoryId, date]
  );
  return result.lastInsertId;
}

export async function getTransactions(limit = 50, offset = 0) {
  const database = getDb();
  return await database.select(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     ORDER BY t.date DESC, t.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
}

export async function getTransactionsByMonth(yearMonth) {
  const database = getDb();
  return await database.select(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE strftime('%Y-%m', t.date) = $1
     ORDER BY t.date DESC, t.created_at DESC`,
    [yearMonth]
  );
}

export async function deleteTransaction(id) {
  const database = getDb();
  await database.execute('DELETE FROM transactions WHERE id = $1', [id]);
}

// ============================================================================
// Category Operations
// ============================================================================

export async function getCategories(type = null) {
  const database = getDb();
  if (type) {
    return await database.select(
      'SELECT * FROM categories WHERE type = $1 OR type = "both" ORDER BY name',
      [type]
    );
  }
  return await database.select('SELECT * FROM categories ORDER BY type, name');
}

export async function addCategory(name, type, icon = null, color = null) {
  const database = getDb();
  const result = await database.execute(
    'INSERT INTO categories (name, type, icon, color) VALUES ($1, $2, $3, $4)',
    [name, type, icon, color]
  );
  return result.lastInsertId;
}

// ============================================================================
// Statistics & Calculations
// ============================================================================

export async function getMonthlyStats(yearMonth) {
  const database = getDb();
  
  const income = await database.select(
    `SELECT COALESCE(SUM(amount), 0) as total 
     FROM transactions 
     WHERE type = 'income' AND strftime('%Y-%m', date) = $1`,
    [yearMonth]
  );

  const expenses = await database.select(
    `SELECT COALESCE(SUM(amount), 0) as total 
     FROM transactions 
     WHERE type = 'expense' AND strftime('%Y-%m', date) = $1`,
    [yearMonth]
  );

  const creditPayments = await database.select(
    `SELECT COALESCE(SUM(amount), 0) as total 
     FROM transactions 
     WHERE type = 'credit_payment' AND strftime('%Y-%m', date) = $1`,
    [yearMonth]
  );

  const totalIncome = income[0].total;
  const totalExpenses = expenses[0].total;
  const totalCreditPayments = creditPayments[0].total;
  const netSavings = totalIncome - totalExpenses - totalCreditPayments;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  return {
    income: totalIncome,
    expenses: totalExpenses,
    creditPayments: totalCreditPayments,
    netSavings,
    savingsRate
  };
}

export async function getExpensesByCategory(yearMonth) {
  const database = getDb();
  return await database.select(
    `SELECT c.name, c.icon, c.color, SUM(t.amount) as total
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.type = 'expense' AND strftime('%Y-%m', t.date) = $1
     GROUP BY c.id
     ORDER BY total DESC`,
    [yearMonth]
  );
}

// ============================================================================
// Credit Card Operations
// ============================================================================

export async function addCreditCard(name, lastFourDigits, creditLimit, billingDay, dueDay) {
  const database = getDb();
  const result = await database.execute(
    `INSERT INTO credit_cards (name, last_four_digits, credit_limit, billing_day, due_day) 
     VALUES ($1, $2, $3, $4, $5)`,
    [name, lastFourDigits, creditLimit, billingDay, dueDay]
  );
  return result.lastInsertId;
}

export async function getCreditCards() {
  const database = getDb();
  return await database.select('SELECT * FROM credit_cards ORDER BY name');
}

export async function addCreditCardStatement(cardId, statementDate, dueDate, totalAmount, minimumPayment) {
  const database = getDb();
  const result = await database.execute(
    `INSERT INTO credit_card_statements 
     (credit_card_id, statement_date, due_date, total_amount, minimum_payment) 
     VALUES ($1, $2, $3, $4, $5)`,
    [cardId, statementDate, dueDate, totalAmount, minimumPayment]
  );
  return result.lastInsertId;
}

export async function getPendingCreditCardStatements() {
  const database = getDb();
  return await database.select(
    `SELECT s.*, c.name as card_name, c.last_four_digits
     FROM credit_card_statements s
     JOIN credit_cards c ON s.credit_card_id = c.id
     WHERE s.is_paid = 0
     ORDER BY s.due_date ASC`
  );
}

// ============================================================================
// Settings Operations
// ============================================================================

export async function getSetting(key) {
  const database = getDb();
  const result = await database.select(
    'SELECT value FROM settings WHERE key = $1',
    [key]
  );
  return result.length > 0 ? result[0].value : null;
}

export async function setSetting(key, value) {
  const database = getDb();
  await database.execute(
    `INSERT INTO settings (key, value, updated_at) 
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
    [key, value]
  );
}

// ============================================================================
// Monthly Budget Operations
// ============================================================================

export async function setMonthlyBudget(month, incomeTarget, expenseLimit, savingsTargetPercent) {
  const database = getDb();
  await database.execute(
    `INSERT INTO monthly_budgets (month, income_target, expense_limit, savings_target_percent) 
     VALUES ($1, $2, $3, $4)
     ON CONFLICT(month) DO UPDATE SET 
       income_target = $2, 
       expense_limit = $3, 
       savings_target_percent = $4`,
    [month, incomeTarget, expenseLimit, savingsTargetPercent]
  );
}

export async function getMonthlyBudget(month) {
  const database = getDb();
  const result = await database.select(
    'SELECT * FROM monthly_budgets WHERE month = $1',
    [month]
  );
  return result.length > 0 ? result[0] : null;
}
