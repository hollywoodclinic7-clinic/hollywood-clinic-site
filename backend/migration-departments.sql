-- ════════════════════════════════════════════════════════════════════
--  DEPARTMENTS  — the top-level categories shown on the Treatments page
--  Run ONCE in the Supabase SQL Editor. Safe to re-run (updates by slug).
-- ════════════════════════════════════════════════════════════════════
create extension if not exists "pgcrypto";

create table if not exists public.departments (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  name_en        text not null,
  name_ar        text,
  description_en text,
  description_ar text,
  image_url      text,
  page_url       text,
  sort_order     int  not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.departments enable row level security;

-- public can read live departments
drop policy if exists departments_public_select on public.departments;
create policy departments_public_select on public.departments
  for select using (is_active = true);

-- admins can do everything
drop policy if exists departments_admin_all on public.departments;
create policy departments_admin_all on public.departments
  for all to authenticated using (is_admin()) with check (is_admin());

-- keep updated_at fresh
drop trigger if exists trg_departments_touch on public.departments;
create trigger trg_departments_touch before update on public.departments
  for each row execute function public.touch_updated_at();

-- ── Seed the four departments ──
insert into public.departments (slug, name_en, name_ar, description_en, description_ar, image_url, page_url, sort_order) values
 ('body-shaping','Body Shaping','نحت الجسم',
   'Non-surgical fat reduction, muscle building, skin tightening, and cellulite treatments for a sculpted, confident body.',
   'تقليل الدهون بدون جراحة، بناء العضلات، شد البشرة، وعلاج السيلوليت لجسم منحوت وثقة أكبر.',
   'assets/images/body-shaping.jpg','treatments/body-shaping.html',1),
 ('skin-rejuvenation','Skin Rejuvenation','تجديد البشرة',
   'Injectables, energy-based skin tightening, facials, and laser treatments that refresh, smooth, and renew the skin.',
   'الحقن التجميلي، شد البشرة بالطاقة، الفيشيال، وعلاجات الليزر اللي بتجدّد ونعّم البشرة وبترجّع نضارتها.',
   'assets/images/skin-rejuvenation.jpg','treatments/skin-rejuvenation.html',2),
 ('hair-restoration','Hair Restoration','علاج وزراعة الشعر',
   'Advanced non-surgical hair treatments — exosomes and growth factors — to reduce shedding and restore density.',
   'علاجات شعر متطورة وغير جراحية — الإكسوزومات وعوامل النمو — لتقليل التساقط واستعادة الكثافة.',
   'assets/images/hair-restoration.jpg','treatments/hair-restoration.html',3),
 ('surgery','Surgery','الجراحة',
   'Cosmetic surgical procedures performed by our specialist surgeon in a safe, private, fully-equipped setting.',
   'إجراءات الجراحة التجميلية على إيد جرّاحتنا المتخصصة في مكان آمن وخاص ومجهّز بالكامل.',
   'assets/images/dept-surgery.jpg','treatments/surgery.html',4)
on conflict (slug) do update set
  name_en=excluded.name_en, name_ar=excluded.name_ar,
  description_en=excluded.description_en, description_ar=excluded.description_ar,
  image_url=excluded.image_url, page_url=excluded.page_url,
  sort_order=excluded.sort_order;

-- See them:  select slug, name_en, sort_order, is_active from public.departments order by sort_order;
