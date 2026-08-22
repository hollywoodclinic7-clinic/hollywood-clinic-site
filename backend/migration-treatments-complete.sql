-- ══════════════════════════════════════════════════════════════════════════
-- Adds the services that were missing from `treatments` so the dashboard
-- Services list (and the homepage "Every Service We Offer" row) covers
-- ALL departments: Body Shaping, Skin Rejuvenation, Hair Restoration, Surgery.
--
-- Safe to re-run: rows are matched by slug and updated in place.
-- Run ONCE in Supabase → SQL Editor, after backend/seed-treatments.sql.
--
-- After running, open the dashboard → Services and use the ▲ ▼ buttons to
-- put them in whatever order you want. That order is what the homepage shows.
-- ══════════════════════════════════════════════════════════════════════════

alter table public.treatments add column if not exists page_url text;

insert into public.treatments
  (slug, category, parent_slug, name_en, name_ar, description_en, description_ar, image_url, page_url, sort_order, is_active)
values
  -- ── Skin Rejuvenation (new pages) ──────────────────────────────────────
  ('body-filler','skin-rejuvenation','skin-rejuvenation','Body Fillers','فيلر الجسم',
   'Adds shape and volume to the buttocks, hips and calves without surgery.',
   'بيضيف شكل وحجم للمؤخرة والأرداف والسمانة من غير جراحة.',
   'assets/images/sub-treatments/body-filler.jpg','treatments/skin-rejuvenation/body-filler.html',20,true),

  ('rich-pl','skin-rejuvenation','skin-rejuvenation','Rich PL Advance','Rich PL Advance',
   'An Italian multi-biostimulator — PLLA, hyaluronic acid, CaHA and collagen III in one — for instant hydration and long-lasting collagen renewal.',
   'حقن إيطالي متعدد المحفّزات — PLLA وحمض الهيالورونيك وCaHA وكولاجين III — لترطيب فوري وتجديد كولاجين يدوم.',
   'assets/images/sub-treatments/filler.jpg','treatments/skin-rejuvenation/rich-pl.html',21,true),

  ('sculptra','skin-rejuvenation','skin-rejuvenation','Sculptra','Sculptra',
   'The original poly-L-lactic acid biostimulator that rebuilds deep collagen for gradual, long-lasting facial volume and lift.',
   'المحفّز الحيوي الأصلي ببولي إل لاكتيك اللي بيبني كولاجين عميق لحجم ورفع طبيعي يدوم.',
   'assets/images/sub-treatments/biostimulators.jpg','treatments/skin-rejuvenation/sculptra.html',22,true),

  ('radiesse','skin-rejuvenation','skin-rejuvenation','Radiesse','Radiesse',
   'A calcium hydroxyapatite (CaHA) filler that lifts and contours immediately, then stimulates your own collagen for results that last up to 18 months.',
   'فيلر هيدروكسي أباتيت الكالسيوم بيرفع ويحدّد فوراً وبعدين بيحفّز الكولاجين لنتيجة تدوم لحد 18 شهر.',
   'assets/images/sub-treatments/body-filler.jpg','treatments/skin-rejuvenation/radiesse.html',23,true),

  -- ── Surgery (shown as ONE "Cosmetic Surgery" card; procedures live on the Surgery page) ──
  ('surgery','surgery','surgery','Cosmetic Surgery','جراحات التجميل',
   'Rhinoplasty, liposuction, tummy tuck, breast surgery, facelift and eyelid surgery — consultation-led with our specialist surgeon.',
   'تجميل الأنف، شفط الدهون، شد البطن، جراحات الثدي، شد الوجه وجراحة الجفون — بخطة بعد استشارة مع دكتورة متخصصة.',
   'assets/images/dept-surgery.jpg','treatments/surgery.html',24,true)

on conflict (slug) do update set category=excluded.category, parent_slug=excluded.parent_slug,
  name_en=excluded.name_en, name_ar=excluded.name_ar, description_en=excluded.description_en,
  description_ar=excluded.description_ar, image_url=excluded.image_url, page_url=excluded.page_url,
  sort_order=excluded.sort_order, is_active=excluded.is_active;

-- Older versions of this file created one row per surgical procedure.
-- They are now represented by the single 'surgery' row above.
delete from public.treatments
 where slug in ('rhinoplasty','liposuction','tummy-tuck','breast-surgery','facelift','eyelid-surgery');
