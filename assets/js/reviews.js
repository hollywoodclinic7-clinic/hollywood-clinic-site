/**
 * ═══════════════════════════════════════════════════════════════
 * Hollywood Clinic — Reviews Module (Supabase)
 * ═══════════════════════════════════════════════════════════════
 *
 * This module talks to your Supabase project for user reviews.
 *
 * ─── SETUP ──────────────────────────────────────────────────────
 * 1. Sign up at https://supabase.com (free tier is plenty)
 * 2. Create a new project
 * 3. In Project Settings → API, copy:
 *      - Project URL
 *      - anon (public) key
 *    and paste them into the SUPABASE_CONFIG object below.
 * 4. In the SQL Editor, run the schema from /admin/SUPABASE_SETUP.md
 * 5. That's it — the form on the site will start working.
 *
 * The anon key is SAFE to expose publicly; Row Level Security
 * (RLS) policies (set in step 4) control what visitors can read
 * and write. Visitors can ONLY insert reviews and read APPROVED
 * ones. Only logged-in admins can update / approve.
 * ────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  // ⚠️ PASTE YOUR CREDENTIALS HERE WHEN YOU SET UP SUPABASE ⚠️
  const SUPABASE_CONFIG = {
    url: '',     // e.g. 'https://abcdefghij.supabase.co'
    anonKey: ''  // e.g. 'eyJhbGciOiJI...'
  };

  // Credentials now live in assets/js/supabase-config.js (window.HC.db).
  // This stays true so the flow runs; getClient() resolves the shared client.
  const IS_CONFIGURED = true;

  /**
   * Lazy-load the Supabase JS client from CDN, only when needed.
   * Returns a promise that resolves to the supabase client instance.
   */
  let _client = null;
  let _clientPromise = null;

  async function getClient() {
    if (_client) return _client;
    if (_clientPromise) return _clientPromise;

    _clientPromise = (async () => {
      // Prefer the shared client from supabase-config.js
      if (window.HC && window.HC.db) { _client = window.HC.db; return _client; }
      // Wait briefly for supabase-config.js to finish booting
      await new Promise(function (resolve) {
        if (window.HC && window.HC.db) return resolve();
        document.addEventListener('hc:db-ready', resolve, { once: true });
        setTimeout(resolve, 3000);
      });
      if (window.HC && window.HC.db) { _client = window.HC.db; return _client; }

      // Fallback: local credentials (only if supabase-config.js is absent)
      if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
        throw new Error('Supabase not configured. Add assets/js/supabase-config.js.');
      }
      if (typeof window.supabase === 'undefined') {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      _client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      return _client;
    })();

    return _clientPromise;
  }

  /**
   * Submit a new review. Goes to the database with status='pending'.
   *
   * @param {Object} review
   * @param {string} review.name      - Reviewer's name
   * @param {string} review.treatment - Treatment they had
   * @param {number} review.rating    - 1–5
   * @param {string} review.comment   - Review text
   * @param {string} [review.email]   - Optional, for follow-up only (not displayed)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function submitReview(review) {
    if (!IS_CONFIGURED) {
      return {
        success: false,
        error: 'Reviews are temporarily unavailable. Please try again later.'
      };
    }
    try {
      const client = await getClient();
      const { error } = await client.from('reviews').insert([{
        name: review.name.trim().slice(0, 60),
        treatment: review.treatment.trim().slice(0, 80),
        rating: Math.max(1, Math.min(5, parseInt(review.rating, 10) || 5)),
        comment: review.comment.trim().slice(0, 1000),
        email: (review.email || '').trim().slice(0, 120) || null,
        status: 'pending',
        language: (window.I18N && window.I18N.current()) || 'en',
        created_at: new Date().toISOString()
      }]);
      if (error) {
        console.error('[Reviews] insert error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e) {
      console.error('[Reviews] submitReview error:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Fetch approved reviews, newest first.
   *
   * @param {Object} [options]
   * @param {number} [options.limit=20] - Max number to return (max 100)
   * @returns {Promise<Array>} Array of review objects
   */
  async function fetchApproved(options = {}) {
    if (!IS_CONFIGURED) return [];
    try {
      const limit = Math.min(100, options.limit || 20);
      const client = await getClient();
      const { data, error } = await client
        .from('reviews')
        .select('id, name, treatment, rating, comment, language, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) {
        console.error('[Reviews] fetchApproved error:', error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error('[Reviews] fetchApproved error:', e);
      return [];
    }
  }

  /**
   * Fetch pending reviews (admin only — RLS will block non-admins).
   */
  async function fetchPending() {
    if (!IS_CONFIGURED) return [];
    try {
      const client = await getClient();
      const { data, error } = await client
        .from('reviews')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[Reviews] fetchPending error:', error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error('[Reviews] fetchPending error:', e);
      return [];
    }
  }

  /**
   * Approve or reject a review (admin only — RLS will block non-admins).
   */
  async function setReviewStatus(reviewId, newStatus) {
    if (!IS_CONFIGURED) return { success: false, error: 'Not configured' };
    if (!['approved', 'rejected'].includes(newStatus)) {
      return { success: false, error: 'Invalid status' };
    }
    try {
      const client = await getClient();
      const { error } = await client
        .from('reviews')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', reviewId);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Sign in an admin user (email + password). Required to approve/reject reviews.
   */
  async function adminSignIn(email, password) {
    if (!IS_CONFIGURED) return { success: false, error: 'Not configured' };
    try {
      const client = await getClient();
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Sign out the current admin.
   */
  async function adminSignOut() {
    if (!IS_CONFIGURED) return;
    const client = await getClient();
    await client.auth.signOut();
  }

  /**
   * Check whether someone is currently signed in.
   */
  async function getCurrentUser() {
    if (!IS_CONFIGURED) return null;
    try {
      const client = await getClient();
      const { data: { user } } = await client.auth.getUser();
      return user;
    } catch (e) {
      return null;
    }
  }

  // Expose the API
  window.HCReviews = {
    isConfigured: () => IS_CONFIGURED,
    submitReview,
    fetchApproved,
    fetchPending,
    setReviewStatus,
    adminSignIn,
    adminSignOut,
    getCurrentUser
  };
})();
