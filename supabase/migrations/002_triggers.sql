-- =============================================================================
-- 002_triggers.sql
-- Business logic triggers: stock updates, alert creation, append-only guard.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Update stock_current after each movement INSERT
-- ---------------------------------------------------------------------------
create or replace function update_stock_on_movement()
returns trigger language plpgsql security definer as $$
begin
  update products
  set stock_current = stock_current + new.quantity,
      updated_at    = now()
  where id = new.product_id;
  return new;
end;
$$;

create trigger trg_update_stock_on_movement
  after insert on movements
  for each row execute function update_stock_on_movement();

-- ---------------------------------------------------------------------------
-- 2. Create / resolve alerts when stock_current changes
--    Fires after stock is updated by the movement trigger above.
-- ---------------------------------------------------------------------------
create or replace function handle_stock_alert()
returns trigger language plpgsql security definer as $$
declare
  existing_alert_id uuid;
begin
  if new.stock_current <= new.stock_minimum then
    -- Check whether an active alert already exists for this product
    select id into existing_alert_id
    from alerts
    where product_id = new.id and status = 'active'
    limit 1;

    if existing_alert_id is null then
      insert into alerts (product_id, stock_at_alert, status)
      values (new.id, new.stock_current, 'active');
    else
      -- Keep stock_at_alert current so daily reports show latest level
      update alerts
      set stock_at_alert = new.stock_current
      where id = existing_alert_id;
    end if;
  else
    -- Stock recovered — resolve any active alerts
    update alerts
    set status      = 'resolved',
        resolved_at = now()
    where product_id = new.id and status = 'active';
  end if;

  return new;
end;
$$;

create trigger trg_handle_stock_alert
  after update of stock_current on products
  for each row execute function handle_stock_alert();

-- ---------------------------------------------------------------------------
-- 3. Enforce append-only on movements (no UPDATE or DELETE allowed)
-- ---------------------------------------------------------------------------
create or replace function prevent_movement_mutation()
returns trigger language plpgsql as $$
begin
  raise exception
    'movements is append-only. Insert an adjustment movement instead.'
    using errcode = 'restrict_violation';
end;
$$;

create trigger trg_movements_no_update
  before update on movements
  for each row execute function prevent_movement_mutation();

create trigger trg_movements_no_delete
  before delete on movements
  for each row execute function prevent_movement_mutation();
