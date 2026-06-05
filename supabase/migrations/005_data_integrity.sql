-- =============================================================================
-- 005_data_integrity.sql
-- Data integrity constraints and security hardening.
-- =============================================================================

-- Prevent zero-quantity movements — they trigger stock updates with no effect
-- and can fire spurious alerts.
alter table movements
  add constraint movements_quantity_nonzero
  check (quantity != 0);

-- Lock get_my_role() search_path to prevent search_path injection attacks.
-- Without this, a rogue schema could shadow the user_roles table and escalate
-- privileges by returning 'admin' for any caller.
create or replace function get_my_role(p_module text default 'inventory')
returns user_role
language sql
security definer
set search_path = public, pg_catalog
stable as $$
  select role
  from user_roles
  where user_id = auth.uid() and module = p_module
  limit 1;
$$;
