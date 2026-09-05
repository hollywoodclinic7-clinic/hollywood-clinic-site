/* ============================================================
   Hollywood Clinic — Supabase connection + staff auth
   ------------------------------------------------------------
   Paste your anon key below (Supabase → Project Settings → API →
   "anon / public" — NOT service_role). Then upload this file to:
        assets/js/supabase-config.js

   Provides:
     • window.HC.db    → Supabase client (reviews, bookings, content)
     • window.HC.auth  → staff auth used by /admin/* :
         signIn(email,pw) → returns { data, error }   (does NOT throw)
         signOut()        → signs out
         user()           → returns { data: { user } }
         isAdmin()        → true if the user's email is in the admins table
   ============================================================ */

(function () {
  var SUPABASE_URL      = "https://dtlgclhgjvqpkqnxwawj.supabase.co";   // ← your Project URL
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bGdjbGhnanZxcGtxbnh3YXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTM0MDUsImV4cCI6MjA5NjQ4OTQwNX0.9_aghjvVGMER4ASkYk5PdzuG8XWje_EUjS-Zbthn0G4";            // ← your anon/public key

  window.HC = window.HC || {};

  function boot() {
    var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.HC.db = db;

    window.HC.auth = {
      // Returns { data, error } — the login page checks res.error itself.
      async signIn(email, password) {
        return await db.auth.signInWithPassword({ email: email, password: password });
      },
      async signOut() {
        return await db.auth.signOut();
      },
      // Returns { data: { user } } — matches what login.html / dashboard.html expect.
      async user() {
        return await db.auth.getUser();
      },
      // true only if the signed-in user's email is listed in the "admins" table.
      async isAdmin() {
        var res = await db.auth.getUser();
        var u = res && res.data ? res.data.user : null;
        if (!u) return false;
        try {
          var r = await db.from('admins').select('email').eq('email', u.email).maybeSingle();
          if (r.error) { console.error('isAdmin check failed:', r.error); return false; }
          return !!r.data;
        } catch (e) {
          console.error('isAdmin error:', e);
          return false;
        }
      }
    };

    // record readiness as well as announcing it — a script that loads after this
    // point would otherwise miss the event and wait forever
    window.HC.ready = true;
    document.dispatchEvent(new Event('hc:db-ready'));
  }

  if (window.supabase && window.supabase.createClient) {
    boot();
  } else {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    s.onload = boot;
    s.onerror = function () { console.error('Could not load Supabase library from CDN.'); };
    document.head.appendChild(s);
  }
})();
