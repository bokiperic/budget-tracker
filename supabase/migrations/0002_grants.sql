-- Grant table/function privileges to the `authenticated` role.
-- RLS policies (from 0001_init.sql) restrict rows to auth.uid() = user_id;
-- these GRANTs are the separate, required Postgres privilege layer that
-- lets the `authenticated` role touch these tables/functions at all.

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.settings,
  public.categories,
  public.transactions,
  public.credit_cards,
  public.credit_card_statements,
  public.monthly_budgets
to authenticated;

grant execute on function public.get_monthly_stats(text) to authenticated;
grant execute on function public.get_expenses_by_category(text) to authenticated;
