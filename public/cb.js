// ==========================================================
//  ConvertBubble Player V4.5 — VERSION STABLE & SAFE
//  ➜ UNE SEULE BULLE
//  ➜ JAMAIS EN PREVIEW
// ==========================================================

(function () {
  console.log("DEBUG — CB.JS chargé");

  // --------------------------------------------------------
  // ⛔️ BLOCAGE ABSOLU EN PREVIEW / BUILDER
  // --------------------------------------------------------
  if (
  window.__CB_PREVIEW_SUPPRESS_RENDER__ &&
  window.__CB_CONTEXT__ !== "builder-preview"
) {
  console.log("🧊 CB.JS bloqué (mode preview)");
  return;
}

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
    const caption = theme.caption || {};

    const wrapper = el("div", {
      position: "relative",
      width: px(theme.bubble?.width || 180),
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      borderRadius: "16px",
      background: theme.primary || "#ff0055",
      boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
      cursor: "pointer",
      fontFamily: "Poppins, sans-serif",
      userSelect: "none"
    });

    wrapper.className = "convertbubble-wrapper";

    const box = el("div", {
      width: "100%",
      height: px(theme.bubble?.height || 120),
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    });

    if (config.launcherContent?.src) {
      const v = document.createElement("video");
      v.src = config.launcherContent.src;
      v.muted = true;
      v.autoplay = true;
      v.loop = true;
      v.playsInline = true;
      Object.assign(v.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover"
      });
      box.appendChild(v);
    }

    wrapper.appendChild(box);

    if (caption.text) {
      const cap = el("div", {
        padding: "10px",
        textAlign: "center",
        fontSize: (caption.fontSize || 14) + "px",
        color: caption.color || "#fff"
      });
      cap.textContent = caption.text;
      wrapper.appendChild(cap);
    }

    return wrapper;
  }

  // --------------------------------------------------------
  // Overlay
  // --------------------------------------------------------
  function openOverlay(config) {
    if (!config.video?.src) return;

    const overlay = el("div", {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2147483647
    });

    const video = document.createElement("video");
    video.src = config.video.src;
    video.controls = true;
    video.autoplay = true;
    Object.assign(video.style, {
      maxWidth: "90vw",
      maxHeight: "90vh"
    });

    overlay.onclick = () => overlay.remove();
    overlay.appendChild(video);
    document.body.appendChild(overlay);
  }

  // --------------------------------------------------------
  // INIT — PLAYER SEULEMENT
  // --------------------------------------------------------
  (async function init() {
    const config = await loadConfig();

    let fw = document.getElementById("convertbubble-floating-wrapper");
    if (!fw) {
      fw = document.createElement("div");
      fw.id = "convertbubble-floating-wrapper";
      Object.assign(fw.style, {
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: 2147483646,
        pointerEvents: "none"
      });
      document.body.appendChild(fw);
    }

    fw.innerHTML = "";

    const bubble = await createBubble(config);
    bubble.style.pointerEvents = "auto";
    bubble.onclick = () => openOverlay(config);

    fw.appendChild(bubble);
  })();

})();










