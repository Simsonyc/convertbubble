// ==========================================================
//  ConvertBubble Player V4.5 — BUILDER-MASTER
//  ➜ UNE SEULE BULLE (wrapper unique)
//  ➜ EN BUILDER : pas d'auto-init, le Builder pilote tout
// ==========================================================
// ===============================
// 🔧 ÉTAT INTERNE (LIVE RELOAD)
// ===============================
let bubbleEl = null; // (laissé en place pour compat, non utilisé ici)
let currentConfig = null;

(function () {
  console.log("DEBUG — CB.JS chargé");

  // --------------------------------------------------------
  // Fonts
  // --------------------------------------------------------
  (function loadFonts() {
    if (document.getElementById("convertbubble-fonts")) return;
    const link = document.createElement("link");
    link.id = "convertbubble-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
  })();

  // --------------------------------------------------------
  // Anim CSS (inject 1 fois)
  // --------------------------------------------------------
  (function injectAnimCSS() {
    if (document.getElementById("cb-anim-css")) return;
    const style = document.createElement("style");
    style.id = "cb-anim-css";
    style.textContent = `
      @keyframes cb-bounce { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-6px);} }
      @keyframes cb-rotate { from{ transform: rotate(0deg);} to{ transform: rotate(360deg);} }
    `;
    document.head.appendChild(style);
  })();

  // --------------------------------------------------------
  // Utils
  // --------------------------------------------------------
  function el(tag, style) {
    const e = document.createElement(tag);
    if (style) Object.assign(e.style, style);
    return e;
  }

  function px(v) {
    return typeof v === "number" ? v + "px" : v;
  }

  async function loadConfig() {
    const script = document.currentScript;
    const cfg = script?.getAttribute("data-config");
    const url = cfg || "/public/config.json";
    const res = await fetch(url, { cache: "no-store" });
    return res.json();
  }

  // --------------------------------------------------------
  // Création de la bulle
  // --------------------------------------------------------
  async function createBubble(config) {
    const theme = config.theme || {};
    const bubble = theme.bubble || {};
    const caption = theme.caption || {};

    const wrapper = el("div", {
      position: "relative",
      width: px(bubble.width || 180),
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",

      // ✅ border / radius pilotés par config
      borderRadius: px(bubble.radius || 16),
      border: `${bubble.borderWidth || 0}px solid ${bubble.borderColor || "transparent"}`,

      background: theme.primary || "#ff0055",
      boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
      cursor: "pointer",

      // ✅ police pilotée par caption.fontFamily
      fontFamily: caption.fontFamily || "Poppins, sans-serif",

      userSelect: "none",
    });

    wrapper.className = "convertbubble-wrapper";

    // ✅ animation pilotée par theme.animation
    wrapper.style.animation = "none";
    if (theme.animation === "bounce") wrapper.style.animation = "cb-bounce 1.4s infinite";
    if (theme.animation === "rotation") wrapper.style.animation = "cb-rotate 4s linear infinite";

    // 🔹 ZONE LAUNCHER (vidéo OU fond noir, contenue)
    const launcher = el("div", {
      width: "100%",
      height: px(bubble.launcherHeight || 120),
      background: "#000",
      overflow: "hidden",
      position: "relative",
    });

    // ✅ Stopper les 404 "default"
    const lsrc = config.launcherContent?.src;

    if (lsrc && !lsrc.includes("default")) {
      const video = document.createElement("video");
      video.src = lsrc;
      video.muted = true;
      video.autoplay = true;
      video.loop = true;
      video.playsInline = true;

      Object.assign(video.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover",
      });

      launcher.appendChild(video);
    }

    wrapper.appendChild(launcher);

    if (caption.text) {
      const cap = el("div", {
        padding: "10px",
        textAlign: "center",
        fontSize: (caption.fontSize || 14) + "px",
        color: caption.color || "#fff",
        // ✅ même police sur l’encart texte
        fontFamily: caption.fontFamily || "Poppins, sans-serif",
      });
      cap.textContent = caption.text;
      wrapper.appendChild(cap);
    }

    return wrapper;
  }

  // --------------------------------------------------------
  // Overlay (player simple)
  // --------------------------------------------------------
  function openOverlay(config) {
    const src = config.video?.src || config.launcherContent?.src;
    if (!src) return;

    const overlay = el("div", {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2147483647,
    });
    overlay.className = "cb-overlay";

    const video = document.createElement("video");
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    Object.assign(video.style, { maxWidth: "90vw", maxHeight: "90vh" });

    overlay.onclick = () => overlay.remove();
    overlay.appendChild(video);
    document.body.appendChild(overlay);
  }

  // --------------------------------------------------------
  // MOUNT / RELOAD (wrapper fixed unique)
  // --------------------------------------------------------
  async function mount(config) {
    currentConfig = config || {};

    let fw = document.getElementById("convertbubble-floating-wrapper");
    if (!fw) {
      fw = document.createElement("div");
      fw.id = "convertbubble-floating-wrapper";
      Object.assign(fw.style, {
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: 2147483646,
        pointerEvents: "none",
      });
      document.body.appendChild(fw);
    }

    fw.innerHTML = "";

    const bubble = await createBubble(currentConfig);
    bubble.style.pointerEvents = "auto";
    bubble.onclick = () => openOverlay(currentConfig);

    fw.appendChild(bubble);
  }

  // --------------------------------------------------------
  // API PUBLIQUE (obligatoire)
  // --------------------------------------------------------
  window.ConvertBubble = {
    init: mount,
    reload: mount,
    destroy: () => {
      document.getElementById("convertbubble-floating-wrapper")?.remove();
      document.querySelectorAll(".cb-overlay")?.forEach((el) => el.remove());
    },
  };

  // --------------------------------------------------------
  // ✅ CONTRAT : en BUILDER, PAS D’AUTO-INIT.
  // Le builder appelle ConvertBubble.reload(snapshot).
  // --------------------------------------------------------
  const ctx = window.__CB_CONTEXT__;
  if (ctx === "builder") {
    console.log("CB.JS : mode BUILDER (auto-init désactivé, piloté par Builder)");
    return;
  }

  // En preview iframe, on évite aussi l’auto-init si suppression active
  if (window.__CB_PREVIEW_SUPPRESS_RENDER__ && ctx === "builder-preview") {
    console.log("CB.JS : mode BUILDER-PREVIEW (auto-init désactivé)");
    return;
  }

  // --------------------------------------------------------
  // INIT AUTO (site client)
  // --------------------------------------------------------
  (async function init() {
    const config = await loadConfig();
    await mount(config);
  })();
})();






