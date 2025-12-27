/* ConvertBubble — cb.js (builder-compatible) */
(() => {
  // --------------------------------------------------------
  // Helpers
  // --------------------------------------------------------
  const el = (tag, attrs = {}, children = []) => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "style") Object.assign(n.style, v);
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    children.forEach((c) => n.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return n;
  };

  // --------------------------------------------------------
  // Styles (animations)
  // --------------------------------------------------------
  const STYLE_ID = "convertbubble-styles";
  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes cb-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      @keyframes cb-rotation { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
      @keyframes cb-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
      @keyframes cb-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
    `;
    document.head.appendChild(style);
  }

  // --------------------------------------------------------
  // Core state
  // --------------------------------------------------------
  let currentConfig = null;
  let isMounted = false;

 // --------------------------------------------------------
// Resolve builder config → internal normalized config
// --------------------------------------------------------
function resolveBubbleConfig(config = {}) {
  const theme = config.theme || {};
  const bubble = theme.bubble || {};
  const caption = theme.caption || {};

  return {
    shape: bubble.shape ?? "portrait",
    width: Number(bubble.width ?? 140),
    height: Number(bubble.height ?? 180),

    background: bubble.background ?? "#000000",
    borderWidth: Number(bubble.borderWidth ?? 0),
    borderColor: bubble.borderColor ?? "transparent",
    borderRadius: Number(bubble.borderRadius ?? 18),

    animation: theme.animation ?? "none",

    captionText: caption.text ?? "",
    captionBackground: caption.background ?? "#ff2a7a",
    captionColor: caption.color ?? "#ffffff",
    captionFontFamily: caption.fontFamily ?? "Inter, system-ui",
    captionFontSize: Number(caption.fontSize ?? 18),
    captionFontWeight: caption.fontWeight ?? 700,
    captionAlign: caption.align ?? "center",
  };
}

  // --------------------------------------------------------
// Bubble creation
// --------------------------------------------------------
function createBubble(config) {
  ensureStyles();

  const theme = config?.theme || {};
  const bubbleCfg = theme.bubble || {};
  const captionCfg = theme.caption || {};

  // 🔹 Shape
  const shape = resolved.shape;

  // 🔹 Border
  const borderWidth = Number(bubbleCfg.borderWidth ?? 0);
  const borderColor =
    bubbleCfg.borderColor ??
    theme.secondary ??
    theme.primary ??
    "transparent";

  const borderRadius = Number(bubbleCfg.borderRadius ?? 18);

  // 🔹 Background
  const bg =
    bubbleCfg.background ??
    theme.primary ??
    "#000000";

  // 🔹 Size
  const width = Number(bubbleCfg.width ?? 140);
  const height = Number(bubbleCfg.height ?? 180);

  // 🔹 Animation
  const animation = theme.animation || config?.animation || "none";

  // 🔹 Caption
  const labelText = captionCfg.text || "";

  // Conteneur (bulle)
  const wrapper = el("div", {
    class: "convertbubble-wrapper",
    style: {
      width: `${width}px`,
      height: `${height}px`,
      background: bg,
      border: `${borderWidth}px solid ${borderColor}`,
      borderRadius: `${borderRadius}px`,
      boxSizing: "border-box",
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0,0,0,.35)",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      pointerEvents: "auto",
    },
  });
    // Gestion shape (mapping simple, sans casser)
    if (shape === "badge_round") {
      wrapper.style.width = `${Math.min(width, height)}px`;
      wrapper.style.height = `${Math.min(width, height)}px`;
      wrapper.style.borderRadius = "999px";
    } else if (shape === "square") {
      const s = Math.min(width, height);
      wrapper.style.width = `${s}px`;
      wrapper.style.height = `${s}px`;
    } else if (shape === "rectangle_horizontal") {
      wrapper.style.width = `${Math.max(width, height)}px`;
      wrapper.style.height = `${Math.min(width, height)}px`;
    }

    // Zone vidéo (placeholder noir pour l’instant)
    const videoArea = el("div", {
      class: "convertbubble-video-area",
      style: {
        flex: "1 1 auto",
        background: "#000",
      },
    });

    // Caption
    const caption = el(
      "div",
      {
        class: "convertbubble-caption",
        style: {
          flex: "0 0 auto",
          padding: "14px 16px",
          background: captionCfg.background || "#ff2a7a",
          color: captionCfg.color || "#ffffff",
          fontFamily: captionCfg.fontFamily || "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
          fontSize: `${Number(captionCfg.fontSize ?? 18)}px`,
          fontWeight: String(captionCfg.fontWeight ?? 700),
          textAlign: captionCfg.align || "center",
          userSelect: "none",
        },
      },
      [labelText]
    );

    wrapper.appendChild(videoArea);
    if (labelText) wrapper.appendChild(caption);

    // Animation
    if (animation === "bounce") wrapper.style.animation = "cb-bounce 1.2s ease-in-out infinite";
    if (animation === "rotation") wrapper.style.animation = "cb-rotation 4s linear infinite";
    if (animation === "pulse") wrapper.style.animation = "cb-pulse 1.4s ease-in-out infinite";
    if (animation === "shake") wrapper.style.animation = "cb-shake .7s ease-in-out infinite";

    // Click -> overlay (placeholder : tu as déjà ton player ailleurs)
    wrapper.addEventListener("click", () => {
      // Ici tu avais déjà ta logique d'ouverture player.
      // Je ne touche PAS à ton player pour ne rien casser.
      console.log("ConvertBubble: click bubble");
    });

    return wrapper;
  }

  // --------------------------------------------------------
  // Mount / destroy
  // --------------------------------------------------------
  async function mount(config) {
    currentConfig = config;
    ensureStyles();

    let fw = document.getElementById("convertbubble-floating-wrapper");
    if (!fw) {
      fw = document.createElement("div");
      fw.id = "convertbubble-floating-wrapper";
      fw.style.position = "fixed";
      fw.style.right = "24px";
      fw.style.bottom = "24px";
      fw.style.zIndex = "2147483647";
      fw.style.pointerEvents = "none";
      document.body.appendChild(fw);
    }

    fw.innerHTML = "";
    const bubble = createBubble(config);

    // IMPORTANT: bubble doit recevoir les events
    bubble.style.pointerEvents = "auto";
    fw.appendChild(bubble);

    isMounted = true;
  }

  function destroy() {
    const fw = document.getElementById("convertbubble-floating-wrapper");
    if (fw) fw.remove();
    isMounted = false;
  }

  // --------------------------------------------------------
  // Public API
  // --------------------------------------------------------
  async function init(config) {
    await mount(config);
  }

  async function reload(config) {
    await mount(config);
  }

  function getConfig() {
    return currentConfig;
  }

  window.ConvertBubble = {
    init,
    reload,
    destroy,
    getConfig,
  };

  console.log("DEBUG — CB.JS chargé");

  // --------------------------------------------------------
  // MODE BUILDER (builder-vanilla.html)
  // Objectif : une seule bulle flottante, visible immédiatement,
  // et synchronisée en live via Builder.update() / Builder.init().
  // --------------------------------------------------------
  const ctx = window.__CB_CONTEXT__;

  if (ctx === "builder") {
    console.log("CB.JS : mode BUILDER (auto-init désactivé, piloté par Builder)");

    // Hook Builder.init() -> mount initial
    if (window.Builder && typeof window.Builder.init === "function" && !window.Builder.__cb_hooked_init) {
      const _origInit = window.Builder.init;
      window.Builder.init = async function (...args) {
        const res = await _origInit.apply(this, args);
        try {
          // Nettoie toute ancienne bulle éventuelle (legacy)
          if (window.ConvertBubble && typeof window.ConvertBubble.destroy === "function") {
            window.ConvertBubble.destroy();
          }
          if (window.ConvertBubble && typeof window.ConvertBubble.reload === "function") {
            window.ConvertBubble.reload(window.Builder.getConfig());
          }
        } catch (e) {
          console.warn("CB.JS builder: mount initial échoué", e);
        }
        return res;
      };
      window.Builder.__cb_hooked_init = true;
    }

    // Hook Builder.update() -> live sync
    if (window.Builder && typeof window.Builder.update === "function" && !window.Builder.__cb_hooked_update) {
      const _origUpdate = window.Builder.update;
      window.Builder.update = function (...args) {
        const res = _origUpdate.apply(this, args);
        try {
          if (window.ConvertBubble && typeof window.ConvertBubble.reload === "function") {
            window.ConvertBubble.reload(window.Builder.getConfig());
          }
        } catch (e) {
          console.warn("CB.JS builder: sync échoué", e);
        }
        return res;
      };
      window.Builder.__cb_hooked_update = true;
    }

    // Important : on ne fait PAS l'auto-init "client" ci-dessous.
    return;
  }

  // --------------------------------------------------------
  // MODE BUILDER-PREVIEW (preview.html) : render géré par postMessage
  // --------------------------------------------------------
  if (window.__CB_PREVIEW_SUPPRESS_RENDER__) {
    console.log("CB.JS : mode BUILDER-PREVIEW (auto-init désactivé)");
    return;
  }

  // --------------------------------------------------------
  // INIT (client normal)
  // --------------------------------------------------------
  window.addEventListener("DOMContentLoaded", async () => {
    // Si tu as déjà une init ailleurs, tu peux laisser vide.
    // Ici : pas de config "en dur" pour ne rien casser.
  });
})();


