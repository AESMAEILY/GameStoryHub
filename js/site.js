/* =========================================================
   Digi-games — shared site logic
   Works off data/games.json (client-side only, no backend).
   Every page includes this file and sets:
     window.GC_ROOT = "./"   (pages at site root: index.html, browse.html)
     window.GC_ROOT = "../"  (pages under /games/*.html)
   ========================================================= */

(function () {
  "use strict";

  const ROOT = window.GC_ROOT || "./";
  const DATA_URL = ROOT + "data/games.json";
  const UPCOMING_URL = ROOT + "data/upcoming.json";

  const GC = {
    games: [],
    ready: null,
    readyUpcoming: null,
  };
  window.GameCodex = GC;

  GC.ready = fetch(DATA_URL)
    .then((r) => {
      if (!r.ok) throw new Error("Failed to load games.json: " + r.status);
      return r.json();
    })
    .then((games) => {
      GC.games = games;
      document.dispatchEvent(new CustomEvent("gc:data-ready", { detail: games }));
      return games;
    })
    .catch((err) => {
      console.error("[GameCodex] Could not load game data.", err);
      document.dispatchEvent(new CustomEvent("gc:data-error", { detail: err }));
      return [];
    });

  // Real, individually-researched anticipated/not-yet-released titles for
  // the home hero carousel — a separate small dataset from the 50-game
  // walkthrough catalog above, since none of those games are unreleased.
  GC.readyUpcoming = fetch(UPCOMING_URL)
    .then((r) => {
      if (!r.ok) throw new Error("Failed to load upcoming.json: " + r.status);
      return r.json();
    })
    .catch((err) => {
      console.error("[GameCodex] Could not load upcoming-games data.", err);
      return [];
    });

  // ---------- helpers ----------
  function gamePath(slug) {
    return ROOT + "games/" + slug + ".html";
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function initials(title) {
    const words = title.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean);
    if (words.length === 0) return "?";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  }

  function year(iso) { return iso.slice(0, 4); }

  GC.util = { gamePath, escapeHtml, initials, formatDate, year };

  // ---------- poster watermark icons ----------
  // Simple original line-icons, one concept per genre — see scripts/genre_icons.py
  // for the canonical source (mirrored here for client-side rendering).
  const GENRE_ICONS = {
    "Metroidvania": '<circle cx="16" cy="20" r="5"/><circle cx="48" cy="16" r="5"/><circle cx="32" cy="48" r="5"/><path d="M20 23 L44 18 M18 24 L30 45 M46 20 L34 45"/>',
    "Roguelike": '<rect x="14" y="14" width="36" height="36" rx="7"/><circle cx="24" cy="24" r="2.6" fill="currentColor" stroke="none"/><circle cx="40" cy="24" r="2.6" fill="currentColor" stroke="none"/><circle cx="32" cy="32" r="2.6" fill="currentColor" stroke="none"/><circle cx="24" cy="40" r="2.6" fill="currentColor" stroke="none"/><circle cx="40" cy="40" r="2.6" fill="currentColor" stroke="none"/>',
    "Action RPG": '<path d="M32 6 L32 38 M32 6 L27 15 L37 15 Z M20 38 H44 M32 38 V56 M25 47 H39"/>',
    "RPG": '<path d="M32 8 L52 16 V30 C52 45 43 54 32 58 C21 54 12 45 12 30 V16 Z M32 20 V44 M22 32 H42"/>',
    "JRPG": '<path d="M20 24 L32 6 L44 24 L38 54 L26 54 Z M20 24 H44 M32 6 V24"/>',
    "Turn-Based RPG": '<path d="M17 8 H47 M17 56 H47 M19 8 C19 24 45 24 45 8 M19 56 C19 40 45 40 45 56"/>',
    "Action Adventure": '<circle cx="32" cy="32" r="23"/><path d="M32 15 L39 32 L32 49 L25 32 Z"/>',
    "3D Platformer": '<path d="M8 52 H20 V40 H32 V28 H44 V16" /><path d="M12 42 C18 24 32 18 46 14" stroke-dasharray="1 7"/>',
    "Co-op Platformer": '<path d="M8 52 H20 V40 H32 V28 H44 V16" /><path d="M12 42 C18 24 32 18 46 14" stroke-dasharray="1 7"/>',
    "Co-op Action Adventure": '<circle cx="25" cy="32" r="16"/><circle cx="39" cy="32" r="16"/>',
    "Survival Horror": '<path d="M6 32 C15 16 49 16 58 32 C49 48 15 48 6 32 Z"/><circle cx="32" cy="32" r="7.5"/><path d="M33 24 L29 8 M41 26 L54 16"/>',
    "Tactical Shooter": '<circle cx="32" cy="32" r="19"/><circle cx="32" cy="32" r="4" fill="currentColor" stroke="none"/><path d="M32 4 V16 M32 48 V60 M4 32 H16 M48 32 H60"/>',
    "VR Shooter": '<path d="M13 33 C13 17 21 9 32 9 C43 9 51 17 51 33"/><rect x="7" y="29" width="13" height="17" rx="4.5"/><rect x="44" y="29" width="13" height="17" rx="4.5"/>',
    "Puzzle": '<path d="M18 18 H30 C30 11 41 11 41 18 H53 V30 C60 30 60 41 53 41 V53 H41 C41 60 30 60 30 53 H18 V41 C11 41 11 30 18 30 Z"/>',
    "Life Simulation": '<path d="M10 34 L32 14 L54 34"/><path d="M17 31 V53 H47 V31"/><path d="M27 44 C24 40 18 41 18 46 C18 51 27 56 27 56 C27 56 36 51 36 46 C36 41 30 40 27 44"/>',
    "Farming Simulation": '<path d="M32 58 V18 M32 18 L23 9 M32 18 L41 9 M32 29 L23 20 M32 29 L41 20 M32 40 L23 31 M32 40 L41 31"/>',
    "Sandbox Survival": '<path d="M32 6 L54 18 V42 L32 54 L10 42 V18 Z M32 6 V30 M10 18 L32 30 L54 18 M32 30 V54"/>',
    "MMORPG": '<circle cx="32" cy="32" r="23"/><path d="M9 32 H55 M32 9 C19 20 19 44 32 55 C45 44 45 20 32 9 Z"/>',
  };
  function genreIcon(genre) {
    return GENRE_ICONS[genre] || GENRE_ICONS["Action Adventure"];
  }

  // ---------- tile rendering ----------
  // mode: "grid" (default tiles) — used on home trending + browse
  function posterArtHTML(game) {
    if (game.poster) {
      return `<img class="tile-photo" src="${ROOT}${game.poster}" alt="${escapeHtml(game.title)} cover art" loading="lazy" decoding="async">
          <div class="tile-vignette"></div>
          <div class="tile-shine"></div>`;
    }
    return `<div class="tile-art-bg"></div>
          <span class="poster-icon"><svg viewBox="0 0 64 64">${genreIcon(game.genres[0])}</svg></span>
          <div class="tile-vignette"></div>
          <div class="tile-shine"></div>
          <span class="poster-badge"><span class="tile-initial">${initials(game.title)}</span></span>`;
  }

  // Compact critic-score badge shown right next to the title on every tile
  // (browse grid, home trending, wishlist, related games) — the official
  // score, since that's the one number every game actually has.
  function tileScoreHTML(game) {
    const os = game.officialScore;
    if (!os || typeof os.value !== "number") return "";
    return `<span class="tile-score" title="Official critic score: ${Math.round(os.value)}/100 via ${escapeHtml(os.source || "critics")}">
      <svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.8 7.1-.7z"/></svg>${Math.round(os.value)}
    </span>`;
  }

  function tileHTML(game) {
    const yt = game.youtube;
    return `
    <article class="tile reveal" data-slug="${game.slug}" style="--tile-accent:${game.accent};--tile-accent2:${game.accent2}">
      <a class="tile-media" href="${gamePath(game.slug)}" data-yt="${yt.id}" aria-label="Open ${escapeHtml(game.title)}">
        <span class="tile-genre-badge">${escapeHtml(game.genres[0])}</span>
        <div class="tile-art${game.poster ? " has-photo" : ""}">
          ${posterArtHTML(game)}
        </div>
        <iframe class="tile-preview" tabindex="-1" title="" data-id="${yt.id}"></iframe>
        <span class="play-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </span>
      </a>
      <button type="button" class="tile-wishlist" data-wishlist-slug="${game.slug}" aria-label="Add ${escapeHtml(game.title)} to wishlist" aria-pressed="false">${HEART_ICON}</button>
      <div class="tile-body">
        <div class="tile-title-row">
          <a href="${gamePath(game.slug)}">
            <h3 class="tile-title">${escapeHtml(game.title)}</h3>
          </a>
          ${tileScoreHTML(game)}
        </div>
        <div class="tile-meta">
          <span>${year(game.releaseDate)}</span>
          <span class="dot">&middot;</span>
          <span>${escapeHtml(game.platforms[0])}${game.platforms.length > 1 ? " +" + (game.platforms.length - 1) : ""}</span>
        </div>
      </div>
    </article>`;
  }

  function renderGrid(container, games) {
    if (!container) return;
    if (games.length === 0) {
      container.innerHTML = `<div class="no-results"><strong>No games matched.</strong>Try a different title, genre, or platform.</div>`;
      return;
    }
    container.innerHTML = games.map(tileHTML).join("");
    wireHoverPreviews(container);
    wireTilt(container);
    wireReveal(container);
    paintWishlistButtons(container);
  }
  GC.renderGrid = renderGrid;
  GC.genreIcon = genreIcon;
  GC.posterArtHTML = posterArtHTML;

  // ---------- pointer-tilt on poster art ----------
  function wireTilt(scope) {
    const medias = (scope || document).querySelectorAll(".tile-media, .game-cover");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    medias.forEach((media) => {
      media.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        const rect = media.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        media.style.setProperty("--ry", (px * 14).toFixed(2) + "deg");
        media.style.setProperty("--rx", (py * -14).toFixed(2) + "deg");
      });
      media.addEventListener("pointerleave", () => {
        media.style.setProperty("--rx", "0deg");
        media.style.setProperty("--ry", "0deg");
      });
    });
  }
  GC.wireTilt = wireTilt;

  // ---------- scroll-reveal for grid tiles ----------
  function wireReveal(scope) {
    const els = (scope || document).querySelectorAll(".reveal");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        entry.target.classList.add("in");
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach((el, i) => {
      el.style.transitionDelay = Math.min(i % 12, 8) * 35 + "ms";
      io.observe(el);
    });
  }
  GC.wireReveal = wireReveal;

  // ---------- hover-preview (muted autoplay YouTube on hover) ----------
  function wireHoverPreviews(scope) {
    const medias = (scope || document).querySelectorAll(".tile-media[data-yt]");
    medias.forEach((media) => {
      const iframe = media.querySelector(".tile-preview");
      let timer = null;
      media.addEventListener("mouseenter", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const id = iframe.dataset.id;
          if (!iframe.src) {
            iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1&rel=0`;
          }
          iframe.classList.add("active");
        }, 320); // small delay so casual mouse passes don't spin up video
      });
      media.addEventListener("mouseleave", () => {
        clearTimeout(timer);
        iframe.classList.remove("active");
        iframe.src = ""; // stop playback/loading entirely
      });
    });
  }
  GC.wireHoverPreviews = wireHoverPreviews;

  // ---------- main video player (official YouTube IFrame Player API) ----------
  // Loads the real https://www.youtube.com/iframe_api script once, then mounts
  // YT.Player instances on demand. Playback happens fully inside our page via
  // postMessage — nothing here ever navigates the top-level page to youtube.com.
  // (YouTube's own player chrome still shows its small logo/title as a link,
  // per YouTube's platform terms — that one element can't be removed by any
  // embed method, API-driven or not. Everything else — play, pause, the whole
  // watch experience — stays on this page.)
  let ytApiPromise = null;
  function loadYouTubeApi() {
    if (ytApiPromise) return ytApiPromise;
    ytApiPromise = new Promise((resolve) => {
      if (window.YT && window.YT.Player) { resolve(window.YT); return; }
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prevReady === "function") prevReady();
        resolve(window.YT);
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    });
    return ytApiPromise;
  }

  // mountId: id of an empty element to mount the player into (replaced in place).
  function mountYouTubePlayer(mountId, videoId, opts) {
    const el = document.getElementById(mountId);
    if (!el) return null;
    let player = null;
    loadYouTubeApi().then((YT) => {
      // element may have been removed already (SPA nav away before API loaded)
      if (!document.getElementById(mountId)) return;
      const playerVars = { rel: 0, modestbranding: 1, playsinline: 1, enablejsapi: 1 };
      if (window.location.origin && window.location.origin.indexOf("http") === 0) {
        playerVars.origin = window.location.origin;
      }
      player = new YT.Player(mountId, {
        videoId: videoId,
        playerVars: Object.assign(playerVars, opts || {}),
      });
    });
    return { destroy: () => { if (player && player.destroy) player.destroy(); } };
  }
  GC.mountYouTubePlayer = mountYouTubePlayer;

  // ---------- search (shared logic for nav + hero + browse) ----------
  function searchGames(games, query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return games.filter((g) => {
      return (
        g.title.toLowerCase().includes(q) ||
        g.genres.some((x) => x.toLowerCase().includes(q)) ||
        g.platforms.some((x) => x.toLowerCase().includes(q)) ||
        g.developer.toLowerCase().includes(q)
      );
    }).slice(0, 8);
  }
  GC.searchGames = searchGames;

  function resultRowHTML(game) {
    return `<a href="${gamePath(game.slug)}" style="--tile-accent:${game.accent}">
      <span class="swatch" style="background:linear-gradient(135deg, ${game.accent}, ${game.accent2})"></span>
      <span>
        <div>${escapeHtml(game.title)}</div>
        <div class="meta">${year(game.releaseDate)} &middot; ${escapeHtml(game.genres[0])}</div>
      </span>
    </a>`;
  }

  // Wire up any [data-search-input] + [data-search-results] pair once data is ready
  function wireSearchWidget(input, resultsBox, opts) {
    opts = opts || {};
    function run() {
      const q = input.value;
      if (!q.trim()) {
        resultsBox.classList.remove("open");
        resultsBox.innerHTML = "";
        return;
      }
      const matches = searchGames(GC.games, q);
      if (matches.length === 0) {
        resultsBox.innerHTML = `<div class="nav-search-empty">No matches for “${escapeHtml(q)}”.</div>`;
      } else {
        resultsBox.innerHTML = matches.map(resultRowHTML).join("");
      }
      resultsBox.classList.add("open");
    }
    input.addEventListener("input", run);
    input.addEventListener("focus", () => { if (input.value.trim()) resultsBox.classList.add("open"); });
    document.addEventListener("click", (e) => {
      if (!resultsBox.contains(e.target) && e.target !== input) {
        resultsBox.classList.remove("open");
      }
    });
    if (opts.form) {
      opts.form.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = input.value.trim();
        window.location.href = ROOT + "browse.html" + (q ? "?q=" + encodeURIComponent(q) : "");
      });
    }
  }
  GC.wireSearchWidget = wireSearchWidget;

  // ---------- data-backed hero stats (never hand-typed, so they can't go stale) ----------
  function computeStats(games) {
    const studios = new Set(games.map((g) => g.developer)).size;
    const earliestYear = games.reduce((min, g) => Math.min(min, parseInt(g.releaseDate.slice(0, 4), 10)), 9999);
    return { gamesCovered: games.length, studios, earliestYear };
  }
  GC.computeStats = computeStats;

  // No signup mechanism exists yet, so this is a real "0" rather than a
  // computed value -- update it by hand once a subscriber source exists.
  GC.subscriberCount = 0;

  // Generic (non-trademarked) platform-family glyphs: which families a
  // visitor's own platform falls into actually matters; a raw "14 platforms"
  // count does not, so this replaces that with a filtered icon strip instead.
  const PLATFORM_FAMILIES = [
    { key: "pc", label: "PC", test: (s) => s.includes("pc") || s.includes("mac"),
      icon: '<rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 17v3"/>' },
    { key: "playstation", label: "PlayStation", test: (s) => s.startsWith("ps") || s.includes("playstation"),
      icon: '<path d="M6 9c-2 0-3.3 1.6-3.6 4-.3 2.4.5 4.4 2.5 4.4 1.3 0 1.8-1 2.5-2.2.6-1 1-1.3 2-1.3h5c1 0 1.4.3 2 1.3.7 1.2 1.2 2.2 2.5 2.2 2 0 2.8-2 2.5-4.4C21.3 10.6 20 9 18 9Z"/><circle cx="16" cy="8" r=".9" fill="currentColor" stroke="none"/><circle cx="18.3" cy="10" r=".9" fill="currentColor" stroke="none"/>' },
    { key: "xbox", label: "Xbox", test: (s) => s.includes("xbox"),
      icon: '<circle cx="12" cy="9.5" r="4"/><path d="M12 13.5v3M8.2 20h7.6"/>' },
    { key: "nintendo", label: "Nintendo", test: (s) => s.includes("switch") || s.includes("wii"),
      icon: '<rect x="4" y="6" width="16" height="12" rx="3"/><circle cx="8" cy="12" r="1.3"/><circle cx="16" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="14" r="1" fill="currentColor" stroke="none"/>' },
    { key: "mobile", label: "Mobile", test: (s) => s.includes("mobile") || s.includes("ios") || s.includes("android"),
      icon: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>' },
  ];
  function platformCoverage(games) {
    const all = new Set();
    games.forEach((g) => g.platforms.forEach((p) => all.add(p.toLowerCase())));
    return PLATFORM_FAMILIES.filter((f) => Array.from(all).some((p) => f.test(p)));
  }
  GC.platformCoverage = platformCoverage;

  // ---------- neon-sign dust sparkles for the hero brand lockup ----------
  // Scatters a handful of small twinkling motes across `container` (the
  // .hero-brand wrapper), inspired by the drifting dust around a lit neon
  // sign. Skipped outright under prefers-reduced-motion rather than paused.
  function spawnSparkles(container, count) {
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    count = count || 9;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "brand-sparkle";
      s.setAttribute("aria-hidden", "true");
      s.style.left = (Math.random() * 96 + 2).toFixed(1) + "%";
      s.style.top = (Math.random() * 84 + 8).toFixed(1) + "%";
      s.style.animationDelay = (Math.random() * 2.2).toFixed(2) + "s";
      s.style.animationDuration = (1.8 + Math.random() * 1.6).toFixed(2) + "s";
      frag.appendChild(s);
    }
    container.appendChild(frag);
  }
  GC.spawnSparkles = spawnSparkles;

  // ---------- animated stat counters (+ optional donut-ring sweep) ----------
  // If a [data-count] element sits inside a ".stat-ring", its sibling
  // ".stat-ring-progress" circle sweeps in lockstep with the count-up --
  // full when the target is > 0, left EMPTY when the target is 0 (e.g. an
  // honest "0 subscribers" placeholder) rather than faking a filled ring.
  function animateCounters(scope) {
    const els = (scope || document).querySelectorAll("[data-count]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);
        const target = parseFloat(el.dataset.count);
        const decimals = (el.dataset.count.split(".")[1] || "").length;
        const suffix = el.dataset.suffix || "";
        const ring = el.closest(".stat-ring");
        const progress = ring ? ring.querySelector(".stat-ring-progress") : null;
        let circumference = 0;
        if (progress) {
          const r = parseFloat(progress.getAttribute("r")) || 27;
          circumference = 2 * Math.PI * r;
          progress.style.strokeDasharray = String(circumference);
          progress.style.strokeDashoffset = String(circumference);
        }
        const ringFraction = target > 0 ? 1 : 0;
        const dur = 1100;
        const start = performance.now();
        function tick(now) {
          const p = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(decimals) + suffix;
          if (progress) progress.style.strokeDashoffset = String(circumference * (1 - eased * ringFraction));
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
  }
  GC.animateCounters = animateCounters;

  // ---------- lightweight particle field for hero ----------
  function initParticles(canvasHost) {
    if (!canvasHost) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = document.createElement("canvas");
    canvasHost.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    let w, h, particles;
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#7c8cff";

    function resize() {
      w = canvas.width = canvasHost.clientWidth * devicePixelRatio;
      h = canvas.height = canvasHost.clientHeight * devicePixelRatio;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    }
    function makeParticles() {
      const count = Math.min(70, Math.floor((w * h) / 46000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        a: Math.random() * 0.5 + 0.15,
      }));
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = accent;
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    resize(); makeParticles();
    window.addEventListener("resize", () => { resize(); makeParticles(); });
    requestAnimationFrame(frame);
  }
  GC.initParticles = initParticles;

  // ---------- home hero: coverflow-style featured carousel ----------
  // Renders one absolutely-positioned card per game inside `els.stage`, then
  // animates each card's transform/opacity by its signed distance from the
  // active index (0 = centered/upright, ±1 = tilted side cards, further =
  // hidden just past the edge, ready to slide in). Reuses posterArtHTML so
  // carousel cards look like the same "poster" system as every grid tile.
  function buildCarousel(games, els) {
    if (!els || !els.stage || !games || games.length === 0) return;
    const stage = els.stage, titleEl = els.title, dotsEl = els.dots;
    const root = els.root || stage;
    const N = games.length;
    let current = 0;
    let timer = null;
    let titleSwapTimer = null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) root.classList.add("motion-ok");

    const href = (g) => (els.hrefFor ? els.hrefFor(g) : gamePath(g.slug));
    const linkAttrs = els.external ? ` target="_blank" rel="noopener"` : "";

    const cards = games.map((g, i) => {
      const el = document.createElement("div");
      el.className = "carousel-card card-enter";
      el.style.setProperty("--tile-accent", g.accent);
      el.style.setProperty("--tile-accent2", g.accent2);
      const badgeHTML = els.badgeFor ? els.badgeFor(g) : "";
      el.innerHTML = `<a class="carousel-card-media" href="${href(g)}"${linkAttrs} aria-label="Open ${escapeHtml(g.title)}" tabindex="-1">
        <div class="tile-art${g.poster ? " has-photo" : ""}">${posterArtHTML(g)}</div>
        ${badgeHTML ? `<span class="carousel-card-badge">${badgeHTML}</span>` : ""}
      </a>`;
      el.addEventListener("click", (e) => {
        if (i !== current) { e.preventDefault(); goTo(i); }
      });
      stage.appendChild(el);
      return el;
    });

    // Optional dynamic hero backdrop (see .hero-carousel-bg in styles.css):
    // one huge-blurred layer per game -- an accent-color wash always, plus
    // the game's own cover art on top when it has one -- crossfaded via
    // opacity as the active card changes. Only built when the caller wires
    // up a bgHost (currently just the home hero's upcoming-games carousel),
    // so this stays a no-op for every other buildCarousel() usage.
    const bgLayers = els.bgHost ? games.map((g) => {
      const layer = document.createElement("div");
      layer.className = "carousel-bg-layer";
      const wash = `radial-gradient(60% 55% at 30% 25%, color-mix(in srgb, ${g.accent} 42%, transparent), transparent 68%),` +
        `radial-gradient(55% 55% at 80% 80%, color-mix(in srgb, ${g.accent2 || g.accent} 30%, transparent), transparent 70%)`;
      layer.style.backgroundImage = g.poster ? `${wash}, url("${ROOT}${g.poster}")` : wash;
      els.bgHost.appendChild(layer);
      return layer;
    }) : null;

    function shortestOffset(i, cur) {
      let d = i - cur;
      if (d > N / 2) d -= N;
      if (d < -N / 2) d += N;
      return d;
    }

    function positionCard(el, i) {
      const off = shortestOffset(i, current);
      const abs = Math.abs(off);
      const dir = off === 0 ? 0 : (off > 0 ? 1 : -1);
      el.style.zIndex = String(10 - abs);
      el.querySelector(".carousel-card-media").tabIndex = abs === 0 ? 0 : -1;
      el.setAttribute("aria-hidden", abs === 0 ? "false" : "true");
      el.classList.toggle("is-active", abs === 0);
      if (abs === 0) {
        el.style.transform = "translateX(-50%) rotateY(0deg) scale(1)";
        el.style.opacity = "1";
      } else if (abs === 1) {
        el.style.transform = `translateX(calc(-50% + ${dir * 68}%)) rotateY(${dir * -32}deg) scale(0.8)`;
        el.style.opacity = "0.55";
      } else {
        el.style.transform = `translateX(calc(-50% + ${dir * 125}%)) rotateY(${dir * -40}deg) scale(0.7)`;
        el.style.opacity = "0";
      }
    }

    function render(animateTitle) {
      cards.forEach(positionCard);
      if (bgLayers) {
        bgLayers.forEach((layer, i) => layer.classList.toggle("is-active", i === current));
      }
      if (titleEl) {
        if (animateTitle && !reduceMotion) {
          clearTimeout(titleSwapTimer);
          titleEl.classList.add("swap");
          titleSwapTimer = setTimeout(() => {
            titleEl.textContent = games[current].title;
            if (els.metaEl) els.metaEl.innerHTML = els.metaFor ? els.metaFor(games[current]) : "";
            titleEl.classList.remove("swap");
          }, 200);
        } else {
          titleEl.textContent = games[current].title;
          if (els.metaEl) els.metaEl.innerHTML = els.metaFor ? els.metaFor(games[current]) : "";
        }
      }
      if (dotsEl) {
        Array.from(dotsEl.children).forEach((d, i) => {
          d.classList.toggle("active", i === current);
          d.setAttribute("aria-current", i === current ? "true" : "false");
        });
      }
    }

    function goTo(i) {
      if (((i % N) + N) % N === current) return;
      current = ((i % N) + N) % N;
      render(true);
      resetAutoplay();
    }
    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    if (dotsEl) {
      dotsEl.innerHTML = games.map((g) => `<button type="button" class="carousel-dot" aria-label="Show ${escapeHtml(g.title)}"></button>`).join("");
      Array.from(dotsEl.children).forEach((d, i) => d.addEventListener("click", () => goTo(i)));
    }
    if (els.prevBtn) els.prevBtn.addEventListener("click", prev);
    if (els.nextBtn) els.nextBtn.addEventListener("click", next);

    stage.setAttribute("tabindex", "0");
    stage.setAttribute("role", "region");
    stage.setAttribute("aria-label", "Featured games carousel");
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    });

    function resetAutoplay() {
      clearInterval(timer);
      if (reduceMotion) return;
      timer = setInterval(next, 4800);
    }
    stage.addEventListener("pointerenter", () => clearInterval(timer));
    stage.addEventListener("pointerleave", resetAutoplay);
    stage.addEventListener("focusin", () => clearInterval(timer));
    stage.addEventListener("focusout", resetAutoplay);

    // initial layout while cards are still in their .card-enter (off/faded) state...
    render(false);
    // ...then release the entrance state a frame later so the transition
    // animates from "flown in from below" into its resting coverflow spot,
    // staggered slightly per card for a nicer cascade.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cards.forEach((el, i) => {
          if (!reduceMotion) {
            el.style.transitionDelay = Math.min(Math.abs(shortestOffset(i, current)), 4) * 60 + "ms";
          }
          el.classList.remove("card-enter");
        });
        setTimeout(() => { cards.forEach((el) => { el.style.transitionDelay = ""; }); }, 900);
      });
    });
    resetAutoplay();
  }
  GC.buildCarousel = buildCarousel;

  // ---------- price comparison (CheapShark, PC storefronts only) ----------
  // CheapShark is a free, keyless public API covering PC digital stores
  // (Steam, GOG, Humble, Fanatical, Epic, etc.) — it does NOT cover
  // PlayStation/Xbox/Switch storefronts, so console-only titles fall back
  // to a plain store-search link instead of live prices.
  const CHEAPSHARK_BASE = "https://www.cheapshark.com/api/1.0";
  let storeMapPromise = null;
  function loadStoreMap() {
    if (storeMapPromise) return storeMapPromise;
    storeMapPromise = fetch(CHEAPSHARK_BASE + "/stores")
      .then((r) => (r.ok ? r.json() : []))
      .then((stores) => {
        const map = {};
        (stores || []).forEach((s) => { map[s.storeID] = s.storeName; });
        return map;
      })
      .catch(() => ({}));
    return storeMapPromise;
  }

  function isPcPlatform(platforms) {
    return (platforms || []).some((p) => {
      const s = p.toLowerCase();
      return s.indexOf("pc") !== -1 || s.indexOf("mac") !== -1;
    });
  }
  GC.isPcPlatform = isPcPlatform;

  // Shared by renderPriceCard() and the deals-banner/deals-page modules
  // below: whenever we can build a real, direct store URL (currently just
  // Steam, via its stable numeric app ID) we use it; every other store
  // routes through CheapShark's own deal redirect — the only outbound
  // link its free API exposes for it.
  function storeLinkHref(r) {
    if (String(r.storeID) === "1" && r.steamAppID) {
      return "https://store.steampowered.com/app/" + encodeURIComponent(r.steamAppID) + "/";
    }
    return "https://www.cheapshark.com/redirect?dealID=" + encodeURIComponent(r.dealID);
  }

  function fallbackPriceHTML(title, note) {
    return (
      `<h3>Where to buy</h3>` +
      `<p class="price-note">${note}</p>` +
      `<a class="price-fallback-link" target="_blank" rel="noopener" href="https://store.steampowered.com/search/?term=${encodeURIComponent(title)}">Search Steam ↗</a>`
    );
  }

  // Renders a "Where to buy" card into `container` for a game by title.
  // PC/macOS titles get a live top-3 price comparison via CheapShark;
  // everything else gets a console-appropriate store-search fallback.
  function renderPriceCard(container, game) {
    if (!container) return;
    const title = game.title, platforms = game.platforms || [];
    if (!isPcPlatform(platforms)) {
      const p = platforms.map((x) => x.toLowerCase()).join(" ");
      let url = "https://www.google.com/search?tbm=shop&q=" + encodeURIComponent(title);
      let label = "Search for " + title + " ↗";
      if (p.indexOf("playstation") !== -1 || p.indexOf("ps") !== -1) {
        url = "https://store.playstation.com/search/" + encodeURIComponent(title);
        label = "Check PlayStation Store ↗";
      } else if (p.indexOf("xbox") !== -1) {
        url = "https://www.xbox.com/en-us/games/store/search?q=" + encodeURIComponent(title);
        label = "Check Xbox Store ↗";
      } else if (p.indexOf("switch") !== -1) {
        url = "https://www.nintendo.com/us/search/#q=" + encodeURIComponent(title) + "&p=1&sort=df";
        label = "Check Nintendo eShop ↗";
      }
      container.innerHTML =
        `<h3>Where to buy</h3>` +
        `<p class="price-note">Live price comparison currently covers PC storefronts only.</p>` +
        `<a class="price-fallback-link" target="_blank" rel="noopener" href="${url}">${escapeHtml(label)}</a>`;
      return;
    }

    container.innerHTML = `<h3>Where to buy</h3><p class="price-loading">Checking current prices…</p>`;
    const dealsUrl = CHEAPSHARK_BASE + "/deals?title=" + encodeURIComponent(title) + "&exact=false&limit=10&sortBy=Price";
    Promise.all([
      fetch(dealsUrl).then((r) => (r.ok ? r.json() : [])),
      loadStoreMap(),
    ]).then(([deals, storeMap]) => {
      if (!Array.isArray(deals) || deals.length === 0) {
        container.innerHTML = fallbackPriceHTML(title, "No live pricing found for this title right now.");
        return;
      }
      const seen = {};
      const rows = [];
      deals.forEach((d) => {
        const store = storeMap[d.storeID] || ("Store " + d.storeID);
        if (seen[store]) return;
        seen[store] = true;
        rows.push({
          store,
          storeID: String(d.storeID),
          price: parseFloat(d.salePrice),
          normal: parseFloat(d.normalPrice),
          savings: parseFloat(d.savings),
          dealID: d.dealID,
          steamAppID: d.steamAppID || null,
        });
      });
      rows.sort((a, b) => a.price - b.price);
      const top = rows.slice(0, 3);
      if (top.length === 0) {
        container.innerHTML = fallbackPriceHTML(title, "No live pricing found for this title right now.");
        return;
      }
      container.innerHTML =
        `<h3>Where to buy</h3>` +
        `<ul class="price-list">` +
        top.map((r) => {
          const off = r.savings > 1 ? `<span class="price-off">-${Math.round(r.savings)}%</span>` : "";
          const was = r.normal > r.price + 0.001 ? `<span class="price-was">$${r.normal.toFixed(2)}</span>` : "";
          const direct = r.storeID === "1" && r.steamAppID;
          const label = direct ? "View on Steam ↗" : "Get deal ↗";
          const title = direct
            ? "Opens the Steam store page directly"
            : `Opens via CheapShark's price-tracking link, then lands on ${escapeHtml(r.store)}`;
          return (
            `<li class="price-row">` +
            `<span class="price-store">${escapeHtml(r.store)}</span>` +
            `<span class="price-amounts">${was}<span class="price-now">$${r.price.toFixed(2)}</span>${off}</span>` +
            `<a class="price-go" target="_blank" rel="noopener" title="${title}" href="${storeLinkHref(r)}">${label}</a>` +
            `</li>`
          );
        }).join("") +
        `</ul>` +
        `<p class="price-attribution">Prices via <a href="https://www.cheapshark.com" target="_blank" rel="noopener">CheapShark</a>, live · USD · PC storefronts. Steam links go straight to the Steam store page; other stores route through CheapShark's own deal link.</p>`;
    }).catch(() => {
      container.innerHTML = fallbackPriceHTML(title, "Price checking is temporarily unavailable.");
    });
  }
  GC.renderPriceCard = renderPriceCard;

  // ---------- affiliate store search links (P1 #6: monetization) ----------
  // CheapShark's free API gives no direct product URL for these stores
  // (only its own redirect — see renderPriceCard above), so this builds
  // real, direct search-result links on each store's own site instead,
  // and wraps them through an affiliate deep-link template when one is
  // configured in js/config.js (window.GC_CONFIG.affiliateLinkTemplates).
  // Until the user is accepted into each program and fills in a real
  // template, these are still genuinely useful direct links — they just
  // don't earn a commission yet, same "honest until it's real" pattern
  // used for officialScore/subscriber-count elsewhere on this site.
  const AFFILIATE_STORES = [
    { key: "greenmangaming", label: "Green Man Gaming", searchUrl: (t) => "https://www.greenmangaming.com/search/?query=" + encodeURIComponent(t) },
    { key: "fanatical", label: "Fanatical", searchUrl: (t) => "https://www.fanatical.com/en/search?search=" + encodeURIComponent(t) },
    { key: "gog", label: "GOG", searchUrl: (t) => "https://www.gog.com/en/games?query=" + encodeURIComponent(t) },
  ];

  function wrapAffiliate(key, url) {
    const templates = (window.GC_CONFIG && window.GC_CONFIG.affiliateLinkTemplates) || {};
    const tmpl = templates[key];
    if (tmpl && tmpl.indexOf("{url}") !== -1) {
      return tmpl.replace("{url}", encodeURIComponent(url));
    }
    return url;
  }

  function affiliateSearchLinks(game) {
    if (!isPcPlatform(game.platforms)) return [];
    return AFFILIATE_STORES.map((s) => ({ label: s.label, href: wrapAffiliate(s.key, s.searchUrl(game.title)) }));
  }
  GC.affiliateSearchLinks = affiliateSearchLinks;

  function renderAffiliateRow(container, game) {
    if (!container) return;
    const links = affiliateSearchLinks(game);
    if (links.length === 0) { container.innerHTML = ""; return; }
    container.innerHTML =
      `<p class="affiliate-row-label">Also search for it at</p>` +
      `<div class="affiliate-links">` +
      links.map((l) => `<a class="affiliate-link" target="_blank" rel="noopener sponsored" href="${l.href}">${escapeHtml(l.label)} ↗</a>`).join("") +
      `</div>`;
  }
  GC.renderAffiliateRow = renderAffiliateRow;

  // ---------- "Best deals this week" (P1 #7 + landing banner) ----------
  // Finds each PC-inclusive game's single best current discount via
  // CheapShark, then ranks across the whole catalog by savings %.
  // Requests are throttled (a handful in flight at once, not 40
  // simultaneously) and the aggregated result is cached in localStorage
  // for a few hours so repeat visits in the same window don't re-hit the
  // API on every page load — "this week" is a real refresh cadence, not a
  // live-every-second feed. PC storefronts only, same CheapShark-coverage
  // limit as the price-comparison card above.
  const DEALS_CACHE_KEY = "gc_deals_cache_v1";
  const DEALS_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

  function fetchBestDealForGame(game) {
    const dealsUrl = CHEAPSHARK_BASE + "/deals?title=" + encodeURIComponent(game.title) + "&exact=false&limit=15&sortBy=Savings&desc=1";
    return Promise.all([
      fetch(dealsUrl).then((r) => (r.ok ? r.json() : [])),
      loadStoreMap(),
    ]).then(([deals, storeMap]) => {
      if (!Array.isArray(deals) || deals.length === 0) return null;
      let best = null;
      deals.forEach((d) => {
        const savings = parseFloat(d.savings);
        if (!best || savings > best.savings) {
          best = {
            slug: game.slug,
            title: game.title,
            accent: game.accent,
            accent2: game.accent2,
            poster: game.poster || null,
            officialScore: game.officialScore || null,
            store: storeMap[d.storeID] || ("Store " + d.storeID),
            storeID: String(d.storeID),
            price: parseFloat(d.salePrice),
            normal: parseFloat(d.normalPrice),
            savings,
            dealID: d.dealID,
            steamAppID: d.steamAppID || null,
          };
        }
      });
      return best;
    }).catch(() => null);
  }

  // Runs `items` through `worker` with at most `limit` in flight at once.
  function mapWithConcurrency(items, limit, worker) {
    return new Promise((resolve) => {
      const results = new Array(items.length);
      let next = 0, active = 0, done = 0;
      if (items.length === 0) { resolve(results); return; }
      function pump() {
        while (active < limit && next < items.length) {
          const i = next++;
          active++;
          worker(items[i]).then((r) => { results[i] = r; }).catch(() => { results[i] = null; }).finally(() => {
            active--; done++;
            if (done === items.length) resolve(results);
            else pump();
          });
        }
      }
      pump();
    });
  }

  function readDealsCache() {
    try {
      const raw = localStorage.getItem(DEALS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.deals) || typeof parsed.at !== "number") return null;
      if (Date.now() - parsed.at > DEALS_CACHE_MAX_AGE_MS) return null;
      return parsed;
    } catch (e) { return null; }
  }

  function writeDealsCache(deals) {
    try { localStorage.setItem(DEALS_CACHE_KEY, JSON.stringify({ at: Date.now(), deals })); } catch (e) { /* private mode / quota — skip caching */ }
  }

  let dealsPromise = null;
  // Returns a promise of ALL PC games' best current deal, sorted by
  // savings desc (savings > 1% only). Callers slice to the count they
  // need so the home banner and the full deals page share one fetch.
  function getWeeklyDeals(games) {
    if (dealsPromise) return dealsPromise;
    const cached = readDealsCache();
    if (cached) {
      dealsPromise = Promise.resolve(cached.deals);
      return dealsPromise;
    }
    const pcGames = games.filter((g) => isPcPlatform(g.platforms));
    dealsPromise = mapWithConcurrency(pcGames, 5, fetchBestDealForGame).then((results) => {
      const deals = results.filter((d) => d && d.savings > 1).sort((a, b) => b.savings - a.savings);
      writeDealsCache(deals);
      return deals;
    });
    return dealsPromise;
  }
  GC.getWeeklyDeals = getWeeklyDeals;

  function dealScoreHTML(d) {
    const os = d.officialScore;
    if (!os || typeof os.value !== "number") return "";
    return `<span class="tile-score" title="Official critic score: ${Math.round(os.value)}/100 via ${escapeHtml(os.source || "critics")}">
      <svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.8 7.1-.7z"/></svg>${Math.round(os.value)}
    </span>`;
  }

  function dealCardHTML(d) {
    const artHTML = d.poster
      ? `<img class="deal-art-img" src="${ROOT}${d.poster}" alt="" loading="lazy">`
      : `<div class="deal-art-mono" style="--tile-accent:${d.accent};--tile-accent2:${d.accent2}">${initials(d.title)}</div>`;
    const direct = d.storeID === "1" && d.steamAppID;
    const label = direct ? "View on Steam ↗" : "Get deal ↗";
    const goTitle = direct ? "Opens the Steam store page directly" : "Opens via CheapShark's price-tracking link";
    return (
      `<div class="deal-card">` +
      `<a class="deal-art" href="${gamePath(d.slug)}" aria-label="${escapeHtml(d.title)}">${artHTML}<span class="deal-off">-${Math.round(d.savings)}%</span></a>` +
      `<div class="deal-body">` +
      `<div class="deal-title-row">` +
      `<a class="deal-title" href="${gamePath(d.slug)}">${escapeHtml(d.title)}</a>` +
      dealScoreHTML(d) +
      `</div>` +
      `<span class="deal-store">${escapeHtml(d.store)}</span>` +
      `<span class="deal-price"><span class="deal-was">$${d.normal.toFixed(2)}</span><span class="deal-now">$${d.price.toFixed(2)}</span></span>` +
      `<a class="deal-go" target="_blank" rel="noopener" title="${goTitle}" href="${storeLinkHref(d)}">${label}</a>` +
      `</div>` +
      `</div>`
    );
  }

  function hideDealsSection(container) {
    container.innerHTML = "";
    const section = container.closest("[data-deals-section]");
    if (section) section.hidden = true;
  }

  // Home-page promo strip — a handful of the best current discounts, with
  // a "See all deals" link to deals.html. Quietly hides its whole section
  // if CheapShark has nothing right now, rather than showing an empty card.
  function renderDealsBanner(container, games, opts) {
    if (!container) return;
    const limit = (opts && opts.limit) || 6;
    container.innerHTML = `<div class="deals-loading">Finding this week's best prices…</div>`;
    getWeeklyDeals(games).then((deals) => {
      if (!deals || deals.length === 0) { hideDealsSection(container); return; }
      container.innerHTML = deals.slice(0, limit).map(dealCardHTML).join("");
    }).catch(() => hideDealsSection(container));
  }
  GC.renderDealsBanner = renderDealsBanner;

  // Full "Best deals this week" page grid — every PC game currently
  // discounted, ranked by savings %, plus a last-updated note.
  function renderDealsGrid(container, games, noteEl) {
    if (!container) return;
    const pcCount = games.filter((g) => isPcPlatform(g.platforms)).length;
    container.innerHTML = `<div class="deals-loading">Checking current prices across ${pcCount} PC-storefront titles…</div>`;
    getWeeklyDeals(games).then((deals) => {
      if (!deals || deals.length === 0) {
        container.innerHTML = `<div class="no-results"><strong>No live discounts right now.</strong>Check back soon — new deals show up here as they appear.</div>`;
        return;
      }
      container.innerHTML = deals.map(dealCardHTML).join("");
      if (noteEl) {
        const cached = readDealsCache();
        const at = cached ? new Date(cached.at) : new Date();
        noteEl.textContent = "Updated " + at.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " · " + deals.length + " deals · PC storefronts only, via CheapShark.";
      }
    }).catch(() => {
      container.innerHTML = `<div class="no-results"><strong>Price checking is temporarily unavailable.</strong>Try again in a bit.</div>`;
    });
  }
  GC.renderDealsGrid = renderDealsGrid;

  // ---------- social share buttons (P1 #8) ----------
  function shareTargets(url, title) {
    const u = encodeURIComponent(url), t = encodeURIComponent(title);
    return [
      { key: "x", label: "X", href: "https://twitter.com/intent/tweet?url=" + u + "&text=" + t },
      { key: "facebook", label: "Facebook", href: "https://www.facebook.com/sharer/sharer.php?u=" + u },
      { key: "reddit", label: "Reddit", href: "https://www.reddit.com/submit?url=" + u + "&title=" + t },
      { key: "whatsapp", label: "WhatsApp", href: "https://wa.me/?text=" + t + "%20" + u },
    ];
  }

  // No network calls at all — safe to use identically in the live site
  // and the single-file preview bundle.
  function renderShareButtons(container, title, url) {
    if (!container) return;
    const targets = shareTargets(url, title);
    const nativeBtn = (navigator.share) ? `<button type="button" class="gc-share-btn gc-share-native" data-gc-share-native>Share ↗</button>` : "";
    container.innerHTML =
      `<span class="gc-share-label">Share</span>` +
      nativeBtn +
      targets.map((t) => `<a class="gc-share-btn" target="_blank" rel="noopener" href="${t.href}" aria-label="Share on ${t.label}">${escapeHtml(t.label)}</a>`).join("") +
      `<button type="button" class="gc-share-btn gc-share-copy" data-gc-share-copy>Copy link</button>`;

    const nativeEl = container.querySelector("[data-gc-share-native]");
    if (nativeEl) nativeEl.addEventListener("click", () => { navigator.share({ title, url }).catch(() => {}); });

    const copyEl = container.querySelector("[data-gc-share-copy]");
    if (copyEl) {
      copyEl.addEventListener("click", () => {
        const done = () => {
          const original = "Copy link";
          copyEl.textContent = "Copied!";
          copyEl.classList.add("is-copied");
          setTimeout(() => { copyEl.textContent = original; copyEl.classList.remove("is-copied"); }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done).catch(done);
        } else {
          done();
        }
      });
    }
  }
  GC.renderShareButtons = renderShareButtons;

  // ---------- newsletter subscribe form (Buttondown embed, no API key) ----------
  // Reads window.GC_CONFIG.buttondownUsername (set in js/config.js). Until
  // that's filled in, the form shows an honest "opening soon" note instead
  // of submitting to nowhere — matches the site's "real 0, not fake" stats
  // philosophy: no subscriber pipeline exists until this is truly wired up.
  function wireNewsletterForm(form) {
    if (!form) return;
    const note = document.getElementById(form.getAttribute("data-note-id") || "");
    const username = (window.GC_CONFIG && window.GC_CONFIG.buttondownUsername) || "";
    function showNote(text) {
      if (!note) return;
      note.hidden = false;
      note.textContent = text;
    }
    if (!username) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        showNote("Signups are opening soon — check back shortly.");
      });
      return;
    }
    form.action = "https://buttondown.email/api/emails/embed-subscribe/" + username;
    form.method = "post";
    form.target = "popupwindow";
    if (!form.querySelector('input[name="embed"]')) {
      const embed = document.createElement("input");
      embed.type = "hidden";
      embed.name = "embed";
      embed.value = "1";
      form.appendChild(embed);
    }
    form.addEventListener("submit", () => {
      window.open("https://buttondown.email/" + username, "popupwindow", "width=600,height=600");
      showNote("Thanks — check your inbox to confirm.");
    });
  }
  GC.wireNewsletterForm = wireNewsletterForm;

  // ---------- accounts (Supabase Auth — email magic link) ----------
  // Wishlist and reviews both require a real, signed-in account. Earlier
  // versions kept the wishlist in localStorage and reviews fully anonymous;
  // both turned out to be the wrong tradeoff — a wishlist that resets the
  // moment you close the tab isn't useful, and an anonymous rating has
  // nothing stopping the same visitor from voting many times (no way to
  // count it "by IP" or "by browser" that actually holds up). Accounts fix
  // both: one rating per game per account (see renderReviewsSection below),
  // and a wishlist that follows the visitor anywhere they sign in.
  let supabaseClientPromise = null;
  function getSupabaseClient() {
    if (supabaseClientPromise) return supabaseClientPromise;
    const cfg = window.GC_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabasePublishableKey) {
      supabaseClientPromise = Promise.resolve(null);
      return supabaseClientPromise;
    }
    supabaseClientPromise = new Promise((resolve) => {
      if (window.supabase && window.supabase.createClient) {
        resolve(window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey));
        return;
      }
      const tag = document.createElement("script");
      tag.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
      tag.onload = () => resolve(window.supabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey) : null);
      tag.onerror = () => resolve(null);
      document.head.appendChild(tag);
    });
    return supabaseClientPromise;
  }

  let currentSession = null;
  let sessionInitDone = false;
  const authListeners = [];
  function notifyAuthListeners() { authListeners.forEach((fn) => { try { fn(currentSession); } catch (e) { /* listener error shouldn't break auth */ } }); }
  function onAuthChange(fn) { authListeners.push(fn); if (sessionInitDone) fn(currentSession); }
  function getSession() { return currentSession; }

  getSupabaseClient().then((client) => {
    if (!client) { sessionInitDone = true; notifyAuthListeners(); return; }
    client.auth.getSession().then(({ data }) => {
      currentSession = data.session || null;
      sessionInitDone = true;
      notifyAuthListeners();
    });
    client.auth.onAuthStateChange((event, session) => {
      currentSession = session || null;
      // A magic-link click lands back here with #access_token=... in the
      // URL; once supabase-js has parsed it into a session, drop it from
      // the visible URL rather than leaving a token hanging in the bar.
      if (event === "SIGNED_IN" && window.location.hash.indexOf("access_token") !== -1) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      notifyAuthListeners();
    });
  });

  function signInWithEmail(email) {
    return getSupabaseClient().then((client) => {
      if (!client) return { error: { message: "Accounts are temporarily unavailable." } };
      return client.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
    });
  }
  function signOutUser() {
    return getSupabaseClient().then((client) => (client ? client.auth.signOut() : null));
  }

  // A single sign-in/sign-out overlay, built once and reused from anywhere
  // (a wishlist heart, a review form, the wishlist page) — mirrors the
  // existing search-overlay pattern (dock nav) rather than a one-off modal.
  let authOverlayEls = null;
  function ensureAuthOverlay() {
    if (authOverlayEls) return authOverlayEls;
    const wrap = document.createElement("div");
    wrap.className = "auth-overlay";
    wrap.innerHTML =
      '<div class="auth-overlay-backdrop"></div>' +
      '<div class="auth-overlay-panel" role="dialog" aria-modal="true" aria-label="Account">' +
      '<button type="button" class="auth-overlay-close" aria-label="Close">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<div data-auth-signed-out>' +
      '<h3>Sign in to continue</h3>' +
      '<p class="auth-context-msg" data-auth-context></p>' +
      '<form class="auth-email-form" data-auth-form>' +
      '<input type="email" name="email" placeholder="you@email.com" required autocomplete="email">' +
      '<button type="submit" class="btn-primary">Send magic link</button>' +
      '</form>' +
      '<p class="auth-status" data-auth-status></p>' +
      '</div>' +
      '<div data-auth-signed-in hidden>' +
      '<h3>You’re signed in</h3>' +
      '<p class="auth-current-email" data-auth-email></p>' +
      '<button type="button" class="auth-signout-btn" data-auth-signout>Sign out</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    function close() { wrap.classList.remove("open"); }
    wrap.querySelector(".auth-overlay-backdrop").addEventListener("click", close);
    wrap.querySelector(".auth-overlay-close").addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

    const form = wrap.querySelector("[data-auth-form]");
    const status = wrap.querySelector("[data-auth-status]");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = (form.email.value || "").trim();
      if (!email) return;
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      status.textContent = "Sending…";
      signInWithEmail(email).then(({ error }) => {
        btn.disabled = false;
        status.textContent = error ? "Couldn’t send that — check the address and try again." : "Check your email for a sign-in link.";
      });
    });
    wrap.querySelector("[data-auth-signout]").addEventListener("click", () => { signOutUser().then(close); });

    authOverlayEls = {
      wrap, close,
      signedOut: wrap.querySelector("[data-auth-signed-out]"),
      signedIn: wrap.querySelector("[data-auth-signed-in]"),
      context: wrap.querySelector("[data-auth-context]"),
      email: wrap.querySelector("[data-auth-email]"),
      status, form,
    };
    return authOverlayEls;
  }

  function openAuthGate(message) {
    const els = ensureAuthOverlay();
    els.status.textContent = "";
    els.form.reset();
    if (currentSession) {
      els.signedOut.hidden = true;
      els.signedIn.hidden = false;
      els.email.textContent = currentSession.user.email;
    } else {
      els.signedOut.hidden = false;
      els.signedIn.hidden = true;
      els.context.textContent = message || "";
    }
    els.wrap.classList.add("open");
  }

  GC.auth = {
    getSession,
    onChange: onAuthChange,
    signInWithEmail,
    signOut: signOutUser,
    openGate: openAuthGate,
    client: getSupabaseClient,
  };

  // ---------- wishlist (account-gated, shared via Supabase) ----------
  let wishlistCache = null; // Set<slug> once loaded for the signed-in user; null when signed out / not yet loaded
  let wishlistLoadPromise = null;
  function loadWishlist() {
    if (!currentSession) { wishlistCache = null; wishlistLoadPromise = null; return Promise.resolve(null); }
    if (wishlistLoadPromise) return wishlistLoadPromise;
    const uid = currentSession.user.id;
    wishlistLoadPromise = getSupabaseClient().then((client) => {
      if (!client) { wishlistCache = new Set(); return wishlistCache; }
      return client.from("wishlist_items").select("game_slug").eq("user_id", uid).then(({ data, error }) => {
        wishlistCache = new Set((error ? [] : data || []).map((r) => r.game_slug));
        return wishlistCache;
      });
    });
    return wishlistLoadPromise;
  }
  function isWishlisted(slug) { return !!(wishlistCache && wishlistCache.has(slug)); }

  function toggleWishlist(slug) {
    if (!currentSession) { openAuthGate("Sign in to save games to your wishlist."); return; }
    if (!wishlistCache) wishlistCache = new Set();
    const willAdd = !wishlistCache.has(slug);
    if (willAdd) wishlistCache.add(slug); else wishlistCache.delete(slug);
    document.dispatchEvent(new CustomEvent("gc:wishlist-change", { detail: { slug, on: willAdd } }));
    const uid = currentSession.user.id;
    getSupabaseClient().then((client) => {
      if (!client) return;
      const op = willAdd
        ? client.from("wishlist_items").insert({ user_id: uid, game_slug: slug })
        : client.from("wishlist_items").delete().eq("user_id", uid).eq("game_slug", slug);
      op.then(({ error }) => {
        if (!error) return;
        if (willAdd) wishlistCache.delete(slug); else wishlistCache.add(slug);
        document.dispatchEvent(new CustomEvent("gc:wishlist-change", { detail: { slug, on: !willAdd } }));
      });
    });
  }
  GC.wishlist = { get: () => (wishlistCache ? Array.from(wishlistCache) : []), has: isWishlisted, toggle: toggleWishlist, ready: loadWishlist };

  onAuthChange(() => { loadWishlist().then(repaintWishlistButtons); });

  const HEART_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.2-4.6-10-9.2C.4 8.6 2 5 5.6 5c2 0 3.4 1 4.9 2.9C11.9 6 13.3 5 15.3 5 19 5 20.6 8.6 19 11.8 16.8 16.4 12 21 12 21z"/></svg>';

  function paintOneWishlistEl(el, slug) {
    const on = isWishlisted(slug);
    el.classList.toggle("is-active", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
    const label = el.querySelector(".wishlist-label");
    if (label) label.textContent = on ? "In your wishlist" : "Add to wishlist";
  }
  // Repaints every wishlist heart currently in the DOM — called after the
  // account's saved list loads/changes, rather than each button tracking
  // its own state, so every instance of the same game (a tile AND the hero
  // button) always agrees.
  function repaintWishlistButtons() {
    document.querySelectorAll("[data-wishlist-slug]").forEach((el) => paintOneWishlistEl(el, el.dataset.wishlistSlug));
  }
  document.addEventListener("gc:wishlist-change", repaintWishlistButtons);

  // Wires click handling + initial paint for every [data-wishlist-slug]
  // element inside `scope` (a tile grid after render, or `document` for the
  // one hero button on a game page — both the tile heart and the hero
  // button share the same `data-wishlist-slug` attribute).
  function paintWishlistButtons(scope) {
    (scope || document).querySelectorAll("[data-wishlist-slug]").forEach((btn) => {
      const slug = btn.dataset.wishlistSlug;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(slug);
      });
      paintOneWishlistEl(btn, slug);
    });
  }
  GC.paintWishlistButtons = paintWishlistButtons;

  // ---------- star rating (5 stars, half-star precision) ----------
  // Renders a row of 5 stars representing `value` (0–5, 0.5 steps) as an
  // accessible, non-interactive display. Half-fill is done with two stacked
  // SVGs per star (outline + a clipped filled copy).
  function starsHTML(value, size) {
    size = size || 16;
    const v = Math.max(0, Math.min(5, value || 0));
    let out = "";
    for (let i = 1; i <= 5; i++) {
      const fill = Math.max(0, Math.min(1, v - (i - 1))); // 0, 0.5, or 1
      out += `<span class="star-slot" style="width:${size}px;height:${size}px">
        <svg class="star-outline" viewBox="0 0 24 24" width="${size}" height="${size}"><path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.8 7.1-.7z"/></svg>
        <svg class="star-fill" viewBox="0 0 24 24" width="${size}" height="${size}" style="clip-path:inset(0 ${(1 - fill) * 100}% 0 0)"><path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.8 7.1-.7z"/></svg>
      </span>`;
    }
    return out;
  }
  GC.starsHTML = starsHTML;

  // Interactive star picker (click/keyboard to set a 0.5–5 rating). Calls
  // onChange(value) whenever the selection changes. Returns { getValue }.
  function wireStarPicker(host, initial, onChange) {
    let value = initial || 0;
    host.innerHTML = starsHTML(0, 26).replace(/star-slot/g, "star-slot pickable");
    const slots = Array.from(host.querySelectorAll(".star-slot"));
    function paint() {
      slots.forEach((slot, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        slot.querySelector(".star-fill").style.clipPath = `inset(0 ${(1 - fill) * 100}% 0 0)`;
      });
    }
    slots.forEach((slot, i) => {
      slot.setAttribute("role", "button");
      slot.setAttribute("tabindex", "0");
      slot.addEventListener("click", (e) => {
        const rect = slot.getBoundingClientRect();
        const half = (e.clientX - rect.left) < rect.width / 2;
        value = i + (half ? 0.5 : 1);
        paint();
        if (onChange) onChange(value);
      });
      slot.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { value = Math.min(5, value + 0.5); paint(); if (onChange) onChange(value); }
        if (e.key === "ArrowLeft") { value = Math.max(0.5, value - 0.5); paint(); if (onChange) onChange(value); }
      });
    });
    paint();
    return { getValue: () => value };
  }
  GC.wireStarPicker = wireStarPicker;

  // ---------- ratings & reviews (Supabase — account-gated) ----------
  // Reads window.GC_CONFIG.supabaseUrl / supabasePublishableKey (config.js).
  // Anyone can read reviews (reviews_select_public), but posting one now
  // requires a signed-in account (see GC.auth above) — one review per
  // (game, account), enforced both by a DB unique index and by upserting
  // on submit, so editing your rating overwrites it instead of duplicating.
  function timeAgo(iso) {
    const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    const units = [[31536000, "y"], [2592000, "mo"], [86400, "d"], [3600, "h"], [60, "m"]];
    for (const [secs, label] of units) {
      if (s >= secs) return Math.floor(s / secs) + label + " ago";
    }
    return "just now";
  }

  function reviewItemHTML(r) {
    return `<li class="review-item">
      <div class="review-item-head">
        <span class="review-author">${escapeHtml(r.reviewer_name || "Anonymous")}</span>
        <span class="review-stars">${starsHTML(r.rating, 13)}</span>
        <span class="review-date">${timeAgo(r.created_at)}</span>
      </div>
      ${r.review_text ? `<p class="review-text">${escapeHtml(r.review_text)}</p>` : ""}
    </li>`;
  }

  // IMDb-style rating pills — rendered into the game-page hero ("game info"),
  // not a separate section. The official (critic) score is static build-time
  // data; the player pill is filled in live once reviews load.
  function officialRatingPillHTML(game) {
    const os = game.officialScore;
    if (!os || typeof os.value !== "number") {
      return `<div class="rating-pill rating-pill-official rating-pill-empty">
        <span class="rating-pill-value">–</span>
        <span class="rating-pill-meta"><strong>Critic score</strong><span>Not added yet</span></span>
      </div>`;
    }
    const src = escapeHtml(os.source || "critics");
    const inner = `
      <svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.8 7.1-.7z"/></svg>
      <span class="rating-pill-value">${Math.round(os.value)}</span>
      <span class="rating-pill-meta"><strong>Critic score</strong><span>${src}${os.url ? " ↗" : ""}</span></span>`;
    return os.url
      ? `<a class="rating-pill rating-pill-official" href="${escapeHtml(os.url)}" target="_blank" rel="noopener" title="Official critic score, via ${src}">${inner}</a>`
      : `<div class="rating-pill rating-pill-official" title="Official critic score, via ${src}">${inner}</div>`;
  }

  function playerRatingPillHTML(avg, count) {
    if (!count) {
      return `<div class="rating-pill rating-pill-player rating-pill-empty">
        <span class="rating-pill-value">–</span>
        <span class="rating-pill-meta"><strong>Player rating</strong><span>No ratings yet</span></span>
      </div>`;
    }
    return `<div class="rating-pill rating-pill-player">
      <span class="rating-pill-value">${avg.toFixed(1)}</span>
      <span class="rating-pill-meta"><strong>Player rating</strong><span>${count} ${count === 1 ? "rating" : "ratings"}</span></span>
    </div>`;
  }

  // Renders ratings + reviews for `game`: the score pills go into `heroEl`
  // (the hero "game info" block, IMDb-style, right next to the title/wishlist
  // button) and the write/read-review UI goes into `container`, which is now
  // rendered as one of the sidebar "game info" cards rather than a standalone
  // full-width section further down the page.
  function renderReviewsSection(container, game, heroEl) {
    if (!container) return;

    function paintHeroRatings(avg, count) {
      if (!heroEl) return;
      heroEl.innerHTML = officialRatingPillHTML(game) + playerRatingPillHTML(avg, count);
    }
    paintHeroRatings(0, 0);

    container.innerHTML = `
      <h2>Ratings &amp; reviews</h2>
      <div class="review-form-wrap" data-review-form-wrap></div>
      <ul class="review-list" data-review-list><li class="review-loading">Loading reviews…</li></ul>
    `;

    const formWrap = container.querySelector("[data-review-form-wrap]");
    const list = container.querySelector("[data-review-list]");

    function paintReviews(reviews) {
      if (reviews.length === 0) {
        list.innerHTML = `<li class="review-empty">No reviews yet — be the first.</li>`;
        paintHeroRatings(0, 0);
        return;
      }
      const avg = reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length;
      paintHeroRatings(avg, reviews.length);
      list.innerHTML = reviews.map(reviewItemHTML).join("");
    }

    function loadReviews(client) {
      client.from("game_reviews").select("*").eq("game_slug", game.slug).order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) { list.innerHTML = `<li class="review-empty">Reviews are temporarily unavailable.</li>`; return; }
          paintReviews(data || []);
        });
    }

    function paintSignedOut() {
      formWrap.innerHTML = `
        <p class="review-form-note">Sign in to rate and review this game.</p>
        <button type="button" class="btn-primary" data-review-signin>Sign in to review</button>
      `;
      formWrap.querySelector("[data-review-signin]").addEventListener("click", () => {
        GC.auth.openGate("Sign in to rate and review " + (game.title || "this game") + ".");
      });
    }

    function paintSignedInForm(client, session, existing) {
      const defaultName = (session.user.email || "").split("@")[0];
      formWrap.innerHTML = `
        <p class="review-form-note">${existing ? "Update your rating and review." : "Rate it and leave a review — visible to everyone."}</p>
        <form class="review-form" data-review-form>
          <div class="review-form-row">
            <div class="star-picker" data-star-picker></div>
            <input type="text" name="reviewer_name" maxlength="40" placeholder="Your name (optional)" class="review-name-input" value="${escapeHtml(existing ? (existing.reviewer_name || "") : "")}">
          </div>
          <textarea name="review_text" maxlength="2000" rows="3" placeholder="What did you think? (optional)" class="review-text-input">${existing ? escapeHtml(existing.review_text || "") : ""}</textarea>
          <input type="text" name="website" class="review-honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="review-form-actions">
            <button type="submit" class="btn-primary">${existing ? "Update review" : "Post review"}</button>
            <span class="review-form-status" data-review-status></span>
          </div>
        </form>
      `;

      const starHost = formWrap.querySelector("[data-star-picker]");
      let picker = wireStarPicker(starHost, existing ? Number(existing.rating) : 0);
      const form = formWrap.querySelector("[data-review-form]");
      const status = formWrap.querySelector("[data-review-status]");

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (form.website.value) return; // honeypot tripped — silently drop
        const rating = picker.getValue();
        if (!rating) { status.textContent = "Pick a star rating first."; return; }
        const submitBtn = form.querySelector("button[type=submit]");
        submitBtn.disabled = true;
        status.textContent = existing ? "Updating…" : "Posting…";
        client.from("game_reviews").upsert({
          game_slug: game.slug,
          user_id: session.user.id,
          reviewer_name: (form.reviewer_name.value || "").trim() || defaultName,
          rating: rating,
          review_text: (form.review_text.value || "").trim() || null,
        }, { onConflict: "game_slug,user_id" }).select().then(({ data, error }) => {
          submitBtn.disabled = false;
          if (error) { status.textContent = "Couldn't post — try again."; return; }
          status.textContent = existing ? "Updated — thanks!" : "Posted — thanks!";
          existing = (data && data[0]) || existing;
          loadReviews(client);
        });
      });
    }

    function paintFormArea() {
      getSupabaseClient().then((client) => {
        if (!client) {
          formWrap.innerHTML = `<p class="review-form-note">Reviews are temporarily unavailable.</p>`;
          return;
        }
        const session = GC.auth.getSession();
        if (!session) { paintSignedOut(); return; }
        client.from("game_reviews").select("*").eq("game_slug", game.slug).eq("user_id", session.user.id).maybeSingle()
          .then(({ data }) => paintSignedInForm(client, session, data || null));
      });
    }

    getSupabaseClient().then((client) => {
      if (!client) {
        list.innerHTML = `<li class="review-empty">Reviews are temporarily unavailable.</li>`;
        formWrap.innerHTML = "";
        return;
      }
      loadReviews(client);
    });

    paintFormArea();
    GC.auth.onChange(paintFormArea);
  }
  GC.renderReviewsSection = renderReviewsSection;

  // ---------- floating dock nav: sliding indicator + search overlay ----------
  function debounce(fn, wait) {
    let t = null;
    return function () {
      clearTimeout(t);
      const args = arguments;
      t = setTimeout(() => fn.apply(null, args), wait);
    };
  }

  function initDockNav(nav) {
    nav = nav || document.querySelector(".dock-nav");
    if (!nav) return;
    const indicator = nav.querySelector(".dock-indicator");

    function moveIndicator() {
      const active = nav.querySelector(".dock-link.active");
      if (!active || !indicator) return;
      indicator.style.left = active.offsetLeft + "px";
      indicator.style.top = active.offsetTop + "px";
      indicator.style.width = active.offsetWidth + "px";
      indicator.style.height = active.offsetHeight + "px";
      indicator.classList.add("ready");
    }
    moveIndicator();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(moveIndicator).catch(() => {});
    }
    window.addEventListener("resize", debounce(moveIndicator, 120));
    window.addEventListener("orientationchange", () => setTimeout(moveIndicator, 60));

    const overlay = document.getElementById("search-overlay");
    const overlayBackdrop = document.getElementById("search-overlay-backdrop");
    const overlayClose = document.getElementById("search-overlay-close");
    const overlayInput = document.getElementById("nav-search-input");
    const searchToggle = document.getElementById("dock-search-toggle");

    function openSearch() {
      if (!overlay) return;
      overlay.classList.add("open");
      setTimeout(() => { if (overlayInput) overlayInput.focus(); }, 60);
    }
    function closeSearch() {
      if (!overlay || !overlay.classList.contains("open")) return;
      overlay.classList.remove("open");
      if (searchToggle) searchToggle.focus();
    }
    if (searchToggle) searchToggle.addEventListener("click", openSearch);
    if (overlayBackdrop) overlayBackdrop.addEventListener("click", closeSearch);
    if (overlayClose) overlayClose.addEventListener("click", closeSearch);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay && overlay.classList.contains("open")) closeSearch();
    });

    return { moveIndicator, openSearch, closeSearch };
  }
  GC.initDockNav = initDockNav;
})();
