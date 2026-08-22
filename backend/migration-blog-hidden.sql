-- Auto-generated SEO articles: live pages + in the sitemap (Google can crawl & rank them),
-- but kept OUT of the main Blog list so they don't clutter the site for visitors.
-- Run once in Supabase → SQL Editor.

alter table public.blog_posts
  add column if not exists hidden boolean not null default false;

-- (optional) tag where a post came from, handy for reporting
alter table public.blog_posts
  add column if not exists source text;   -- e.g. 'autoblog'

create index if not exists idx_blog_posts_published on public.blog_posts(is_published, published_at desc);
