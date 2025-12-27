/* ConvertBubble — cb.js (STABLE) */
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
  // Resolve builder config → NORMALIZED CONFIG (SOURCE UNIQUE)
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
  // Bubble creation (DOM)
  // --------------------------------------------------------
  function createBubble(config) {
    ensureStyles();

    const r = resolveBubbleConfig(config);

    const wrapper = el("div", {
      class: "convertbubble-wrapper",
      style: {
        width: `${r.width}px`,
        height: `${r.height}px`,
        background: r.background,
        border: `${r.borderWidth}px solid ${r.borderColor}`,
        borderRadius: `${r.borderRadius}px`,
        boxSizing: "border-box",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,.35)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        pointerEvents: "auto",
      },
    });

    // Shape mapping
    if (r.shape === "badge_round") {
      const s = Math.min(r.width, r.height);
      wrapper.style.width = `${s}px`;
      wrapper.style.height = `${s}px`;
      wrapper.style.borderRadius = "999px";
    } else if (r.shape === "square") {
      const s = Math.min(r.width, r.height);
      wrapper.style.width = `${s}px`;
      wrapper.style.height = `${s}px`;
    } else if (r.shape === "rectangle_horizontal") {
      wrapper.style.width = `${Math.max(r.width, r.height)}px`;
      wrapper.style.height = `${Math.min(r.width, r.height)}px`;
    }

    // Video area (placeholder)
    wrapper.appendChild(
      el("div", {
        style: { flex: "1 1 auto", background: "#000" },
      })
    );

    // Caption
    if (r.captionText) {
      wrapper.appendChild(
        el(
          "div",
          {
            style: {
              padding: "14px 16px",
              background: r.captionBackground,
              color: r.captionColor,
              fontFamily: r.captionFontFamily,
              fontSize: `${r.captionFontSize}px`,
              fontWeight: r.captionFontWeight,
              textAlign: r.captionAlign,
              userSelect: "none",
            },
          },
          [r.captionText]
        )
      );
    }

    // Animation
    if (r.animation === "bounce") wrapper.style.animation = "cb-bounce 1.2s infinite";
    if (r.animation === "rotation") wrapper.style.animation = "cb-rotation 4s linear infinite";
    if (r.animation === "pulse") wrapper.style.animation = "cb-pulse 1.4s infinite";
    if (r.animation === "shake") wrapper.style.animation = "cb-shake .7s infinite";

    return wrapper;
  }

  // --------------------------------------------------------
  // Mount / destroy (INCHANGÉ)
  // --------------------------------------------------------
  let currentConfig = null;

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
    bubble.style.pointerEvents = "auto";
    fw.appendChild(bubble);
  }

  function destroy() {
    const fw = document.getElementById("convertbubble-floating-wrapper");
    if (fw) fw.remove();
  }

  // --------------------------------------------------------
  // Public API
  // --------------------------------------------------------
  window.ConvertBubble = {
    init: mount,
    reload: mount,
    destroy,
    getConfig: () => currentConfig,
  };

  console.log("CB.JS — VERSION STABLE CHARGÉE");

})();



