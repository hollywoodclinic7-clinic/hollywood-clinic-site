-- ════════════════════════════════════════════════════════════════════
--  ADD A NEW ADMIN  (two steps)
--
--  STEP 1 — create their login (in the Supabase Dashboard, NOT here):
--    Authentication → Users → "Add user"
--      • Email:    the new admin's email
--      • Password: set one for them (or use "Send invitation" so they
--                  choose their own)
--      • Tick "Auto Confirm User" so they can sign in right away
--
--  STEP 2 — grant them admin access (run this, here in SQL Editor):
--    change the email below to the SAME email, then press Run.
--    It looks up their new user id automatically and adds them.
-- ════════════════════════════════════════════════════════════════════
insert into public.admins (user_id, email)
select id, email
  from auth.users
 where email = 'newadmin@example.com'      -- 👈 change this
on conflict (user_id) do nothing;

-- See who currently has admin access:
--   select email, created_at from public.admins order by created_at;

-- To REMOVE an admin later:
--   delete from public.admins where email = 'someone@example.com';
