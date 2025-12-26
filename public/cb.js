// ==========================================================
//  ConvertBubble Player — BUILDER COMPAT
//  ➜ Le builder reste inchangé
//  ➜ cb.js s’adapte au mapping existant
// ==========================================================

(function () {
  console.log("CB.JS — builder-compatible chargé");

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

  // --------------------------------------------------------
  // 🔥 ADAPTATEUR DE CONFIG (CLÉ DU SUCCÈS)
  // --------------------------------------------------------
  function normalizeConfig(raw = {}) {
    const theme = raw.theme || {};

    return {
      theme: {
        primary: theme.primary || raw.primary || "#ff0055",
        animation: raw.animation || theme.animation,

        bubble: {
          width: theme.width,
          radius: theme.radius,
          borderWidth: theme.borderWidth,
          borderColor: theme.borderColor,
          launcherHeight: theme.launcherHeight,
        },

        caption: {
          text: raw.text || theme.text || "",
          fontSize: raw.fontSize || theme.fontSize || 14,
          color: raw.textColor || theme.textColor || "#ffffff",
          fontFamily: raw.fontFamily || theme.fontFamily || "Poppins, sans-serif",
        },
      },

      launcherContent: raw.launcherContent || {},
      video: raw.video || {},
    };
  }

  // --------------------------------------------------------
  // Animations CSS (1 seule injection)
  // --------------------------------------------------------
  (function injectAnimCSS() {
    if (document.getElementById("cb-anim-css")) return;
    const style = document.createElement("style");
    style.id = "cb-anim-css";
    style.textContent = `
      @keyframes cb-bounce {
        0%,100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      @keyframes cb-rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  })();

  // --------------------------------------------------------
  // Création de la bulle (renderer pur)
  // --------------------------------------------------------
  function createBubble(config) {
    const theme = config.theme;
    const bubble = theme.bubble;
    const caption = theme.caption;

    const wrapper = el("div", {
      position: "fixed",
      right: "20px",
      bottom: "20px",
      zIndex: 2147483646,

      width: px(bubble.width || 180),
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",

      borderRadius: px(bubble.radius || 16),
      border: `${bubble.borderWidth || 0}px solid ${bubble.borderColor || "transparent"}`,

      background: theme.primary,
      boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
      cursor: "pointer",

      fontFamily: caption.fontFamily,
      userSelect: "none",
    });

    // Animation
    wrapper.style.animation = "none";
    if (theme.animation === "bounce") wrapper.style.animation = "cb-bounce 1.4s infinite";
    if (theme.animation === "rotation") wrapper.style.animation = "cb-rotate 4s linear infinite";

    // Launcher (vidéo contenue)
    const launcher = el("div", {
      width: "100%",
      height: px(bubble.launcherHeight || 120),
      background: "#000",
      overflow: "hidden",
      position: "relative",
    });

    const src = config.launcherContent?.src;
    if (src && !src.includes("default")) {
      const video = document.createElement("video");
      video.src = src;
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

    // Texte
    if (caption.text) {
      const cap = el("div", {
        padding: "10px",
        textAlign: "center",
        fontSize: caption.fontSize + "px",
        color: caption.color,
        fontFamily: caption.fontFamily,
      });
      cap.textContent = caption.text;
      wrapper.appendChild(cap);
    }

    return wrapper;
  }

  // --------------------------------------------------------
  // Mount / Reload (UNE seule bulle)
  // --------------------------------------------------------
  let floatingWrapper = null;

  function mount(rawConfig) {
    const config = normalizeConfig(rawConfig);

    if (!floatingWrapper) {
      floatingWrapper = document.createElement("div");
      floatingWrapper.id = "convertbubble-floating-wrapper";
      document.body.appendChild(floatingWrapper);
    }

    floatingWrapper.innerHTML = "";
    floatingWrapper.appendChild(createBubble(config));
  }

  // --------------------------------------------------------
  // API PUBLIQUE (builder pilote tout)
  // --------------------------------------------------------
  window.ConvertBubble = {
    init: mount,
    reload: mount,
    destroy() {
      floatingWrapper?.remove();
      floatingWrapper = null;
    },
  };
})();






