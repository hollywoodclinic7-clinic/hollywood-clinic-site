-- ════════════════════════════════════════════════════════════════════
--  MIGRATION 003 — doctors can belong to multiple departments
--  Converts doctors.department from a single value to a list (text[]).
--  Existing single values become a one-item list.
--  Safe to run multiple times: it skips itself if already converted.
-- ════════════════════════════════════════════════════════════════════
do $$
begin
  if (select data_type
        from information_schema.columns
       where table_schema='public' and table_name='doctors' and column_name='department') <> 'ARRAY' then
    alter table public.doctors
      alter column department type text[]
      using (case when department is null or department = '' then null else array[department] end);
  end if;
end $$;
