-- Budget Tracker: initial multi-tenant schema, RLS, seeding trigger, and stats RPCs.
-- Ported from the original SQLite schema in src/lib/db.js (Tauri desktop version).

-- ============================================================================
-- Tables
-- ============================================================================

create table if not exists settings (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  key text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create table if not exists categories (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  type text not null check (type in ('income', 'expense', 'both')),
  icon text,
  color text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  type text not null check (type in ('income', 'expense', 'credit_payment')),
  amount numeric(12, 2) not null,
  description text,
  category_id bigint references categories(id),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists credit_cards (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  last_four_digits text,
  credit_limit numeric(12, 2),
  billing_day integer,
  due_day integer,
  created_at timestamptz not null default now()
);

create table if not exists credit_card_statements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  credit_card_id bigint not null references credit_cards(id),
  statement_date date not null,
  due_date date not null,
  total_amount numeric(12, 2) not null,
  minimum_payment numeric(12, 2),
  paid_amount numeric(12, 2) default 0,
  is_paid boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists monthly_budgets (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  month text not null,
  income_target numeric(12, 2),
  expense_limit numeric(12, 2),
  savings_target_percent numeric(5, 2),
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

-- ============================================================================
-- Row Level Security: every table is scoped to its owning user
-- ============================================================================

alter table settings enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table credit_cards enable row level security;
alter table credit_card_statements enable row level security;
alter table monthly_budgets enable row level security;

create policy "select own" on settings for select using (auth.uid() = user_id);
create policy "insert own" on settings for insert with check (auth.uid() = user_id);
create policy "update own" on settings for update using (auth.uid() = user_id);
create policy "delete own" on settings for delete using (auth.uid() = user_id);

create policy "select own" on categories for select using (auth.uid() = user_id);
create policy "insert own" on categories for insert with check (auth.uid() = user_id);
create policy "update own" on categories for update using (auth.uid() = user_id);
create policy "delete own" on categories for delete using (auth.uid() = user_id);

create policy "select own" on transactions for select using (auth.uid() = user_id);
create policy "insert own" on transactions for insert with check (auth.uid() = user_id);
create policy "update own" on transactions for update using (auth.uid() = user_id);
create policy "delete own" on transactions for delete using (auth.uid() = user_id);

create policy "select own" on credit_cards for select using (auth.uid() = user_id);
create policy "insert own" on credit_cards for insert with check (auth.uid() = user_id);
create policy "update own" on credit_cards for update using (auth.uid() = user_id);
create policy "delete own" on credit_cards for delete using (auth.uid() = user_id);

create policy "select own" on credit_card_statements for select using (auth.uid() = user_id);
create policy "insert own" on credit_card_statements for insert with check (auth.uid() = user_id);
create policy "update own" on credit_card_statements for update using (auth.uid() = user_id);
create policy "delete own" on credit_card_statements for delete using (auth.uid() = user_id);

create policy "select own" on monthly_budgets for select using (auth.uid() = user_id);
create policy "insert own" on monthly_budgets for insert with check (auth.uid() = user_id);
create policy "update own" on monthly_budgets for update using (auth.uid() = user_id);
create policy "delete own" on monthly_budgets for delete using (auth.uid() = user_id);

-- ============================================================================
-- Seed default categories for every new user
-- ============================================================================

create function public.seed_default_categories()
returns trigger as $$
begin
  insert into public.categories (user_id, name, type, icon, color)
  values
    (new.id, 'Salary', 'income', '💼', '#10b981'),
    (new.id, 'Freelance', 'income', '💻', '#06b6d4'),
    (new.id, 'Investments', 'income', '📈', '#8b5cf6'),
    (new.id, 'Other Income', 'income', '💵', '#22c55e'),
    (new.id, 'Food & Dining', 'expense', '🍽️', '#f59e0b'),
    (new.id, 'Transportation', 'expense', '🚗', '#3b82f6'),
    (new.id, 'Utilities', 'expense', '💡', '#eab308'),
    (new.id, 'Entertainment', 'expense', '🎬', '#ec4899'),
    (new.id, 'Shopping', 'expense', '🛍️', '#f43f5e'),
    (new.id, 'Healthcare', 'expense', '🏥', '#14b8a6'),
    (new.id, 'Housing', 'expense', '🏠', '#6366f1'),
    (new.id, 'Education', 'expense', '📚', '#a855f7'),
    (new.id, 'Credit Card', 'expense', '💳', '#ef4444'),
    (new.id, 'Other Expense', 'expense', '📦', '#64748b');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_default_categories();

-- ============================================================================
-- Aggregation RPCs (not expressible cleanly via the Supabase query builder)
-- ============================================================================

create function public.get_monthly_stats(year_month text)
returns table (
  income numeric,
  expenses numeric,
  credit_payments numeric,
  net_savings numeric,
  savings_rate numeric
)
language plpgsql
security invoker
as $$
declare
  total_income numeric;
  total_expenses numeric;
  total_credit_payments numeric;
begin
  select coalesce(sum(amount), 0) into total_income
    from transactions
    where user_id = auth.uid() and type = 'income' and to_char(date, 'YYYY-MM') = year_month;

  select coalesce(sum(amount), 0) into total_expenses
    from transactions
    where user_id = auth.uid() and type = 'expense' and to_char(date, 'YYYY-MM') = year_month;

  select coalesce(sum(amount), 0) into total_credit_payments
    from transactions
    where user_id = auth.uid() and type = 'credit_payment' and to_char(date, 'YYYY-MM') = year_month;

  return query select
    total_income,
    total_expenses,
    total_credit_payments,
    total_income - total_expenses - total_credit_payments,
    case when total_income > 0
      then (total_income - total_expenses - total_credit_payments) / total_income * 100
      else 0
    end;
end;
$$;

create function public.get_expenses_by_category(year_month text)
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
  where t.user_id = auth.uid() and t.type = 'expense' and to_char(t.date, 'YYYY-MM') = year_month
  group by c.id, c.name, c.icon, c.color
  order by total desc;
$$;
