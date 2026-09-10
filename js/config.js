/* =========================================================
   Digi-games — site config
   The ONE file to edit when connecting analytics or the
   newsletter provider. Every page loads this before site.js.
   ========================================================= */
(function () {
  "use strict";

  window.GC_CONFIG = {
    // Google Analytics 4 Measurement ID, e.g. "G-XXXXXXXXXX".
    // Get one free at https://analytics.google.com — Admin > Data Streams
    // > Web > (your stream) > Measurement ID. Leave "" to skip analytics
    // entirely (no script loads, nothing is tracked).
    gaMeasurementId: "G-WW3W229PGJ",

    // Buttondown username, e.g. "digigames" (from your profile URL:
    // buttondown.email/<username>). Sign up free at https://buttondown.email
    // Leave "" and the footer subscribe form shows an honest
    // "opening soon" note instead of submitting anywhere.
    buttondownUsername: "esmaeily",

    // Supabase project URL + publishable ("anon") key. Powers both the
    // ratings/reviews backend (js/site.js renderReviewsSection) and the
    // account-gated wishlist (js/site.js GC.wishlist) — both require a
    // signed-in account (email magic link) to write. The publishable key
    // is safe to expose client-side by design — access is controlled by
    // each table's Row Level Security policies, not by keeping this value
    // secret. Leave either "" to make reviews/wishlist show "temporarily
    // unavailable" instead of erroring.
    supabaseUrl: "https://cmzizvvqawgqxajqdzey.supabase.co",
    supabasePublishableKey: "sb_publishable_1eDUbCmz8sf5SPmJmTTn6g_gldK6iAN",

    // Affiliate deep-link templates for the "Also search for it at" row on
    // every PC game's price card (js/site.js renderAffiliateRow). Each key
    // is left "" until you're accepted into that store's affiliate program
    // (Green Man Gaming, Fanatical, and GOG all run theirs through an
    // affiliate network — most commonly Awin) and pull a deep-link
    // template from your dashboard's link-generator tool. Paste it in with
    // literal "{url}" where the destination link goes, e.g. an Awin-style
    // template looks like:
    //   "https://www.awin1.com/cread.php?awinmid=XXXX&awinaffid=YOURID&clickref=&p={url}"
    // Until a key is filled in, that store's link is still a real, direct
    // search-result link on the store's own site — it just isn't tracked
    // for commission yet.
    affiliateLinkTemplates: {
      greenmangaming: "",
      fanatical: "",
      gog: "",
    },
  };

  // ---- GA4 bootstrap (only runs if a Measurement ID is set above) ----
  const id = window.GC_CONFIG.gaMeasurementId;
  if (id) {
    const tag = document.createElement("script");
    tag.async = true;
    tag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(tag);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", id, { anonymize_ip: true });
  }
})();
