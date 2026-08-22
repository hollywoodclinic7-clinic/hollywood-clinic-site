/*  HOLLYWOOD CLINIC — Dynamic department (category) page renderer
    Page: /treatments/department.html?slug=<department-slug>
    Renders a department page in the same style as the built-in umbrella pages:
    hero → about/intro → grid of that department's services → CTA.
    Services are pulled live from `treatments` (built-in) + `service_pages` (added). */
(function(){
  var BK = (/^\/ar(\/|$)/.test(location.pathname) ? '/ar/' : '/');  // language-aware page base
  var P = '/assets/images/';   // root-absolute: Arabic twins sit one folder deeper
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function arr(x){ return Array.isArray(x)?x:[]; }
  // fix a stored relative path ("assets/..", "treatments/..") for a depth-1 page
  function rel(u){ if(!u) return ''; u=String(u).replace(/\.html(?=$|[?#])/,''); if(/^https?:|^\/\//.test(u)) return u; if(u.charAt(0)==='/') return u;
    // Root-absolute, and prefixed with /ar on the Arabic twins so stored links
    // ("treatments/..") keep the visitor in the language they are reading.
    var pre = /^\/ar(\/|$)/.test(location.pathname) && !/^assets\//.test(u) ? '/ar/' : '/';
    return pre + u; }

  var GEN = {
    en:{ about:'About', services:'Treatments', word:'Treatments', readmore:'Read More',
         ctaTitle:'Ready to Get Started?', ctaSub:"Free consultation with our specialists — we'll design a plan tailored just for you.",
         book:'Book Now', call:'Call Us', none:'Treatments are being added to this department.' },
    ar:{ about:'نبذة', services:'العلاجات', word:'العلاجات', readmore:'اقرئي المزيد',
         ctaTitle:'جاهزة تبدئي؟', ctaSub:'استشارة مجانية مع المتخصصين — هنصمم خطة على مقاسك.',
         book:'احجزي الآن', call:'اتصلي بينا', none:'العلاجات بتتضاف للقسم ده.' }
  };

  function heroStyle(img, rtl){
    var grad = rtl
      ? 'linear-gradient(270deg,rgba(11,29,58,0.92) 0%,rgba(11,29,58,0.78) 34%,rgba(11,29,58,0.42) 62%,rgba(11,29,58,0.18) 100%)'
      : 'linear-gradient(90deg,rgba(11,29,58,0.92) 0%,rgba(11,29,58,0.78) 34%,rgba(11,29,58,0.42) 62%,rgba(11,29,58,0.18) 100%)';
    var pos = rtl ? 'center left' : 'center right';
    return "background-image:"+grad+(img?",url('"+esc(img)+"')":"")+";background-size:cover;background-position:"+pos+";background-repeat:no-repeat;";
  }

  function card(svc, lang){
    var name = (lang==='ar' ? (svc.name_ar||svc.name_en) : svc.name_en) || '';
    var desc = (lang==='ar' ? (svc.desc_ar||svc.desc_en) : svc.desc_en) || '';
    var img = svc.image ? rel(svc.image) : '';
    return '<a href="'+esc(svc.href)+'" class="sub-card fade-up">'
      + '<div class="sub-card-image">'+(img?'<img src="'+esc(img)+'" alt="'+esc(name)+'" loading="lazy">':'')+'</div>'
      + '<div class="sub-card-body"><h3>'+esc(name)+'</h3><p>'+esc(desc)+'</p>'
      + '<span class="sub-card-link">'+esc((GEN[lang]||GEN.en).readmore)+'</span></div></a>';
  }

  function build(dept, services, lang){
    var g = GEN[lang]||GEN.en, rtl = lang==='ar';
    var name = (lang==='ar' ? (dept.name_ar||dept.name_en) : dept.name_en) || '';
    var desc = (lang==='ar' ? (dept.description_ar||dept.description_en) : dept.description_en) || '';
    var hero = dept.image_url ? rel(dept.image_url) : '';
    var grid = services.length
      ? '<div class="dept-services-grid">'+services.map(function(s){return card(s,lang);}).join('')+'</div>'
      : '<p class="tf-lead" style="text-align:center">'+esc(g.none)+'</p>';

    return ''
      + '<section class="svc-hero" style="'+heroStyle(hero,rtl)+'"><div class="hero-bg"></div><div class="container"><div class="svc-hero-inner">'
      +   '<h1 class="fade-up d1"><span>'+esc(name)+'</span></h1></div></div></section>'
      + (desc ? '<section class="section bg-cream"><div class="container"><div class="tf-about fade-up">'
      +   '<div class="lux-line"></div><p class="eyebrow">'+esc(g.about)+'</p>'
      +   '<h2 class="section-title">'+esc(name)+'</h2>'
      +   '<p style="margin-top:1.15rem">'+esc(desc)+'</p></div></div></section>' : '')
      + '<section class="section bg-sky"><div class="container"><div class="text-center mb-14 fade-up">'
      +   '<div class="lux-line"></div><p class="eyebrow">'+esc(g.services)+'</p>'
      +   '<h2 class="section-title">'+esc(name)+' '+esc(g.word)+'</h2></div>'+grid+'</div></section>'
      + '<section class="section cta-banner"><div class="container">'
      +   '<div class="cta-icon"><svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg></div>'
      +   '<h2>'+esc(g.ctaTitle)+'</h2><p>'+esc(g.ctaSub)+'</p>'
      +   '<div class="hero-cta" style="justify-content:center"><a href="'+BK+'booking" class="btn btn-primary">'+esc(g.book)+'</a>'
      +   '<a href="tel:+201000007176" class="btn btn-ghost-light">'+esc(g.call)+'</a></div></div></section>';
  }

  function initBehaviors(root){
    // fade-up reveal
    try{
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}});},{threshold:0.12});
      root.querySelectorAll('.fade-up').forEach(function(el){io.observe(el);});
    }catch(e){ root.querySelectorAll('.fade-up').forEach(function(el){el.classList.add('visible');}); }
  }

  /* ───────── data + render ───────── */
  var SLUG = new URLSearchParams(location.search).get('slug');
  var DEPT = null, SERVICES = null, layoutReady = false;

  function maybeRender(){ if(DEPT!==null && SERVICES!==null && layoutReady) render(); }

  function render(){
    if(!DEPT){ notFound(); return; }
    var lang = (window.I18N && I18N.current ? I18N.current() : (localStorage.getItem('hc_lang')||'en'));
    var rtl = lang==='ar';
    document.documentElement.setAttribute('dir', rtl?'rtl':'ltr');
    document.body.setAttribute('dir', rtl?'rtl':'ltr');
    document.title = ((lang==='ar'?(DEPT.name_ar||DEPT.name_en):DEPT.name_en)||'Department')+' — Hollywood Clinic';
    var root=document.getElementById('dept-root');
    root.innerHTML = build(DEPT, SERVICES||[], lang);
    initBehaviors(root);
  }

  function notFound(){
    var root=document.getElementById('dept-root');
    if(root) root.innerHTML='<section class="section bg-cream"><div class="container" style="text-align:center;padding:5rem 1rem"><h1 class="section-title">Department not found</h1><p style="margin-top:1rem"><a class="btn btn-primary" href="'+BK+'treatments">Browse treatments</a></p></div></section>';
  }

  function normalizeServices(builtin, added, slug){
    var out=[];
    arr(builtin).forEach(function(t){ if(!t.page_url) return;
      out.push({ name_en:t.name_en, name_ar:t.name_ar, desc_en:t.description_en, desc_ar:t.description_ar,
        image:t.image_url, href:rel(t.page_url), sort:(t.sort_order||0) }); });
    arr(added).forEach(function(s){ var c=s.content||{};
      out.push({ name_en:s.name_en, name_ar:s.name_ar,
        desc_en:(c.en&&c.en.about_short)||'', desc_ar:(c.ar&&c.ar.about_short)||'',
        image:s.hero_image_url||c.hero_image_url, href:'service?slug='+encodeURIComponent(s.slug), sort:(s.sort_order||999) }); });
    out.sort(function(a,b){ return a.sort-b.sort; });
    return out;
  }

  function load(){
    if(!SLUG){ notFound(); return; }
    if(!(window.HC && HC.db)) return;
    HC.db.from('departments').select('*').eq('slug',SLUG).eq('is_active',true).single().then(function(res){
      DEPT = (res.error||!res.data) ? false : res.data;
      if(!DEPT){ SERVICES=[]; maybeRender(); return; }
      // services in this category, from both tables
      Promise.all([
        HC.db.from('treatments').select('*').eq('category',SLUG).eq('is_active',true).order('sort_order',{ascending:true}),
        HC.db.from('service_pages').select('*').eq('category',SLUG).eq('is_active',true).order('sort_order',{ascending:true})
      ]).then(function(r){
        SERVICES = normalizeServices((r[0]&&r[0].data)||[], (r[1]&&r[1].data)||[], SLUG);
        maybeRender();
      }).catch(function(){ SERVICES=[]; maybeRender(); });
    }).catch(function(){ notFound(); });
  }

  document.addEventListener('hc:db-ready', load);
  if(window.HC && HC.ready) load();
  document.addEventListener('i18n:applied', function(){ layoutReady=true; maybeRender(); });
})();
