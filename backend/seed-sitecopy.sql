-- SEED — a starter set of editable homepage copy (EN + AR).
-- Run ONCE in Supabase SQL Editor. Edit these in the dashboard's Site Copy.
insert into public.site_content (key, value_en, value_ar) values
  ('doctors.home.eyebrow','Meet Our Specialists','تعرّفي على أخصائياتنا'),
  ('doctors.home.title','أمهر أطباء التجميل في القاهرة','أمهر أطباء التجميل في القاهرة'),
  ('doctors.home.subtitle','Internationally trained specialists with decades of combined experience. Every treatment is personally supervised.','أخصائيون بتدريب دولي وعقود من الخبرة المشتركة. كل علاج بإشراف شخصي.'),
  ('cta.title','Start Your Transformation','ابدئي تحولك الآن'),
  ('cta.subtitle','Sit down with one of our specialists, get a plan built around you, and start whenever you’re ready.','اقعدي مع واحدة من أخصائيينا، واعملي خطة على مقاسك، وابدئي وقت ما تكوني جاهزة.'),
  ('cta.eyebrow','Book Your Visit','احجزي زيارتك'),
  ('hero.subtitle','Cairo''s trusted aesthetic clinic for women — Botox, fillers, body contouring, laser, skin and hair care by Egypt''s top specialists in Heliopolis. 50,000+ women transformed.','عيادة التجميل اللي بتثق فيها كل سِت في القاهرة — Botox، فيلر، نحت الجسم، ليزر، بشرة وشعر على إيد نخبة دكاترة التجميل في مصر الجديدة. غيّرنا حياة أكتر من 50,000 سِت.'),
  ('services.eyebrow','Our Treatments','علاجاتنا'),
  ('services.title','Aesthetic Treatments for Women in Cairo','علاجات التجميل للسيدات في القاهرة'),
  ('services.subtitle','Body shaping, skin, hair, laser and injectables — personalized by top specialists in Cairo using the latest technology.','نحت الجسم، البشرة، الشعر، الليزر والحقن — متفصّلة عليكِ على إيد نخبة دكاترة القاهرة بأحدث التقنيات.'),
  ('testimonials.title','Loved by Women Across Cairo','محبوبين من سيدات القاهرة'),
  ('testimonials.subtitle','Honest reviews from women who walked through our doors. No filters, no PR scripts.','آراء صريحة من سيدات دخلوا عيادتنا. بدون فلاتر، بدون كلام مدفوع.'),
  ('reviews.title','Recent Reviews','أحدث المراجعات'),
  ('departments.title','Explore by Department','اختاري القسم اللي يناسبك'),
  ('departments.subtitle','Four specialties, one home for women in Heliopolis — body, skin, hair, and expert procedures.','أربع تخصصات في مكان واحد للسيدات في مصر الجديدة — الجسم، البشرة، الشعر، وإجراءات بإيد خبيرة.'),
  ('about.title','Where Beauty Meets Science — for Women','حيث يلتقي الجمال بالعلم — لأجلكِ')
on conflict (key) do update set value_en=excluded.value_en, value_ar=excluded.value_ar;
