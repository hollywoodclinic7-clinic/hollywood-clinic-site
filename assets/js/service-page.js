/* ═══════════════════════════════════════════════════════════════════
   HOLLYWOOD CLINIC — Dynamic service page renderer
   Renders a service added from the admin dashboard (service_pages table)
   in the EXACT premium template, bilingual (EN / Egyptian-Arabic RTL).
   Page: /treatments/service.html?slug=<slug>
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var BK = (/^\/ar(\/|$)/.test(location.pathname) ? '/ar/' : '/');  // language-aware page base
  var P = '/assets/images/';             // root-absolute: Arabic twins sit one folder deeper
  var DOC = (/^\/ar(\/|$)/.test(location.pathname) ? '/ar/doctors/' : '/doctors/');

  // Fixed bilingual labels (dynamic services have no i18n keys)
  var GEN = {
    en: { about:'About', see:'See It In Action', what:'What is it?', why:'Benefits & Results', how:'The Process',
      who:'Who is it for?', safety:'Contraindications', quality:'Technology & Brands', compare:'Treatment comparisons',
      whyhc:'Why choose Hollywood Clinic?', introWhy:'Why it works?', introHow:'How the session works?',
      introSafety:'Safety first', introQuality:'Quality You Can Trust', real:'Real Results', ba:'Before & After',
      before:'Before', after:'After', revEy:'Client Reviews', revTi:'What Our Clients Say', spec:'Your Specialists',
      docTi:'Recommended Doctors', view:'View Profile', faqEy:'FAQ', faqTi:'Frequently Asked Questions',
      galEy:'Gallery', galSub:'A closer look at our clinic and technology.', more:'Show more photos', less:'Show less',
      ctaTi:'Ready to Get Started?', ctaSub:'Free consultation with our specialists. Personalized plan.',
      book:'Book Now', call:'Call Us' },
    ar: { about:'نبذة', see:'شوفيه بنفسك', what:'إيه هو؟', why:'الفوايد والنتايج', how:'خطوات الجلسة',
      who:'مناسب لمين؟', safety:'موانع الاستخدام', quality:'التقنية والأجهزة', compare:'مقارنة بين العلاجات',
      whyhc:'ليه تختاري هوليوود كلينك؟', introWhy:'ليه بيشتغل؟', introHow:'إزاي بتمشي الجلسة؟',
      introSafety:'الأمان أولًا', introQuality:'جودة تقدري تثقي فيها', real:'نتائج حقيقية', ba:'قبل وبعد',
      before:'قبل', after:'بعد', revEy:'آراء العميلات', revTi:'العميلات بيقولوا إيه', spec:'الأطباء المتخصصين',
      docTi:'الأطباء المتخصصين', view:'الملف الشخصي', faqEy:'الأسئلة', faqTi:'الأسئلة الشائعة',
      galEy:'المعرض', galSub:'نظرة أقرب على العيادة والتقنية.', more:'صور أكتر', less:'عرض أقل',
      ctaTi:'جاهزة تبدئي؟', ctaSub:'استشارة مجانية مع المتخصصين. خطة مخصصة ليكي.',
      book:'احجزي الآن', call:'اتصلي بينا' }
  };
  var CLINIC = []; for (var i=1;i<=12;i++){ CLINIC.push(P+'blog/clinic-tour/clinic-'+(i<10?'0':'')+i+'.jpg'); }

  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function arr(x){ return Array.isArray(x)?x:[]; }
  var CHEV='<svg class="tf-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>';

  function baSlider(before, after, capText){
    return '<div class="ba-slider">'
      + '<div class="ba-after"><img src="'+esc(after)+'" alt="After"></div>'
      + '<div class="ba-before"><img src="'+esc(before)+'" alt="Before"></div>'
      + '<div class="ba-label before">__BEFORE__</div><div class="ba-label after">__AFTER__</div>'
      + '<div class="ba-handle"></div></div>'
      + (capText?'<div class="ba-caption"><p class="meta">'+esc(capText)+'</p></div>':'');
  }

  function build(c, lang){
    var L = c[lang] || c.en || {};
    var g = GEN[lang] || GEN.en;
    var rtl = lang==='ar';
    var hero = c.hero_image_url || '';
    var grad = rtl
      ? 'linear-gradient(270deg,rgba(11,29,58,0.92) 0%,rgba(11,29,58,0.78) 34%,rgba(11,29,58,0.42) 62%,rgba(11,29,58,0.18) 100%)'
      : 'linear-gradient(90deg,rgba(11,29,58,0.92) 0%,rgba(11,29,58,0.78) 34%,rgba(11,29,58,0.42) 62%,rgba(11,29,58,0.18) 100%)';
    var heroStyle = "background-color:var(--navy);background-image:"+grad+(hero?",url('"+esc(hero)+"')":"")+";background-size:cover;background-position:center "+(rtl?'left':'right')+";";
    // a separate, taller crop for phones — matches how the built-in pages do it
    var heroMob = c.hero_mobile_url || '';
    var heroMobCss = heroMob
      ? '<style>@media (max-width:767px){.svc-hero{background-image:linear-gradient(180deg,rgba(11,29,58,0.55) 0%,rgba(11,29,58,0.32) 45%,rgba(11,29,58,0.55) 100%),url(\''+esc(heroMob)+'\')!important;background-position:center center;text-align:center}}</style>'
      : '';

    // ---- trust bar (3 tags, repeated) ----
    var tags = [L.tag1, L.tag2, L.tag3].filter(Boolean);
    var ICON=['<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>',
              '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>',
              '<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>'];
    var oneSet = tags.map(function(t,idx){ return '<span><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">'+ICON[idx%3]+'</svg><span>'+esc(t)+'</span></span>'; }).join('');
    var trust=''; for (var r=0;r<6;r++) trust+=oneSet;

    // ---- video ----
    var yt = c.video_id || '';
    var videoSection = (L.video_title||yt) ? (
      '<section class="section bg-cream"><div class="container">'
      + '<div class="text-center mb-14 fade-up"><div class="lux-line"></div><p class="eyebrow">'+esc(g.see)+'</p><h2 class="section-title">'+esc(L.video_title||('Watch How '+(L.name||'')+' Works'))+'</h2></div>'
      + '<div class="tf-video fade-up" id="tfVideo"><button class="tf-video-frame" type="button" data-yt="'+esc(yt)+'" aria-label="Play video">'
      + '<img src="'+esc(hero)+'" alt="'+esc(L.name||'')+' at Hollywood Clinic">'
      + '<span class="tf-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></button></div>'
      + (L.video_note?'<p class="tf-video-note">'+esc(L.video_note)+'</p>':'')
      + '</div></section>'
    ) : '';

    // ---- list / steps / compare builders ----
    function ul(items, warn){ return '<ul class="tf-list'+(warn?' tf-warn':'')+'">'+arr(items).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>'; }
    function steps(items){ return '<div class="tf-steps">'+arr(items).map(function(x){return '<div class="tf-step"><p>'+esc(x)+'</p></div>';}).join('')+'</div>'; }
    function compare(items){ return '<div class="tf-compare">'+arr(items).map(function(x){return '<div class="tf-comp"><h4>'+esc(x.label)+'</h4><p>'+esc(x.text)+'</p></div>';}).join('')+'</div>'; }
    function item(n,title,bodyHtml,extra){ return '<details class="tf-item fade-up'+(extra||'')+'"><summary><span class="tf-item-no">'+n+'</span><h3>'+esc(title)+'</h3>'+CHEV+'</summary><div class="tf-body">'+bodyHtml+'</div></details>'; }

    var no=1, accItems='';
    accItems += item(no++, g.what, '<p class="tf-lead">'+esc(L.about_body||L.about_short||'')+'</p>');
    accItems += item(no++, g.why, '<p class="tf-intro">'+esc(g.introWhy)+'</p>'+ul(L.benefits));
    accItems += item(no++, g.how, '<p class="tf-intro">'+esc(g.introHow)+'</p>'+steps(L.process));
    accItems += item(no++, g.who, ul(L.who));
    accItems += item(no++, g.safety, '<p class="tf-intro">'+esc(g.introSafety)+'</p>'+(L.contra_intro?'<p class="tf-lead" style="font-size:0.92rem">'+esc(L.contra_intro)+'</p>':'')+ul(L.contra,true));
    if (arr(L.tech).length) accItems += item(no++, g.quality, '<p class="tf-intro">'+esc(g.introQuality)+'</p>'+ul(L.tech));
    if (arr(L.compare).length) accItems += item(no++, g.compare, '<p class="tf-intro">'+esc(L.compare_intro||(g.compare))+'</p>'+compare(L.compare));

    // ---- reviews ----
    var revCards = arr(L.reviews).map(function(rv){
      var nm=rv.name||''; var av=esc((nm.trim()[0]||'•').toUpperCase());
      var stars='★★★★★'.slice(0, Math.max(1,Math.min(5, rv.rating||5)));
      return '<article class="review-card review-card--cream">'
        + '<div class="review-card-top"><span class="review-qmark" aria-hidden="true">&ldquo;</span></div>'
        + '<div class="rv-rate-row"><span class="review-stars" aria-hidden="true">'+stars+'</span><span class="rv-date">'+esc(rv.date||'')+'</span></div>'
        + '<p class="review-text">'+esc(rv.text)+'</p>'
        + '<div class="review-author"><span class="review-av" aria-hidden="true">'+av+'</span>'
        + '<span class="review-author-info"><span class="review-name">'+esc(nm)+'</span><span class="rv-tag">'+esc(rv.meta||'')+'</span></span></div></article>';
    }).join('');

    // ---- before/after show row ----
    // the Real Results row — a second pair is shown alongside the first when provided
    var baItems='';
    if (c.ba_before_url && c.ba_after_url)
      baItems += '<div class="tf-baitem">'+baSlider(c.ba_before_url,c.ba_after_url,L.ba_cap2)+'</div>';
    if (c.ba2_before_url && c.ba2_after_url)
      baItems += '<div class="tf-baitem">'+baSlider(c.ba2_before_url,c.ba2_after_url,L.ba_cap1)+'</div>';
    var showBA = baItems ? '<div class="tf-scroll fade-up">'+baItems+'</div>' : '';

    // ---- doctors ----
    var docs = arr(c.doctors).map(function(d){
      var img = d.image_url || (d.slug?DOC.replace('doctors/','')+'' :'');
      var photo = d.image_url || (d.slug?P+'doctors/'+d.slug+'.jpg':'');
      var href = String(d.profile_url||'').replace(/\.html(?=$|[?#])/,'') || (d.slug?DOC+d.slug:'#');
      return '<a class="tf-doc fade-up" href="'+esc(href)+'"><div class="tf-doc-photo"><img src="'+esc(photo)+'" alt="'+esc(d['name_'+lang]||d.name_en||'')+'" loading="lazy"></div>'
        + '<h3>'+esc(d['name_'+lang]||d.name_en||'')+'</h3>'
        + '<span class="tf-doc-role">'+esc(d['role_'+lang]||d.role_en||'')+'</span>'
        + '<span class="tf-doc-link">'+esc(g.view)+'</span></a>';
    }).join('');

    // ---- gallery ----
    var gal = arr(c.gallery); if (!gal.length) gal = [hero].concat(CLINIC); else gal = gal.concat(CLINIC.slice(0, Math.max(0,13-gal.length)));
    var galTiles = gal.filter(Boolean).map(function(u){ return '<button type="button" class="bts-gallery-item" data-full="'+esc(u)+'" aria-label="'+esc(L.name||'')+'"><img src="'+esc(u)+'" alt="'+esc(L.name||'')+'" loading="lazy"></button>'; }).join('');
    // gallery videos come first, so they're visible before "Show more"
    var galVids = arr(c.gallery_videos).filter(function(v){ return v && v.id; }).map(function(v){
      var cap = (rtl && v.cap_ar) ? v.cap_ar : (v.cap_en || L.name || '');
      return '<button type="button" class="bts-gallery-item" data-yt="'+esc(v.id)+'" aria-label="'+esc(cap)+'">'
        + '<img src="https://i.ytimg.com/vi/'+encodeURIComponent(v.id)+'/hqdefault.jpg" alt="'+esc(cap)+'" loading="lazy">'
        + '<span class="bts-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></button>';
    }).join('');
    galTiles = galVids + galTiles;

    var html =
      heroMobCss+'<section class="svc-hero" style="'+heroStyle+'"><div class="hero-bg"></div><div class="container"><div class="svc-hero-inner"><h1 class="fade-up d1"><span>'+esc(L.name||'')+'</span></h1></div></div></section>'
      + '<section class="trust-bar"><div class="trust-bar-inner">'+trust+'</div></section>'
      + videoSection
      + '<section class="section bg-sky"><div class="container"><div class="tf-about fade-up"><div class="lux-line"></div><p class="eyebrow">'+esc(g.about)+'</p><h2 class="section-title">'+esc(L.about_title||('What is '+(L.name||'')+'?'))+'</h2>'
        + '<p style="margin-top:1.25rem">'+esc(L.about_short||'')+'</p>'
        + ((c.ba_before_url&&c.ba_after_url)?'<div class="tf-about-ba">'+baSlider(c.ba_before_url,c.ba_after_url,L.ba_cap1)+'</div>':'')
        + '</div></div></section>'
      + '<section class="section bg-cream"><div class="container"><div class="text-center mb-14 fade-up"><div class="lux-line"></div><p class="eyebrow">'+esc(g.about)+'</p><h2 class="section-title">'+esc(L.benefits_title||((L.name||'')+', In Detail'))+'</h2></div>'
        + '<div class="tf-acc">'+accItems+'</div>'
        + '<div class="tf-show"><div class="tf-show-divider"></div>'
        + (showBA?'<div class="tf-sub-head fade-up"><p class="eyebrow">'+esc(g.real)+'</p><h3 class="tf-sub-title">'+esc(g.ba)+'</h3></div>'+showBA:'')
        + (revCards?'<div class="tf-sub-head fade-up" style="margin-top:2.75rem"><p class="eyebrow">'+esc(g.revEy)+'</p><h3 class="tf-sub-title">'+esc(g.revTi)+'</h3></div><div class="reviews-rows fade-up"><div class="reviews-row reviews-row--a">'+revCards+'</div></div>':'')
        + '</div></div></section>'
      + (arr(L.why).length?'<section class="section bg-sky"><div class="container"><div class="tf-acc"><details class="tf-item tf-item--why fade-up"><summary><span class="tf-item-no"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></span><h3>'+esc(g.whyhc)+'</h3>'+CHEV+'</summary><div class="tf-body">'+ul(L.why)+'</div></details></div></div></section>':'')
      + (arr(L.faq).length?'<section class="section bg-cream"><div class="container"><div class="text-center mb-14 fade-up"><div class="lux-line"></div><p class="eyebrow">'+esc(g.faqEy)+'</p><h2 class="section-title">'+esc(g.faqTi)+'</h2></div><div class="tf-acc">'
        + arr(L.faq).map(function(f){return '<details class="tf-item fade-up"><summary><h3>'+esc(f.q)+'</h3>'+CHEV+'</summary><div class="tf-body"><p class="tf-lead" style="font-size:0.95rem">'+esc(f.a)+'</p></div></details>';}).join('')
        + '</div></div></section>':'')
      + (docs?'<section class="section bg-sky"><div class="container"><div class="text-center mb-14 fade-up"><div class="lux-line"></div><p class="eyebrow">'+esc(g.spec)+'</p><h2 class="section-title">'+esc(g.docTi)+'</h2></div><div class="tf-docs">'+docs+'</div></div></section>':'')
      + '<section class="section bg-cream"><div class="container"><div class="text-center mb-14 fade-up"><div class="lux-line"></div><p class="eyebrow">'+esc(g.galEy)+'</p><h2 class="section-title">'+esc(L.gallery_title||((L.name||'')+' Gallery'))+'</h2><p class="section-subtitle">'+esc(g.galSub)+'</p></div>'
        + '<div class="bts-gallery bts-bento is-collapsed fade-up">'+galTiles+'</div>'
        + '<div class="bts-gallery-more-wrap"><button type="button" class="bts-gallery-more" aria-expanded="false"><span class="lbl-more">'+esc(g.more)+'</span><span class="lbl-less">'+esc(g.less)+'</span><svg class="bts-more-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button></div>'
        + '</div></section>'
      + '<div class="bts-lightbox" id="bts-lightbox"><button class="bts-lb-close" aria-label="Close">&times;</button><div class="bts-lb-counter"></div><button class="bts-lb-nav bts-lb-prev" aria-label="Previous">&#10094;</button><figure class="bts-lb-figure"><img class="bts-lb-img" src="" alt=""><figcaption class="bts-lb-cap"></figcaption></figure><button class="bts-lb-nav bts-lb-next" aria-label="Next">&#10095;</button></div>'
      + '<section class="section cta-banner"><div class="container"><div class="cta-icon"><svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg></div>'
        + '<h2>'+esc(g.ctaTi)+'</h2><p>'+esc(g.ctaSub)+'</p><div class="hero-cta" style="justify-content:center"><a href="'+BK+'booking" class="btn btn-primary">'+esc(g.book)+'</a><a href="tel:+201000007176" class="btn btn-ghost-light">'+esc(g.call)+'</a></div></div></section>';

    return html.replace(/__BEFORE__/g, esc(g.before)).replace(/__AFTER__/g, esc(g.after));
  }

  /* ───────── behaviors (self-contained; run after each render) ───────── */
  function initBehaviors(root){
    var rtl = document.body.getAttribute('dir')==='rtl';
    // Before/After sliders
    root.querySelectorAll('.ba-slider').forEach(function(slider){
      var before=slider.querySelector('.ba-before'), handle=slider.querySelector('.ba-handle');
      if(!before||!handle) return; var dragging=false;
      function set(p){ p=Math.max(5,Math.min(95,p)); handle.style.left=p+'%'; before.style.clipPath = rtl?('inset(0 0 0 '+p+'%)'):('inset(0 '+(100-p)+'% 0 0)'); }
      function mv(x){ var r=slider.getBoundingClientRect(); set(((x-r.left)/r.width)*100); }
      slider.addEventListener('mousedown',function(e){dragging=true;mv(e.clientX);e.preventDefault();});
      slider.addEventListener('touchstart',function(e){dragging=true;mv(e.touches[0].clientX);},{passive:true});
      window.addEventListener('mousemove',function(e){if(dragging)mv(e.clientX);});
      window.addEventListener('touchmove',function(e){if(dragging)mv(e.touches[0].clientX);},{passive:true});
      window.addEventListener('mouseup',function(){dragging=false;});
      window.addEventListener('touchend',function(){dragging=false;});
      var io=new IntersectionObserver(function(es){es.forEach(function(en){ if(en.isIntersecting&&!slider.dataset.an){slider.dataset.an='1'; setTimeout(function(){set(35);},300); io.unobserve(slider);} });},{threshold:0.4});
      io.observe(slider);
      set(50);
    });
    // Video facade — click to play, with sound (click is the user gesture browsers require)
    var vbtn = root.querySelector('.tf-video-frame');
    if (vbtn){
      var wrap = root.querySelector('#tfVideo'); var yt=vbtn.getAttribute('data-yt'); var played=false; var uGest=false;
      function ytpost(ifr,fn){ try{ ifr.contentWindow.postMessage(JSON.stringify({event:'command',func:fn,args:[]}),'*'); }catch(_){}}
      function sBtn(w,ifr){ if(w.querySelector('.tf-sound-btn'))return; var b=document.createElement('button'); b.type='button'; b.className='tf-sound-btn'; b.setAttribute('aria-label',(document.documentElement.lang==='ar'?'اضغطي للصوت':'Tap for sound')); b.innerHTML='<svg viewBox=\'0 0 24 24\' fill=\'currentColor\'><path d=\'M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z\'/></svg><span>'+(document.documentElement.lang==='ar'?'الصوت':'Sound')+'</span>'; b.addEventListener('click',function(ev){ev.stopPropagation();uGest=true;ytpost(ifr,'unMute');ytpost(ifr,'playVideo');b.remove();}); w.appendChild(b); }
      function load(wantSound){ if(played||!yt) return; played=true; var mute=!wantSound; var ifr=document.createElement('iframe');
        ifr.src='https://www.youtube.com/embed/'+yt+'?autoplay=1&rel=0&playsinline=1&enablejsapi=1'+(mute?'&mute=1':''); ifr.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'; ifr.setAttribute('allowfullscreen','');
        wrap.innerHTML=''; wrap.appendChild(ifr);
        if(mute){ setTimeout(function(){ if(uGest){ytpost(ifr,'unMute');ytpost(ifr,'playVideo');} else {sBtn(wrap,ifr);} },400); } }
      document.addEventListener('pointerdown',function(){uGest=true;},{passive:true});
      vbtn.addEventListener('click',function(){uGest=true;load(true);});
      var vio=new IntersectionObserver(function(es){es.forEach(function(en){ if(en.isIntersecting&&en.intersectionRatio>0.6){ load(uGest); vio.disconnect(); } });},{threshold:[0,0.6,1],rootMargin:'-20% 0px -20% 0px'});
      vio.observe(vbtn);
    }
    // Gallery show-more toggle
    var more = root.querySelector('.bts-gallery-more'); var grid=root.querySelector('.bts-gallery');
    if(more&&grid){ more.addEventListener('click',function(){ var open=grid.classList.toggle('is-collapsed')===false; grid.classList.toggle('is-expanded',open); more.setAttribute('aria-expanded',open?'true':'false'); }); }
    // Lightbox
    var lb=root.querySelector('#bts-lightbox'); if(lb){
      var imgs=[].slice.call(root.querySelectorAll('.bts-gallery-item')); var idx=0;
      var lbImg=lb.querySelector('.bts-lb-img'), cnt=lb.querySelector('.bts-lb-counter');
      function show(i){ idx=(i+imgs.length)%imgs.length; lbImg.src=imgs[idx].getAttribute('data-full'); cnt.textContent=(idx+1)+' / '+imgs.length; }
      imgs.forEach(function(b,i){ b.addEventListener('click',function(){ show(i); lb.classList.add('open'); }); });
      lb.querySelector('.bts-lb-close').addEventListener('click',function(){lb.classList.remove('open');});
      lb.querySelector('.bts-lb-prev').addEventListener('click',function(){show(idx-1);});
      lb.querySelector('.bts-lb-next').addEventListener('click',function(){show(idx+1);});
      lb.addEventListener('click',function(e){ if(e.target===lb) lb.classList.remove('open'); });
    }
    // Hero letter reveal + particles
    var hero=root.querySelector('.svc-hero'); var h1=hero&&hero.querySelector('h1 span');
    if(h1&&!h1.dataset.an){ h1.dataset.an='1'; var txt=h1.textContent; h1.innerHTML=''; txt.split('').forEach(function(ch,i){ var s=document.createElement('span'); s.textContent=ch===' '?'\u00a0':ch; s.style.cssText='display:inline-block;opacity:0;transform:translateY(18px);transition:opacity .5s '+(i*0.04)+'s,transform .5s '+(i*0.04)+'s'; h1.appendChild(s); }); requestAnimationFrame(function(){ h1.querySelectorAll('span').forEach(function(s){s.style.opacity='1';s.style.transform='none';}); }); }
    // fade-up on scroll
    var fades=root.querySelectorAll('.fade-up');
    var fio=new IntersectionObserver(function(es){es.forEach(function(en){ if(en.isIntersecting){en.target.classList.add('in');fio.unobserve(en.target);} });},{threshold:0.12});
    fades.forEach(function(f){fio.observe(f);});
  }

  /* ───────── load + render ───────── */
  var SLUG = new URLSearchParams(location.search).get('slug');
  var RECORD = null;
  var layoutReady = false;   // becomes true after i18n.js injects nav/footer (first i18n:applied)

  function maybeRender(){ if(RECORD && layoutReady) render(); }

  function render(){
    if(!RECORD) return;
    var lang = (window.I18N && I18N.current ? I18N.current() : (localStorage.getItem('hc_lang')||'en'));
    var rtl = lang==='ar';
    document.documentElement.setAttribute('dir', rtl?'rtl':'ltr');
    document.body.setAttribute('dir', rtl?'rtl':'ltr');
    var c = RECORD.content || {}; c.hero_image_url = c.hero_image_url || RECORD.hero_image_url;
    var L = c[lang]||c.en||{};
    document.title = (L.name||RECORD.name_en||'Service')+' — Hollywood Clinic';
    var root=document.getElementById('svc-root');
    root.innerHTML = build(c, lang);
    initBehaviors(root);
  }

  function notFound(){
    var root=document.getElementById('svc-root');
    var ar=(localStorage.getItem('hc_lang')||'en')==='ar';
    if(root) root.innerHTML='<section class="section bg-cream"><div class="container" style="text-align:center;padding:5rem 1rem">'
      +'<h1 class="section-title">'+(ar?'الخدمة دي مش موجودة':'This service isn\u2019t available')+'</h1>'
      +'<p style="margin-top:.9rem;color:var(--body)">'+(ar?'يمكن تكون اتشالت أو اتخفيت. جربي تتصفحي كل العلاجات.':'It may have been removed or hidden. Try browsing all treatments.')+'</p>'
      +'<p style="margin-top:1.4rem"><a class="btn btn-primary" href="'+BK+'treatments">'+(ar?'كل العلاجات':'Browse treatments')+'</a></p></div></section>';
  }

  function load(){
    if(!SLUG){ notFound(); return; }
    if(!(window.HC && HC.db)){ return; } // wait for db
    HC.db.from('service_pages').select('*').eq('slug',SLUG).eq('is_active',true).single().then(function(res){
      if(res.error||!res.data){ notFound(); return; }
      RECORD=res.data;
      try{ maybeRender(); }
      catch(err){ console.error('[service-page] render failed:', err); }
    }).catch(function(err){ console.error('[service-page] load failed:', err); notFound(); });
  }

  // DB ready → fetch the record
  var loadStarted=false;
  function tryLoad(){
    if(loadStarted) return;
    if(!(window.HC && HC.db)) return;      // client not up yet
    loadStarted=true; load();
  }
  document.addEventListener('hc:db-ready', tryLoad);
  tryLoad();
  // the client is created asynchronously, so poll briefly rather than relying
  // on having caught the one-time event
  var dbTries=0;
  var dbPoll=setInterval(function(){
    tryLoad();
    if(loadStarted || ++dbTries>80) clearInterval(dbPoll);   // ~8s
  }, 100);
  // Layout injected / language applied → (re)render
  function markLayoutReady(){ layoutReady=true; maybeRender(); }
  document.addEventListener('i18n:applied', markLayoutReady);
  // i18n.js runs before this file, so its first 'i18n:applied' can fire before the
  // listener above exists. Detect the injected nav directly rather than relying on it.
  function checkLayout(){ if(!layoutReady && document.querySelector('nav.nav')) markLayoutReady(); }
  checkLayout();
  document.addEventListener('DOMContentLoaded', checkLayout);
  // watchdog: if nothing has rendered after 10s, explain rather than spin forever
  setTimeout(function(){
    var root=document.getElementById('svc-root');
    if(!root || !/Loading/.test(root.textContent)) return;
    var ar=(localStorage.getItem('hc_lang')||'en')==='ar';
    var why = !SLUG ? (ar?'الرابط ناقص ?slug=':'The address is missing ?slug=')
            : !(window.HC && HC.db) ? (ar?'مفيش اتصال بقاعدة البيانات':'No connection to the database')
            : (ar?'الخدمة دي مش موجودة أو مخفية':'This service is missing or hidden');
    console.error('[service-page] gave up waiting —',
      {slug:SLUG, hasDb:!!(window.HC&&HC.db), layoutReady:layoutReady, record:!!RECORD});
    root.innerHTML='<section class="section bg-cream"><div class="container" style="text-align:center;padding:5rem 1rem">'
      +'<h1 class="section-title">'+(ar?'مش قادرين نعرض الخدمة':'We couldn\u2019t load this service')+'</h1>'
      +'<p style="margin-top:.9rem;color:var(--body)">'+esc(why)+'</p>'
      +'<p style="margin-top:1.4rem"><a class="btn btn-primary" href="'+BK+'treatments">'+(ar?'كل العلاجات':'Browse treatments')+'</a></p></div></section>';
  }, 10000);

  var layoutTries=0;
  var layoutPoll=setInterval(function(){
    checkLayout();
    if(layoutReady || ++layoutTries>60) clearInterval(layoutPoll);   // give up after ~6s
  }, 100);
})();
