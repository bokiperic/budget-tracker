-- Budget Tracker: data-integrity constraints and query performance.
-- Apply in the Supabase SQL Editor (like 0001/0002).
--
-- NOTE: the new CHECK constraints validate existing rows when added. If you
-- have legacy rows with amount <= 0 or a malformed monthly_budgets.month,
-- clean those up first or the ALTER will fail.

-- ============================================================================
-- Foreign keys: define ON DELETE behavior
-- ============================================================================

-- Deleting a category previously failed with a raw FK violation if any
-- transaction referenced it; keep the transaction, drop the categorization.
alter table transactions
  drop constraint transactions_category_id_fkey,
  add constraint transactions_category_id_fkey
    foreign key (category_id) references categories(id) on delete set null;

-- Statements are child records of a card: deleting the card deletes them.
alter table credit_card_statements
  drop constraint credit_card_statements_credit_card_id_fkey,
  add constraint credit_card_statements_credit_card_id_fkey
    foreign key (credit_card_id) references credit_cards(id) on delete cascade;

-- ============================================================================
-- CHECK constraints (previously only enforced client-side, or not at all)
-- ============================================================================

alter table transactions
  add constraint transactions_amount_positive check (amount > 0);

alter table monthly_budgets
  add constraint monthly_budgets_month_format
    check (month ~ '^\d{4}-(0[1-9]|1[0-2])$');

-- ============================================================================
-- Indexes: every query on transactions filters by user_id (+ date), and
-- the FK columns need indexes for fast cascades / set-null on delete.
-- ============================================================================

create index if not exists transactions_user_id_date_idx
  on transactions (user_id, date desc);

create index if not exists transactions_category_id_idx
  on transactions (category_id);

create index if not exists credit_card_statements_credit_card_id_idx
  on credit_card_statements (credit_card_id);

-- ============================================================================
-- Stats RPCs: single-pass, sargable date-range filters
-- (replaces the 0001 versions, which ran three sequential scans with a
-- non-sargable to_char(date, 'YYYY-MM') comparison that no index can serve).
-- Privileges granted in 0002 are preserved by CREATE OR REPLACE.
-- ============================================================================

create or replace function public.get_monthly_stats(year_month text)
returns table (
  income numeric,
  expenses numeric,
  credit_payments numeric,
  net_savings numeric,
  savings_rate numeric
)
language sql
security invoker
as $$
  with totals as (
    select
      coalesce(sum(amount) filter (where type = 'income'), 0) as income,
      coalesce(sum(amount) filter (where type = 'expense'), 0) as expenses,
      coalesce(sum(amount) filter (where type = 'credit_payment'), 0) as credit_payments
    from transactions
    where user_id = auth.uid()
      and date >= to_date(year_month, 'YYYY-MM')
      and date < to_date(year_month, 'YYYY-MM') + interval '1 month'
  )
  select
    income,
    expenses,
    credit_payments,
    income - expenses - credit_payments,
    case when income > 0
      then (income - expenses - credit_payments) / income * 100
      else 0
    end
  from totals;
$$;

create or replace function public.get_expenses_by_category(year_month text)
returns table (
  name text,
  icon text,
  color text,
  total numeric
)
language sql
security invoker
as $$
  select c.name, c.icon, c.color, sum(t.amount) as total
  from transactions t
  join categories c on t.category_id = c.id
  where t.user_id = auth.uid()
    and t.type = 'expense'
    and t.date >= to_date(year_month, 'YYYY-MM')
    and t.date < to_date(year_month, 'YYYY-MM') + interval '1 month'
  group by c.id, c.name, c.icon, c.color
  order by total desc;
$$;
