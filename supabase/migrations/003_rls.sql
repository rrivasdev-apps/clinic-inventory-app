-- =============================================================================
-- 003_rls.sql
-- Row-Level Security: enable on all tables and define per-role policies.
-- Roles: admin | nurse | purchasing | readonly
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: get the caller's role for a given module
-- ---------------------------------------------------------------------------
create or replace function get_my_role(p_module text default 'inventory')
returns user_role language sql security definer stable as $$
  select role
  from user_roles
  where user_id = auth.uid() and module = p_module
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------
alter table categories     enable row level security;
alter table suppliers      enable row level security;
alter table products       enable row level security;
alter table procedures     enable row level security;
alter table movements      enable row level security;
alter table alerts         enable row level security;
alter table alert_logs     enable row level security;
alter table purchase_orders enable row level security;
alter table user_roles     enable row level security;
alter table settings       enable row level security;

-- ---------------------------------------------------------------------------
-- categories
--   SELECT: all authenticated users
--   INSERT/UPDATE/DELETE: admin only
-- ---------------------------------------------------------------------------
create policy "categories: authenticated can read"
  on categories for select
  to authenticated
  using (true);

create policy "categories: admin can write"
  on categories for insert
  to authenticated
  with check (get_my_role() = 'admin');

create policy "categories: admin can update"
  on categories for update
  to authenticated
  using (get_my_role() = 'admin');

create policy "categories: admin can delete"
  on categories for delete
  to authenticated
  using (get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- suppliers
--   SELECT: admin, purchasing
--   INSERT/UPDATE: admin, purchasing
--   DELETE: admin only
-- ---------------------------------------------------------------------------
create policy "suppliers: admin and purchasing can read"
  on suppliers for select
  to authenticated
  using (get_my_role() in ('admin', 'purchasing'));

create policy "suppliers: admin and purchasing can insert"
  on suppliers for insert
  to authenticated
  with check (get_my_role() in ('admin', 'purchasing'));

create policy "suppliers: admin and purchasing can update"
  on suppliers for update
  to authenticated
  using (get_my_role() in ('admin', 'purchasing'));

create policy "suppliers: admin can delete"
  on suppliers for delete
  to authenticated
  using (get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- products
--   SELECT: all authenticated users
--   INSERT/UPDATE: admin, purchasing
--   DELETE: admin only
-- ---------------------------------------------------------------------------
create policy "products: authenticated can read"
  on products for select
  to authenticated
  using (true);

create policy "products: admin and purchasing can insert"
  on products for insert
  to authenticated
  with check (get_my_role() in ('admin', 'purchasing'));

create policy "products: admin and purchasing can update"
  on products for update
  to authenticated
  using (get_my_role() in ('admin', 'purchasing'));

create policy "products: admin can delete"
  on products for delete
  to authenticated
  using (get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- procedures
--   SELECT: all authenticated users
--   INSERT/UPDATE: admin only
-- ---------------------------------------------------------------------------
create policy "procedures: authenticated can read"
  on procedures for select
  to authenticated
  using (true);

create policy "procedures: admin can write"
  on procedures for insert
  to authenticated
  with check (get_my_role() = 'admin');

create policy "procedures: admin can update"
  on procedures for update
  to authenticated
  using (get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- movements  (append-only — no UPDATE/DELETE policy, DB trigger also blocks it)
--   SELECT: all authenticated users
--   INSERT: admin, nurse, purchasing
-- ---------------------------------------------------------------------------
create policy "movements: authenticated can read"
  on movements for select
  to authenticated
  using (true);

create policy "movements: clinical staff can insert"
  on movements for insert
  to authenticated
  with check (get_my_role() in ('admin', 'nurse', 'purchasing'));

-- ---------------------------------------------------------------------------
-- alerts
--   SELECT: all authenticated users
--   UPDATE (resolve): admin, purchasing
--   INSERT: blocked for end users — only the stock trigger inserts (security definer)
-- ---------------------------------------------------------------------------
create policy "alerts: authenticated can read"
  on alerts for select
  to authenticated
  using (true);

create policy "alerts: admin and purchasing can resolve"
  on alerts for update
  to authenticated
  using (get_my_role() in ('admin', 'purchasing'));

-- ---------------------------------------------------------------------------
-- alert_logs
--   SELECT: admin, purchasing
--   INSERT: blocked for end users — only Edge Functions insert via service role
-- ---------------------------------------------------------------------------
create policy "alert_logs: admin and purchasing can read"
  on alert_logs for select
  to authenticated
  using (get_my_role() in ('admin', 'purchasing'));

-- ---------------------------------------------------------------------------
-- purchase_orders
--   SELECT: admin, purchasing
--   INSERT/UPDATE: admin, purchasing
--   DELETE: admin only
-- ---------------------------------------------------------------------------
create policy "purchase_orders: admin and purchasing can read"
  on purchase_orders for select
  to authenticated
  using (get_my_role() in ('admin', 'purchasing'));

create policy "purchase_orders: admin and purchasing can insert"
  on purchase_orders for insert
  to authenticated
  with check (get_my_role() in ('admin', 'purchasing'));

create policy "purchase_orders: admin and purchasing can update"
  on purchase_orders for update
  to authenticated
  using (get_my_role() in ('admin', 'purchasing'));

create policy "purchase_orders: admin can delete"
  on purchase_orders for delete
  to authenticated
  using (get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- user_roles
--   SELECT: admin sees all; users see their own row
--   INSERT/UPDATE/DELETE: admin only
-- ---------------------------------------------------------------------------
create policy "user_roles: admin sees all, users see own"
  on user_roles for select
  to authenticated
  using (
    user_id = auth.uid()
    or get_my_role() = 'admin'
  );

create policy "user_roles: admin can insert"
  on user_roles for insert
  to authenticated
  with check (get_my_role() = 'admin');

create policy "user_roles: admin can update"
  on user_roles for update
  to authenticated
  using (get_my_role() = 'admin');

create policy "user_roles: admin can delete"
  on user_roles for delete
  to authenticated
  using (get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- settings
--   SELECT/UPDATE: admin only
-- ---------------------------------------------------------------------------
create policy "settings: admin can read"
  on settings for select
  to authenticated
  using (get_my_role() = 'admin');

create policy "settings: admin can update"
  on settings for update
  to authenticated
  using (get_my_role() = 'admin');
