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
    gaMeasurementId: "",

    // Buttondown username, e.g. "digigames" (from your profile URL:
    // buttondown.email/<username>). Sign up free at https://buttondown.email
    // Leave "" and the footer subscribe form shows an honest
    // "opening soon" note instead of submitting anywhere.
    buttondownUsername: "",
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
