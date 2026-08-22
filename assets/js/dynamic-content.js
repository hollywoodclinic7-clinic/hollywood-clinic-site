/* ═══════════════════════════════════════════════════════════════════
   HOLLYWOOD CLINIC — dynamic content
   Renders site sections from the database when available, and falls
   back to the hardcoded HTML if the DB is unreachable or empty.
   Currently powers: homepage doctors section.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function lang(){ return (window.I18N && window.I18N.current && window.I18N.current()) || 'en'; }
  // Stored page_url values in Supabase still end in .html. cleanUrls means those
  // 308-redirect, so strip the extension when turning one into an href. The raw
  // value is untouched everywhere it is used for matching.
  function ch(u){ return String(u==null?'':u).replace(/\.html(?=$|[?#])/, ''); }
  function tr(key, fallback){ try{ if(window.I18N && window.I18N.t){ var v=window.I18N.t(key);
    if(v && v!==key) return v; } }catch(e){} return fallback; }

  // ── Homepage doctors ──────────────────────────────────────────────
  var row = document.getElementById('doctorsRow');
  var DOCTORS = null;

  function card(d){
    var l = lang();
    var name = (l==='ar' && d.name_ar) ? d.name_ar : d.name_en;
    var role = (l==='ar' && d.specialty_ar) ? d.specialty_ar : (d.specialty_en || '');
    var img  = (d.image_url || ('assets/images/doctors/'+d.slug+'.jpg')).replace(/\.(png|webp)$/i, '.jpg');
    var view = tr('doctors.viewprofile','View Profile');
    var href = ch(d.page_url) || ('doctors/profile?slug='+encodeURIComponent(d.slug));
    return '<a href="'+esc(href)+'" class="doctor-home-card">'+
      '<div class="doctor-home-photo"><img src="'+esc(img)+'" alt="'+esc(name)+'" loading="lazy"></div>'+
      '<div class="doctor-home-body"><h3>'+esc(name)+'</h3><p>'+esc(role)+'</p>'+
      '<span class="doctor-home-link">'+esc(view)+'</span></div></a>';
  }
  function renderDoctors(){ if(!row || !DOCTORS || !DOCTORS.length) return;
    row.innerHTML = DOCTORS.map(card).join(''); }
  function loadDoctors(){
    if(!row || !(window.HC && window.HC.db)) return;
    window.HC.db.from('doctors').select('*').eq('is_active',true)
      .order('sort_order',{ascending:true}).then(function(r){
        if(r.error || !r.data || !r.data.length) return;  // keep hardcoded fallback
        DOCTORS = r.data; renderDoctors();
      });
  }

  // ── Doctors page: order + visibility follow the dashboard, added doctors appended ──
  // The seven built-in cards stay as the fallback; when the DB is reachable we re-order
  // them, hide any marked inactive, and append doctors that only exist in the dashboard.
  var docGrid=document.querySelector('[data-doctors-grid]');
  if(docGrid){
    var DOCS=null;
    // "doctors/dr-sara-abdelhameed.html" -> "dr-sara-abdelhameed"
    function docSlug(u){
      if(!u) return '';
      return String(u).replace(/^\.\.\//,'').replace(/^\.\//,'').replace(/^\//,'')
        .replace(/^doctors\//,'').replace(/[?#].*$/,'').replace(/\.html$/,'').toLowerCase();
    }
    function pageCard(d){
      var l=lang();
      var name=(l==='ar'&&d.name_ar)?d.name_ar:d.name_en;
      var role=(l==='ar'&&d.specialty_ar)?d.specialty_ar:(d.specialty_en||'');
      var bio =(l==='ar'&&d.tagline_ar)?d.tagline_ar:(d.tagline_en||'');
      var img =(d.image_url||('assets/images/doctors/'+d.slug+'.jpg')).replace(/\.(png|webp)$/i,'.jpg');
      var href=ch(d.page_url)||('doctors/profile?slug='+encodeURIComponent(d.slug));
      var view=tr('doctors.viewprofile','View Full Profile');
      return '<a href="'+esc(href)+'" class="doctor-card fade-up visible" data-added-doc'+
        ' style="text-decoration:none;color:inherit;display:block">'+
        '<div class="doctor-photo"><img src="'+esc(img)+'" alt="'+esc(name)+'" loading="lazy"'+
        ' style="width:100%;height:100%;object-fit:cover;border-radius:1rem"></div>'+
        '<h3>'+esc(name)+'</h3>'+
        '<p class="doctor-role">'+esc(role)+'</p>'+
        (bio?'<p class="doctor-bio">'+esc(bio)+'</p>':'')+
        '<span class="card-link" style="margin-top:1rem;display:inline-flex">'+esc(view)+'</span></a>';
    }
    function renderDocGrid(){
      if(!DOCS) return;
      Array.prototype.slice.call(docGrid.querySelectorAll('[data-added-doc]')).forEach(function(el){el.remove();});
      var cards=Array.prototype.slice.call(docGrid.querySelectorAll('a.doctor-card:not([data-added-doc])'));
      var byslug={};
      cards.forEach(function(a){ byslug[docSlug(a.getAttribute('href'))]=a; });
      var frag=document.createDocumentFragment(), moved=[], tmp=document.createElement('div');
      DOCS.forEach(function(d){
        var el=byslug[String(d.slug||'').toLowerCase()];
        if(el){
          el.style.display=(d.is_active===false)?'none':'';
          frag.appendChild(el);                        // built-in card, in the dashboard's order
          moved.push(el);
        } else if(d.is_active!==false){
          tmp.innerHTML=pageCard(d);                   // dashboard-only doctor, same position
          while(tmp.firstChild) frag.appendChild(tmp.firstChild);
        }
      });
      // any built-in card the dashboard doesn't know about keeps its place, after the ordered ones
      cards.forEach(function(a){ if(moved.indexOf(a)<0) frag.appendChild(a); });
      docGrid.appendChild(frag);
    }
    function loadDocGrid(){ if(!(window.HC&&window.HC.db)) return;
      window.HC.db.from('doctors').select('*')
        .order('sort_order',{ascending:true}).then(function(r){
          if(r.error||!r.data||!r.data.length) return;  // keep the built-in cards
          DOCS=r.data; renderDocGrid(); }); }
    if(window.HC&&window.HC.db) loadDocGrid();
    document.addEventListener('hc:db-ready', loadDocGrid);
    document.addEventListener('i18n:applied', function(){ if(DOCS) renderDocGrid(); });
  }

  if(window.HC && window.HC.db) loadDoctors();
  document.addEventListener('hc:db-ready', loadDoctors);
  document.addEventListener('i18n:applied', function(){ if(DOCTORS) renderDoctors(); });


  // ── Doctors page: order + visibility follow the dashboard, added doctors appended ──
  // The seven static cards stay as the fallback; when the DB is reachable we re-order them
  // to match `doctors.sort_order`, hide any marked inactive, and append doctors added there.
  var docGrid=document.querySelector('[data-doctors-grid]');
  if(docGrid){
    var DOCS=null;
    // "doctors/dr-sara-abdelhameed.html" -> "dr-sara-abdelhameed"
    function docSlug(u){
      if(!u) return '';
      var m=String(u).replace(/[?#].*$/,'').match(/([^\/]+)\.html$/);
      if(m) return m[1].toLowerCase();
      m=String(u).match(/[?&]slug=([^&]+)/);
      return m?decodeURIComponent(m[1]).toLowerCase():'';
    }
    function docCard(d){
      var l=lang();
      var name=(l==='ar'&&d.name_ar)?d.name_ar:d.name_en;
      var role=(l==='ar'&&d.specialty_ar)?d.specialty_ar:(d.specialty_en||'');
      var blurb=(l==='ar'&&d.tagline_ar)?d.tagline_ar:(d.tagline_en||'');
      if(!blurb){ var bio=(l==='ar'&&d.bio_ar)?d.bio_ar:(d.bio_en||''); blurb=bio.split(/\n\s*\n/)[0]||''; }
      var img=(d.image_url||('assets/images/doctors/'+d.slug+'.jpg')).replace(/\.(png|webp)$/i,'.jpg');
      var href=ch(d.page_url)||('doctors/profile?slug='+encodeURIComponent(d.slug));
      var view=tr('doctors.viewprofile','View Full Profile');
      return '<a href="'+esc(href)+'" class="doctor-card fade-up visible" data-added-doc '+
        'style="text-decoration:none;color:inherit;display:block">'+
        '<div class="doctor-photo"><img src="'+esc(img)+'" alt="'+esc(name)+'" loading="lazy" '+
        'style="width:100%;height:100%;object-fit:cover;border-radius:1rem"></div>'+
        '<h3>'+esc(name)+'</h3>'+
        '<p class="doctor-role">'+esc(role)+'</p>'+
        (blurb?'<p class="doctor-bio">'+esc(blurb)+'</p>':'')+
        '<span class="card-link" style="margin-top:1rem;display:inline-flex">'+esc(view)+'</span></a>';
    }
    function renderDocGrid(){
      if(!DOCS) return;
      Array.prototype.slice.call(docGrid.querySelectorAll('[data-added-doc]')).forEach(function(el){el.remove();});
      var cards=Array.prototype.slice.call(docGrid.querySelectorAll('a.doctor-card:not([data-added-doc])'));
      var byslug={};
      cards.forEach(function(a){ byslug[docSlug(a.getAttribute('href'))]=a; });
      DOCS.forEach(function(d){
        var key=String(d.slug||'').toLowerCase(), el=byslug[key];
        if(el){                                   // a doctor who already has a static page
          el.style.display=(d.is_active===false)?'none':'';
          docGrid.appendChild(el);                // re-append in the dashboard's order
          delete byslug[key];
        } else if(d.is_active!==false){           // added in the dashboard — build a card in place
          var tmp=document.createElement('div');
          tmp.innerHTML=docCard(d);
          if(tmp.firstChild) docGrid.appendChild(tmp.firstChild);
        }
      });
      // any static card the dashboard doesn't know about stays visible, after the ordered ones
      Object.keys(byslug).forEach(function(k){ docGrid.appendChild(byslug[k]); });
    }
    function loadDocGrid(){ if(!(window.HC&&window.HC.db)) return;
      window.HC.db.from('doctors').select('*')
        .order('sort_order',{ascending:true}).then(function(r){
          if(r.error||!r.data||!r.data.length) return;   // keep the static fallback
          DOCS=r.data; renderDocGrid(); }); }
    if(window.HC&&window.HC.db) loadDocGrid();
    document.addEventListener('hc:db-ready', loadDocGrid);
    document.addEventListener('i18n:applied', function(){ if(DOCS) renderDocGrid(); });
  }

  // ── Treatment umbrella sub-grids: order + visibility follow the dashboard ──
  // The static sub-cards stay as the fallback; when the DB is reachable we re-order them
  // to match `treatments.sort_order`, hide any marked inactive, then append added services.
  var subGrid=document.querySelector('.dept-services-grid, .sub-treatments-grid');
  if(subGrid){
    var CAT=null, path=location.pathname;
    ['body-shaping','skin-rejuvenation','hair-restoration','laser','votiva','surgery'].forEach(function(c){
      if(path.indexOf(c)>=0 && !CAT) CAT=c; });
    var ADDED=null, SUBS=null;
    // "treatments/body-shaping/emtone.html" and "body-shaping/emtone.html" -> "body-shaping/emtone"
    function subKey(u){
      if(!u) return '';
      return String(u).replace(/^\.\.\//,'').replace(/^\.\//,'').replace(/^\//,'')
        .replace(/^ar\//,'')   // Arabic twins share the English dashboard keys
        .replace(/^treatments\//,'').replace(/[?#].*$/,'').replace(/\.html$/,'').toLowerCase();
    }
    function addedCard(s){
      var l=lang();
      var name=(l==='ar'&&s.name_ar)?s.name_ar:s.name_en;
      var c=s.content||{};
      var desc=(l==='ar'&&c.ar&&c.ar.about_short)?c.ar.about_short:((c.en&&c.en.about_short)||'');
      var img=s.hero_image_url||(c&&c.hero_image_url)||''; if(img && !/^https?:|^\//.test(img)) img='/'+img;   // root-absolute: works at /ar depth too
      var href='service?slug='+encodeURIComponent(s.slug);
      var rm=tr('services.readmore','Read More');
      return '<a href="'+esc(href)+'" class="sub-card fade-up visible" data-added-svc>'+
        '<div class="sub-card-image">'+(img?'<img src="'+esc(img)+'" alt="'+esc(name)+'" loading="lazy">':'')+'</div>'+
        '<div class="sub-card-body"><h3>'+esc(name)+'</h3><p>'+esc(desc)+'</p>'+
        '<span class="sub-card-link">'+esc(rm)+'</span></div></a>';
    }
    function applySubOrder(){
      if(!SUBS) return;
      var cards=Array.prototype.slice.call(subGrid.querySelectorAll('a.sub-card:not([data-added-svc])'));
      var queue={};
      cards.forEach(function(a){ var k=subKey(a.getAttribute('href')); (queue[k]=queue[k]||[]).push(a); });
      var moved=[], placed={};
      SUBS.forEach(function(t){
        var k=subKey(t.page_url||t.slug), q=queue[k];
        if(q && q.length){
          var el=q.shift(); placed[k]=el;
          el.style.display=(t.is_active===false)?'none':'';
          subGrid.appendChild(el);              // re-append in the dashboard's order
          moved.push(el);
        } else if(placed[k] && t.is_active!==false){
          placed[k].style.display='';           // several rows can share one card
        }
      });
      // anything the dashboard didn't list keeps its relative order, after the ordered ones
      cards.forEach(function(a){ if(moved.indexOf(a)<0) subGrid.appendChild(a); });
      renderAdded();                            // dashboard-added services stay at the end
    }
    function renderAdded(){ if(!ADDED) return;
      Array.prototype.slice.call(subGrid.querySelectorAll('[data-added-svc]')).forEach(function(el){el.remove();});
      if(ADDED.length) subGrid.insertAdjacentHTML('beforeend', ADDED.map(addedCard).join('')); }
    function loadAdded(){ if(!CAT||!(window.HC&&window.HC.db)) return;
      window.HC.db.from('treatments').select('*')
        .order('sort_order',{ascending:true}).then(function(r){
          if(r.error||!r.data) return;
          // only this department's services — matched on category or parent slug
          SUBS=r.data.filter(function(t){ return t.category===CAT || t.parent_slug===CAT; });
          applySubOrder(); });
      window.HC.db.from('service_pages').select('*').eq('category',CAT).eq('is_active',true)
        .order('sort_order',{ascending:true}).then(function(r){
          if(r.error||!r.data) return; ADDED=r.data; renderAdded(); }); }
    if(window.HC&&window.HC.db) loadAdded();
    document.addEventListener('hc:db-ready', loadAdded);
    document.addEventListener('i18n:applied', function(){ if(ADDED) renderAdded(); });
  }

  // ── Homepage "Every Service We Offer": order + visibility follow the dashboard ──
  // The static cards stay as the fallback; when the DB is reachable we re-order them to
  // match `treatments.sort_order`, hide any marked inactive, and append dashboard-added services.
  var allRow=document.querySelector('#all-services .treatment-cards');
  if(allRow){
    var SVC=null, SVC_ADDED=null;
    // "treatments/skin-rejuvenation/botox.html" -> "skin-rejuvenation/botox"
    function svcKey(u){
      if(!u) return '';
      return String(u).replace(/^\.\.\//,'').replace(/^\.\//,'').replace(/^\//,'')
        .replace(/^ar\//,'')   // Arabic twins share the English dashboard keys
        .replace(/^treatments\//,'').replace(/[?#].*$/,'').replace(/\.html$/,'').toLowerCase();
    }
    function svcAddedCard(s){
      var l=lang();
      var name=(l==='ar'&&s.name_ar)?s.name_ar:s.name_en;
      var c=s.content||{};
      var desc=(l==='ar'&&c.ar&&c.ar.about_short)?c.ar.about_short:((c.en&&c.en.about_short)||'');
      var img=s.hero_image_url||(c&&c.hero_image_url)||'';
      var href='treatments/service?slug='+encodeURIComponent(s.slug);
      var rm=tr('services.readmore','Read More');
      return '<a href="'+esc(href)+'" class="card fade-up visible" data-added-svc>'+
        '<div class="card-image">'+(img?'<img src="'+esc(img)+'" alt="'+esc(name)+'" style="width:100%;height:100%;object-fit:cover" loading="lazy">':'')+'</div>'+
        '<div class="card-body"><h3>'+esc(name)+'</h3><p>'+esc(desc)+'</p>'+
        '<span class="card-link">'+esc(rm)+'</span></div></a>';
    }
    function applySvcOrder(){
      if(!SVC) return;
      var cards=Array.prototype.slice.call(allRow.querySelectorAll('a.card:not([data-added-svc])'));
      var queue={};                                   // key -> [elements] (surgery cards share one href)
      cards.forEach(function(a){
        var k=svcKey(a.getAttribute('href'));
        (queue[k]=queue[k]||[]).push(a);
      });
      var moved=[], placed={};
      SVC.forEach(function(t){
        var k=svcKey(t.page_url||t.slug);
        var q=queue[k];
        if(q && q.length){
          var el=q.shift();
          placed[k]=el;
          el.style.display=(t.is_active===false)?'none':'';
          allRow.appendChild(el);                     // re-append in the dashboard's order
          moved.push(el);
        } else if(placed[k]){
          // several services share one card (e.g. the merged Cosmetic Surgery card)
          // → keep that card visible as long as ANY of them is active
          if(t.is_active!==false) placed[k].style.display='';
        }
      });
      // anything the dashboard didn't list keeps its relative order, after the ordered ones
      cards.forEach(function(a){ if(moved.indexOf(a)<0) allRow.appendChild(a); });
      pinSurgeryLast();
    }
    // the merged Cosmetic Surgery card always sits at the very end of the row
    function pinSurgeryLast(){
      var surg=allRow.querySelector('a.card[data-svc-cat="surgery"]');
      if(surg) allRow.appendChild(surg);
    }
    function renderSvcAdded(){
      if(!SVC_ADDED) return;
      Array.prototype.slice.call(allRow.querySelectorAll('[data-added-svc]')).forEach(function(el){el.remove();});
      if(SVC_ADDED.length) allRow.insertAdjacentHTML('beforeend', SVC_ADDED.map(svcAddedCard).join(''));
      pinSurgeryLast();
    }
    function loadAllServices(){
      if(!(window.HC&&window.HC.db)) return;
      window.HC.db.from('treatments').select('*').order('sort_order',{ascending:true}).then(function(r){
        if(r.error||!r.data) return; SVC=r.data; applySvcOrder();
      });
      window.HC.db.from('service_pages').select('*').eq('is_active',true)
        .order('sort_order',{ascending:true}).then(function(r){
          if(r.error||!r.data) return; SVC_ADDED=r.data; renderSvcAdded();
        });
    }
    if(window.HC&&window.HC.db) loadAllServices();
    document.addEventListener('hc:db-ready', loadAllServices);
    document.addEventListener('i18n:applied', function(){ if(SVC_ADDED) renderSvcAdded(); });
  }

  // ── Treatments overview: append dashboard-added departments ──
  var depGrid=document.querySelector('[data-departments-grid]');
  if(depGrid){
    var DEPTS=null, DEPT_ALL=null;
    // "treatments/body-shaping.html" -> "body-shaping"
    function deptKey(u){
      if(!u) return '';
      return String(u).replace(/^\.\.\//,'').replace(/^\.\//,'').replace(/^\//,'')
        .replace(/^ar\//,'')   // Arabic twins share the English dashboard keys
        .replace(/^treatments\//,'').replace(/[?#].*$/,'').replace(/\.html$/,'').toLowerCase();
    }
    function deptCard(d){
      var l=lang();
      var name=(l==='ar'&&d.name_ar)?d.name_ar:d.name_en;
      var desc=(l==='ar'&&d.description_ar)?d.description_ar:(d.description_en||'');
      var img=d.image_url||'';
      var href=ch(d.page_url)||('treatments/department?slug='+encodeURIComponent(d.slug));
      var rm=tr('services.readmore','Read More');
      return '<a href="'+esc(href)+'" class="sub-card fade-up visible" data-added-dept>'+
        '<div class="sub-card-image">'+(img?'<img src="'+esc(img)+'" alt="'+esc(name)+'" loading="lazy">':'')+'</div>'+
        '<div class="sub-card-body"><h3>'+esc(name)+'</h3><p>'+esc(desc)+'</p>'+
        '<span class="sub-card-link">'+esc(rm)+'</span></div></a>';
    }
    // reorder the departments that ship with the page to match the dashboard
    function applyDeptOrder(){
      if(!DEPT_ALL) return;
      var cards=Array.prototype.slice.call(depGrid.querySelectorAll('a.sub-card:not([data-added-dept])'));
      var queue={};
      cards.forEach(function(a){ var k=deptKey(a.getAttribute('href')); (queue[k]=queue[k]||[]).push(a); });
      var moved=[];
      DEPT_ALL.forEach(function(d){
        var q=queue[deptKey(d.page_url||d.slug)];
        if(q && q.length){
          var el=q.shift();
          el.style.display=(d.is_active===false)?'none':'';
          depGrid.appendChild(el);            // re-append in the dashboard's order
          moved.push(el);
        }
      });
      // anything the dashboard doesn't list keeps its relative order, after the ordered ones
      cards.forEach(function(a){ if(moved.indexOf(a)<0) depGrid.appendChild(a); });
      renderDepts();                          // keep dashboard-added departments at the end
    }
    function renderDepts(){ if(!DEPTS) return;
      Array.prototype.slice.call(depGrid.querySelectorAll('[data-added-dept]')).forEach(function(el){el.remove();});
      if(DEPTS.length) depGrid.insertAdjacentHTML('beforeend', DEPTS.map(deptCard).join('')); }
    function loadDepts(){ if(!(window.HC&&window.HC.db)) return;
      window.HC.db.from('departments').select('*')
        .order('sort_order',{ascending:true}).then(function(r){
          if(r.error||!r.data) return;
          DEPT_ALL=r.data;
          DEPTS=r.data.filter(function(d){return d.is_active!==false && d.page_url && d.page_url.indexOf('department.html?slug=')>=0;});
          applyDeptOrder(); }); }
    if(window.HC&&window.HC.db) loadDepts();
    document.addEventListener('hc:db-ready', loadDepts);
    document.addEventListener('i18n:applied', function(){ if(DEPTS) renderDepts(); });
  }

  // ── Media overrides (swap images / videos from the dashboard) ──────
  // Images are keyed by the path the page ships with (leading ../ stripped),
  // videos by their YouTube id. Nothing in the HTML needs tagging.
  function mediaKey(u){
    if(!u) return '';
    return String(u).replace(/^(\.\.\/)+/,'').replace(/^\.\//,'').replace(/^\//,'').split(/[?#]/)[0];
  }
  function applyMedia(){
    if(!(window.HC&&window.HC.db)) return;
    var q=window.HC.db.from('media_overrides').select('*').then(function(r){
      if(r.error||!r.data||!r.data.length) return;
      var img={}, vid={};
      r.data.forEach(function(row){
        if(!row.key||!row.value) return;
        if(row.kind==='video') vid[String(row.key).trim()]=String(row.value).trim();
        else img[mediaKey(row.key)]=String(row.value).trim();
      });
      // <img src>
      document.querySelectorAll('img[src]').forEach(function(el){
        var v=img[mediaKey(el.getAttribute('src'))];
        if(v && el.src!==v){ el.src=v; el.removeAttribute('srcset'); }
      });
      // lightbox full-size sources
      document.querySelectorAll('[data-full]').forEach(function(el){
        var v=img[mediaKey(el.getAttribute('data-full'))];
        if(v) el.setAttribute('data-full',v);
      });
      // inline background-image, e.g. a hero written straight on the element
      document.querySelectorAll('[style*="background-image"]').forEach(function(el){
        var s=el.getAttribute('style')||'';
        s=s.replace(/url\((['"]?)([^'")]+)\1\)/g, function(m,q,u){
          var v=img[mediaKey(u)]; return v?('url('+q+v+q+')'):m; });
        el.setAttribute('style',s);
      });
      // background-image set in a <style> rule — this is how the service page
      // banners are done, so it has to be rewritten in the stylesheet text itself
      document.querySelectorAll('style').forEach(function(st){
        var css=st.textContent;
        if(!css || css.indexOf('url(')<0) return;
        var out=css.replace(/url\((['"]?)([^'")]+)\1\)/g, function(m,q,u){
          var v=img[mediaKey(u)]; return v?('url('+q+v+q+')'):m; });
        if(out!==css) st.textContent=out;
      });
      // YouTube ids — hero player and gallery tiles
      document.querySelectorAll('[data-yt]').forEach(function(el){
        var v=vid[String(el.getAttribute('data-yt')).trim()];
        if(v) el.setAttribute('data-yt',v);
      });
    });
    if(q&&q.catch) q.catch(function(){});   // table not created yet — leave the page as-is
  }
  if(window.HC&&window.HC.db) applyMedia();
  document.addEventListener('hc:db-ready', applyMedia);

  // ── Gallery additions (extra photos / videos added from the dashboard) ──
  // Appended after whatever the page already ships with, so the built-in
  // gallery stays intact and is still the fallback if the DB is unreachable.
  function pageKey(){
    // Arabic twins live at /ar/<same path>. Strip the language prefix so an
    // English page and its Arabic version share one dashboard record —
    // otherwise media overrides and gallery additions would need entering twice.
    var p=location.pathname.replace(/^\/ar(?=\/|$)/,'')
                           .replace(/^\//,'').replace(/\.html$/,'');
    return p.replace(/(^|\/)index$/,'') || 'index';
  }
  function applyGalleryAdditions(){
    var grid=document.querySelector('.bts-gallery');
    if(!grid || !(window.HC&&window.HC.db)) return;
    var gq=window.HC.db.from('gallery_additions').select('*')
      .eq('page_key', pageKey()).order('sort_order',{ascending:true}).then(function(r){
        if(r.error||!r.data) return;
        Array.prototype.slice.call(grid.querySelectorAll('[data-added-media]')).forEach(function(el){el.remove();});
        var l=lang();
        var html=r.data.filter(function(it){return it.is_active!==false && it.value;}).map(function(it){
          var cap=((l==='ar'&&it.caption_ar)?it.caption_ar:it.caption_en)||'';
          if(it.kind==='video'){
            var thumb=it.thumb||('https://i.ytimg.com/vi/'+encodeURIComponent(it.value)+'/hqdefault.jpg');
            return '<button type="button" class="bts-gallery-item" data-added-media data-yt="'+esc(it.value)+'" aria-label="'+esc(cap)+'">'+
              '<img src="'+esc(thumb)+'" alt="'+esc(cap)+'" loading="lazy">'+
              '<span class="bts-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></button>';
          }
          return '<button type="button" class="bts-gallery-item" data-added-media data-full="'+esc(it.value)+'" aria-label="'+esc(cap)+'">'+
            '<img src="'+esc(it.value)+'" alt="'+esc(cap)+'" loading="lazy"></button>';
        }).join('');
        if(html) grid.insertAdjacentHTML('beforeend', html);
      });
    if(gq&&gq.catch) gq.catch(function(){});  // table not created yet — leave the gallery as-is
  }
  if(window.HC&&window.HC.db) applyGalleryAdditions();
  document.addEventListener('hc:db-ready', applyGalleryAdditions);
  document.addEventListener('i18n:applied', applyGalleryAdditions);

  // ── Recommended Doctors on a service page ──────────────────────────
  // Doctors added in the dashboard appear automatically on the service pages of
  // whichever departments they're assigned to. The static cards stay as the fallback.
  var docRow=document.querySelector('.tf-docs');
  if(docRow){
    // page folder -> the code used in a doctor's "Departments" field
    var DEPT_CODE={'body-shaping':'body','skin-rejuvenation':'skin','hair-restoration':'hair',
                   'surgery':'surgical','laser':'skin','votiva':'skin'};
    var myDept=null, pth=location.pathname;
    Object.keys(DEPT_CODE).forEach(function(k){ if(!myDept && pth.indexOf(k)>=0) myDept=DEPT_CODE[k]; });
    var REC=null;
    function recSlug(u){
      if(!u) return '';
      var m=String(u).replace(/[?#].*$/,'').match(/([^\/]+)\.html$/);
      if(m) return m[1].toLowerCase();
      m=String(u).match(/[?&]slug=([^&]+)/);
      return m?decodeURIComponent(m[1]).toLowerCase():'';
    }
    function recCard(d){
      var l=lang();
      var name=(l==='ar'&&d.name_ar)?d.name_ar:d.name_en;
      var role=(l==='ar'&&d.specialty_ar)?d.specialty_ar:(d.specialty_en||'');
      var img=(d.image_url||('assets/images/doctors/'+d.slug+'.jpg')).replace(/\.(png|webp)$/i,'.jpg');
      if(!/^https?:|^\//.test(img)) img='../../'+img;
      var href=d.page_url?('../../'+ch(d.page_url)):('../../doctors/profile?slug='+encodeURIComponent(d.slug));
      var view=tr('bs.emtone.doc.view','View Profile');
      return '<a class="tf-doc fade-up visible" data-added-rec href="'+esc(href)+'">'+
        '<div class="tf-doc-photo"><img src="'+esc(img)+'" alt="'+esc(name)+'" loading="lazy"></div>'+
        '<h3>'+esc(name)+'</h3>'+
        '<span class="tf-doc-role">'+esc(role)+'</span>'+
        '<span class="tf-doc-link">'+esc(view)+'</span></a>';
    }
    function renderRec(){
      if(!REC) return;
      Array.prototype.slice.call(docRow.querySelectorAll('[data-added-rec]')).forEach(function(el){el.remove();});
      var have={};
      docRow.querySelectorAll('a.tf-doc:not([data-added-rec])').forEach(function(a){
        have[recSlug(a.getAttribute('href'))]=a; });
      var add=REC.filter(function(d){ return !have[String(d.slug||'').toLowerCase()]; });
      // a doctor removed from this department (or deactivated) drops off the page
      Object.keys(have).forEach(function(s){
        var row=REC.concat(REC_ALL||[]).filter(function(d){ return String(d.slug||'').toLowerCase()===s; })[0];
        if(row && (row.is_active===false || REC.indexOf(row)<0)) have[s].style.display='none';
        else have[s].style.display='';
      });
      if(add.length) docRow.insertAdjacentHTML('beforeend', add.map(recCard).join(''));
    }
    var REC_ALL=null;
    function loadRec(){ if(!myDept||!(window.HC&&window.HC.db)) return;
      var rq=window.HC.db.from('doctors').select('*').order('sort_order',{ascending:true}).then(function(r){
        if(r.error||!r.data||!r.data.length) return;
        REC_ALL=r.data;
        REC=r.data.filter(function(d){
          if(d.is_active===false) return false;
          var dep=d.department;
          if(typeof dep==='string'){ try{ dep=JSON.parse(dep); }catch(e){ dep=[dep]; } }
          return Array.isArray(dep) && dep.indexOf(myDept)>=0;
        });
        renderRec(); });
      if(rq&&rq.catch) rq.catch(function(){});
    }
    if(window.HC&&window.HC.db) loadRec();
    document.addEventListener('hc:db-ready', loadRec);
    document.addEventListener('i18n:applied', function(){ if(REC) renderRec(); });
  }

  // ── Site copy overrides (edit text from the dashboard) ────────────
  function applySiteCopy(){
    if(!(window.HC&&window.HC.db)) return;
    window.HC.db.from('site_content').select('*').then(function(r){
      if(r.error||!r.data) return;
      var l=lang();
      r.data.forEach(function(row){
        var val=(l==='ar')?row.value_ar:row.value_en;
        if(val==null||val==='') return;
        // Safeguard: a saved override must match the language being shown. If we're
        // in English but the value contains Arabic letters, it's a data-entry mistake
        // in the dashboard — skip it and keep the correct i18n translation.
        if(l==='en' && /[\u0600-\u06FF]/.test(val)) return;
        var sel='[data-i18n="'+String(row.key).replace(/["\\]/g,'')+'"]';
        document.querySelectorAll(sel).forEach(function(el){ el.textContent=val; });
      });
    });
  }
  if(window.HC&&window.HC.db) applySiteCopy();
  document.addEventListener('hc:db-ready', applySiteCopy);
  document.addEventListener('i18n:applied', applySiteCopy);
})();
