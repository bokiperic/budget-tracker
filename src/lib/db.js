/**
 * Data access layer for Budget Tracker
 * Talks to Supabase (Postgres + Row Level Security) — every query is
 * automatically scoped to the signed-in user by RLS policies, so no
 * client-side user_id filtering is needed here.
 */

import { supabase } from "./supabaseClient.js";

function throwIfError(error) {
  if (error) throw error;
}

function monthRange(yearMonth) {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = `${yearMonth}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, end };
}

// ============================================================================
// Transaction Operations
// ============================================================================

export async function addTransaction(
  type,
  amount,
  description,
  categoryId,
  date = null,
) {
  const row = { type, amount, description, category_id: categoryId };
  if (date) row.date = date;
  const { data, error } = await supabase
    .from("transactions")
    .insert(row)
    .select("id")
    .single();
  throwIfError(error);
  return data.id;
}

export async function getTransactions(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, category:categories(name, icon, color)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  throwIfError(error);
  return data;
}

export async function getTransactionsByMonth(yearMonth) {
  const { start, end } = monthRange(yearMonth);
  const { data, error } = await supabase
    .from("transactions")
    .select("*, category:categories(name, icon, color)")
    .gte("date", start)
    .lt("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  throwIfError(error);
  return data;
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  throwIfError(error);
}

// ============================================================================
// Category Operations
// ============================================================================

export async function getCategories(type = null) {
  let query = supabase
    .from("categories")
    .select("*")
    .order("type")
    .order("name");
  if (type) {
    query = query.in("type", [type, "both"]);
  }
  const { data, error } = await query;
  throwIfError(error);
  return data;
}

export async function addCategory(name, type, icon = null, color = null) {
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, type, icon, color })
    .select("id")
    .single();
  throwIfError(error);
  return data.id;
}

export async function updateCategory(id, { name, type, icon, color } = {}) {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (type !== undefined) updates.type = type;
  if (icon !== undefined) updates.icon = icon;
  if (color !== undefined) updates.color = color;
  const { error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id);
  throwIfError(error);
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  throwIfError(error);
}

// ============================================================================
// Statistics & Calculations
// ============================================================================

export async function getMonthlyStats(yearMonth) {
  const { data, error } = await supabase
    .rpc("get_monthly_stats", { year_month: yearMonth })
    .single();
  throwIfError(error);
  return {
    income: data.income,
    expenses: data.expenses,
    creditPayments: data.credit_payments,
    netSavings: data.net_savings,
    savingsRate: data.savings_rate,
  };
}

export async function getExpensesByCategory(yearMonth) {
  const { data, error } = await supabase.rpc("get_expenses_by_category", {
    year_month: yearMonth,
  });
  throwIfError(error);
  return data;
}

// ============================================================================
// Credit Card Operations
// ============================================================================

export async function addCreditCard(
  name,
  lastFourDigits,
  creditLimit,
  billingDay,
  dueDay,
) {
  const { data, error } = await supabase
    .from("credit_cards")
    .insert({
      name,
      last_four_digits: lastFourDigits,
      credit_limit: creditLimit,
      billing_day: billingDay,
      due_day: dueDay,
    })
    .select("id")
    .single();
  throwIfError(error);
  return data.id;
}

export async function getCreditCards() {
  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .order("name");
  throwIfError(error);
  return data;
}

export async function updateCreditCard(
  id,
  { name, lastFourDigits, creditLimit, billingDay, dueDay } = {},
) {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (lastFourDigits !== undefined) updates.last_four_digits = lastFourDigits;
  if (creditLimit !== undefined) updates.credit_limit = creditLimit;
  if (billingDay !== undefined) updates.billing_day = billingDay;
  if (dueDay !== undefined) updates.due_day = dueDay;
  const { error } = await supabase
    .from("credit_cards")
    .update(updates)
    .eq("id", id);
  throwIfError(error);
}

export async function deleteCreditCard(id) {
  const { error } = await supabase.from("credit_cards").delete().eq("id", id);
  throwIfError(error);
}

export async function addCreditCardStatement(
  cardId,
  statementDate,
  dueDate,
  totalAmount,
  minimumPayment,
) {
  const { data, error } = await supabase
    .from("credit_card_statements")
    .insert({
      credit_card_id: cardId,
      statement_date: statementDate,
      due_date: dueDate,
      total_amount: totalAmount,
      minimum_payment: minimumPayment,
    })
    .select("id")
    .single();
  throwIfError(error);
  return data.id;
}

export async function getPendingCreditCardStatements() {
  const { data, error } = await supabase
    .from("credit_card_statements")
    .select("*, credit_card:credit_cards(name, last_four_digits)")
    .eq("is_paid", false)
    .order("due_date", { ascending: true });
  throwIfError(error);
  return data;
}

export async function markStatementPaid(id, paidAmount = null) {
  const updates = { is_paid: true };
  if (paidAmount !== null) updates.paid_amount = paidAmount;
  const { error } = await supabase
    .from("credit_card_statements")
    .update(updates)
    .eq("id", id);
  throwIfError(error);
}

// ============================================================================
// Settings Operations
// ============================================================================

export async function getSetting(key) {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  throwIfError(error);
  return data ? data.value : null;
}

export async function setSetting(key, value) {
  const { error } = await supabase
    .from("settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" },
    );
  throwIfError(error);
}

// ============================================================================
// Monthly Budget Operations
// ============================================================================

export async function setMonthlyBudget(
  month,
  incomeTarget,
  expenseLimit,
  savingsTargetPercent,
) {
  const { error } = await supabase.from("monthly_budgets").upsert(
    {
      month,
      income_target: incomeTarget,
      expense_limit: expenseLimit,
      savings_target_percent: savingsTargetPercent,
    },
    { onConflict: "user_id,month" },
  );
  throwIfError(error);
}

export async function getMonthlyBudget(month) {
  const { data, error } = await supabase
    .from("monthly_budgets")
    .select("*")
    .eq("month", month)
    .maybeSingle();
  throwIfError(error);
  return data;
}
