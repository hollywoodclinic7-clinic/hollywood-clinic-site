#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hollywood Clinic - auto-blog engine.

Generates ONE bilingual (EN + AR) SEO article with Claude and publishes it into the
Supabase `blog_posts` table as a LIVE, crawlable page that is HIDDEN from the main Blog list.
Run it 3x/day (cron or n8n). Each run publishes one new article until the topic pool is used up.

Required env vars:
  ANTHROPIC_API_KEY      your Anthropic API key
  SUPABASE_URL           e.g. https://dtlgclhgjvqpkqnxwawj.supabase.co
  SUPABASE_SERVICE_KEY   Supabase service_role key (Project Settings -> API)
Optional:
  MODEL                  Claude model string (default: claude-sonnet-5)

Run the migration backend/migration-blog-hidden.sql once before using this.
"""
import os, sys, io, json, datetime, urllib.request, urllib.error

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ANTHROPIC_KEY = os.environ.get('ANTHROPIC_API_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bGdjbGhnanZxcGtxbnh3YXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTM0MDUsImV4cCI6MjA5NjQ4OTQwNX0.9_aghjvVGMER4ASkYk5PdzuG8XWje_EUjS-Zbthn0G4')
SUPABASE_URL  = os.environ.get('SUPABASE_URL', 'https://dtlgclhgjvqpkqnxwawj.supabase.co').rstrip('/')
SERVICE_KEY   = os.environ.get('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bGdjbGhnanZxcGtxbnh3YXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkxMzQwNSwiZXhwIjoyMDk2NDg5NDA1fQ.EynhNYoNXeg5bye_ySH_yVRX6KLxf9AlDSBMp1fOMVw')
MODEL         = os.environ.get('MODEL', 'claude-sonnet-5')
COVER         = 'assets/images/blog/clinic-tour.jpg'

# Curated topic pool (slug, working title). Add as many as you like - one is used per run.
TOPICS = [
  ("rich-pl-advance-explained", "Rich PL Advance: the 4-in-1 skin biostimulator explained"),
  ("lose-belly-fat-without-surgery", "How to lose stubborn belly fat without surgery"),
  ("hair-loss-in-women-treatments", "Hair loss in women: causes and non-surgical treatments"),
  ("sculptra-collagen-biostimulator", "Sculptra: the collagen biostimulator for natural results"),
  ("morpheus8-what-to-expect", "Morpheus8: what to expect, results and recovery"),
  ("hifu-non-surgical-facelift", "HIFU: a non-surgical face lift option explained"),
  ("botox-myths-and-facts", "Botox myths and facts: what it can and cannot do"),
  ("dermal-fillers-beginners-guide", "Dermal fillers: a beginner's guide to natural results"),
  ("skin-boosters-hydration", "Skin boosters: deep hydration and glow explained"),
  ("melasma-pigmentation-treatments", "Melasma and pigmentation: treatments that work"),
  ("acne-scars-treatment-options", "Acne scars: the best treatment options today"),
  ("laser-hair-removal-guide", "Laser hair removal: what to know before your first session"),
  ("post-pregnancy-body-contouring", "Post-pregnancy body: safe contouring after childbirth"),
  ("cellulite-causes-and-treatments", "Cellulite: what causes it and how to reduce it"),
  ("double-chin-non-surgical", "Double chin: non-surgical ways to define your jawline"),
  ("hydrafacial-benefits", "Hydrafacial: benefits, results and who it is for"),
  ("collagen-banking-prevention", "Collagen banking: why prevention beats correction"),
  ("under-eye-dark-circles-hollows", "Under-eye dark circles and hollows: real solutions"),
  ("regenerative-hair-therapy", "Regenerative hair therapy: reviving thinning hair"),
  ("stretch-marks-treatment", "Stretch marks: treatments that improve their appearance"),
  ("radiofrequency-skin-tightening", "Radiofrequency skin tightening explained"),
  ("fat-freezing-cryolipolysis", "Fat freezing (cryolipolysis): how it works"),
  ("thread-lift-vs-filler", "Thread lift vs fillers: choosing the right lift"),
  ("mesotherapy-skin-and-hair", "Mesotherapy for skin and hair: what it treats"),
  ("chemical-peels-guide", "Chemical peels: a guide to brighter, smoother skin"),
  ("enlarged-pores-treatment", "Enlarged pores: how to minimise them"),
  ("neck-decollete-rejuvenation", "Neck and decollete: the ageing zones people forget"),
  ("preventative-aesthetics-20s-30s", "Preventative aesthetics in your 20s and 30s"),
  ("summer-skincare-egypt", "Summer skincare: protecting your skin in Egypt's heat"),
  ("bride-to-be-skin-timeline", "Bride-to-be: a skin and body timeline before the wedding"),
]

def die(msg): print("[autoblog] " + msg); sys.exit(1)
if not ANTHROPIC_KEY: die("ANTHROPIC_API_KEY not set")
if not SERVICE_KEY:   die("SUPABASE_SERVICE_KEY not set")

def http(url, data=None, headers=None, method=None):
    req = urllib.request.Request(url,
        data=(json.dumps(data).encode('utf-8') if data is not None else None),
        headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.status, r.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 0, str(e)

# 1) skip topics already published
st, body = http(f"{SUPABASE_URL}/rest/v1/blog_posts?select=slug",
                headers={'apikey': SERVICE_KEY, 'Authorization': f'Bearer {SERVICE_KEY}'})
existing = set()
if st == 200:
    try: existing = {row['slug'] for row in json.loads(body)}
    except Exception: pass

topic = next((t for t in TOPICS if t[0] not in existing), None)
if not topic:
    print("[autoblog] All topics already published - add more to TOPICS."); sys.exit(0)
slug, working_title = topic

# 2) generate the bilingual article with Claude
PROMPT = (
 "You are the content writer for Hollywood Clinic, a women's aesthetic-medicine clinic in "
 "Heliopolis, Cairo (body shaping, skin rejuvenation, hair restoration, cosmetic surgery).\n\n"
 f'Write ONE SEO-optimised blog article on this topic: "{working_title}".\n\n'
 "Rules:\n"
 "- Accurate, responsible medical-aesthetic content. No guarantees or cures. Encourage a "
 "professional consultation. Never invent statistics.\n"
 "- Warm, clear, trustworthy tone for Egyptian women.\n"
 "- English body 500-700 words in Markdown, with a short intro and 3-4 '## ' subheadings.\n"
 "- Arabic body: a natural Egyptian-Arabic version with the same structure (not machine-literal).\n"
 "- End both with a soft call to action to book a free consultation at Hollywood Clinic.\n"
 "- Keep brand/device names in English (Rich PL, Sculptra, Morpheus8, HIFU, Botox, PLLA, etc.).\n\n"
 "Return ONLY valid JSON (no code fences, no preamble) with EXACTLY these keys:\n"
 '{"title_en":"","title_ar":"","excerpt_en":"(max 160 chars meta description)",'
 '"excerpt_ar":"","body_en":"(markdown)","body_ar":"(markdown)","tags":"comma,separated,keywords"}'
)
st, body = http("https://api.anthropic.com/v1/messages",
    data={"model": MODEL, "max_tokens": 4000, "messages": [{"role": "user", "content": PROMPT}]},
    headers={'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
if st != 200: die(f"Anthropic API error {st}: {body[:300]}")

txt = ''
try:
    txt = ''.join(b.get('text', '') for b in json.loads(body).get('content', []) if b.get('type') == 'text').strip()
    if txt.startswith('```'):
        txt = txt.strip('`')
        if txt.lower().startswith('json'): txt = txt[4:]
        txt = txt.strip()
    art = json.loads(txt)
except Exception as e:
    die(f"Could not parse article JSON: {e}: {txt[:300]}")

# 3) insert into Supabase (published + hidden from the Blog list)
row = {
  "slug": slug,
  "title_en": art.get("title_en") or working_title,
  "title_ar": art.get("title_ar", ""),
  "excerpt_en": (art.get("excerpt_en", "") or "")[:300],
  "excerpt_ar": (art.get("excerpt_ar", "") or "")[:300],
  "body_en": art.get("body_en", ""),
  "body_ar": art.get("body_ar", ""),
  "cover_image_url": COVER,
  "is_published": True,
  "hidden": True,
  "source": "autoblog",
  "published_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
}
st, body = http(f"{SUPABASE_URL}/rest/v1/blog_posts", data=row,
    headers={'apikey': SERVICE_KEY, 'Authorization': f'Bearer {SERVICE_KEY}',
             'content-type': 'application/json', 'Prefer': 'return=minimal'}, method='POST')
if st in (200, 201):
    print(f"[autoblog] Published: {slug}  |  {row['title_en']}")
else:
    die(f"Supabase insert error {st}: {body[:300]}")
