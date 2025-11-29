/*
 * ConvertBubble — cb-builder.js
 * Version : 4.6.0 (Bulle réelle flottante dans le builder + Preview sync)
 * Compat : builder-vanilla.html V4.5.0 + preview.html actuel
 */

const Builder = (() => {
  let iframe;
  let config = {};
  const STORAGE_KEY = "convertbubble_config_v460";

  let cbReady = false;
  let cbLoading = false;

  // ===============================
  // 🔧 Utils
  // ===============================
  function deepMerge(target, source) {
    const output = { ...target };
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        output[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn("⚠️ Impossible d’enregistrer la config locale :", e);
    }
  }

  function loadLocal() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  // ===============================
  // 📦 MOTEUR ConvertBubble DANS LE BUILDER
  // ===============================
  function ensureCbEngine(callback) {
    // Déjà prêt
    if (cbReady && window.ConvertBubble && typeof window.ConvertBubble.reload === "function") {
      callback();
      return;
    }

    // Déjà en cours de chargement → on attend
    if (cbLoading) {
      const timer = setInterval(() => {
        if (cbReady && window.ConvertBubble && typeof window.ConvertBubble.reload === "function") {
          clearInterval(timer);
          callback();
        }
      }, 200);
      return;
    }

    // Premier chargement
    cbLoading = true;
    const script = document.createElement("script");
    // IMPORTANT : cb.js est à la racine, comme dans preview.html
    script.src = "/cb.js";
    script.async = true;

    script.onload = () => {
      cbLoading = false;
      cbReady = !!(window.ConvertBubble && typeof window.ConvertBubble.reload === "function");
      if (!cbReady) {
        console.error("❌ ConvertBubble chargé mais API reload introuvable.");
        return;
      }
      callback();
    };

    script.onerror = () => {
      cbLoading = false;
      console.error("❌ Impossible de charger cb.js dans le builder.");
    };

    document.body.appendChild(script);
  }

 

  // ===============================
  // 🧠 API CONFIG
  // ===============================
  function replace(newConfig) {
    config = JSON.parse(JSON.stringify(newConfig || {}));
    save();
    refreshPreview();
    // refreshParentBubble();
  }

  function update(patch) {
    config = deepMerge(config, patch || {});
    save();
    refreshPreview();
    // refreshParentBubble();
  }

  function getConfig() {
    return config;
  }

  function resetLocal() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ===============================
  // 🎬 PREVIEW (iframe)
  // ===============================
  function post(type, payload = {}) {
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage({ type, payload }, "*");
  }

  function refreshPreview() {
    post("cb:update", config);
  }

  // ===============================
  // 🎯 OVERLAY (boutons Ouvrir / Fermer)
  // ===============================
  function openOverlay() {
    // Ouvre l’overlay dans la bulle réelle du builder
    const root = document.querySelector(".convertbubble-wrapper");
    if (root) {
      root.click();
    }
    // Et en parallèle dans la preview (optionnel)
    post("cb:open");
  }

  function closeOverlay() {
    // Ferme l’overlay dans le builder
    document.querySelectorAll(".cb-overlay").forEach(e => e.remove());
    // Et dans la preview
    post("cb:close");
  }

  // ===============================
  // 📤 EXPORT
  // ===============================
  function downloadJSON(filename = "config.json") {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  function generateSnippet() {
    const jsonStr = JSON.stringify(config);
    const encoded = encodeURIComponent(jsonStr);
    return `<script src="https://cdn.convertbubble.app/cb.js" data-config="${encoded}"></script>`;
  }

  // ===============================
  // 🔰 CONFIG PAR DÉFAUT (ton JSON)
  // ===============================
  const defaultConfig = {
    theme: {
      primary: "#ff0055",
      overlayOpacity: 0.85,
      border: {
        color: "#ff0055",
        width: 2,
      },
      bubble: {
        background: "#0b0c14",
        width: 160,
        height: 160,
      },
      shape: "badge",
      caption: {
        text: "Regarde la vidéo 👇",
        color: "#ffffff",
        fontSize: 14,
        fontFamily: "Poppins, system-ui, sans-serif",
        position: "bottom",
        maxFraction: 0.4,
      },
    },
    launcherContent: {
      type: "videoPreview",
      src: "https://convertbubble-cdn.vercel.app/assets/convertbubble-default.mp4",
      previewSeconds: 3,
      alt: "Miniature vidéo",
    },
    position: "BR",
    video: {
      src: "https://convertbubble-cdn.vercel.app/assets/convertbubble-default.mp4",
      poster: "https://convertbubble-cdn.vercel.app/assets/convertbubble-default.jpg",

    },
    animation: "pulse",
    ctaMode: "timed",
    ctas: [
      { label: "Découvrir l’offre", href: "https://boostandgrow.fr" },
      { label: "Voir la démo", href: "https://convertbubble.com" },
      { label: "Essai gratuit", href: "https://boostandgrow.fr/demo" },
      { label: "Contact", href: "https://boostandgrow.fr/contact" },
    ],
    timing: {
      sequence: [
        { index: 0, showAt: 3, duration: 5 },
        { index: 1, showAt: 10, duration: 5 },
        { index: 2, showAt: 17, duration: 5 },
      ],
      showAllAt: 25,
    },
    ctaOverlay: {
      buttonOpacity: 0.9,
    },
    behavior: {
      openLinksInParent: false,
    },
    display: {
      rules: { mode: "allowlist", patterns: [".*"] },
    },
  };

  // ===============================
  // 🚀 INIT
  // ===============================
  async function init({ iframe: iframeEl }) {
    iframe = iframeEl;
    if (!iframe) {
      console.error("❌ Aucun iframe de preview fourni au Builder.init()");
      return;
    }

    // 1️⃣ Charge config locale ou défaut
    const local = loadLocal();
    config = local || { ...defaultConfig };
// 1B : récupération du config.json de la preview
try {
  const res = await fetch("/public/config.json", { cache: "no-store" });
  const json = await res.json();
  config = deepMerge(config, json);
} catch (e) {
  console.warn("⚠️ Impossible de charger /public/config.json :", e);
}

    // 🛠 Sécurisation : si la forme n'est pas reconnue → on force "square"
if (!config.theme?.shape || !["square","horizontal","vertical","portrait","badge"].includes(config.theme.shape)) {
  config.theme.shape = "square";
}

    // 2️⃣ Bulle réelle flottante dans le builder
    // refreshParentBubble();

    // 3️⃣ Sync initial vers la preview dès qu'elle est prête
    const sendInit = () => post("cb:init", config);
    if (iframe.complete) {
      sendInit();
    } else {
      iframe.addEventListener("load", sendInit, { once: true });
    }
  }
  // ===============================
  // 🎨 LAUNCHER — gestion du contenu
  // ===============================
  function setLauncherType(type) {
    config.launcherContent = config.launcherContent || {};
    config.launcherContent.type = type;
    save();
    refreshPreview();
  }

  function setLauncherSrc(url) {
    config.launcherContent = config.launcherContent || {};
    config.launcherContent.src = url;
    save();
    refreshPreview();
  }

  function setLauncherAlt(text) {
    config.launcherContent = config.launcherContent || {};
    config.launcherContent.alt = text;
    save();
    refreshPreview();
  }

  function setLauncherPreviewSeconds(sec) {
    config.launcherContent = config.launcherContent || {};
    config.launcherContent.previewSeconds = Number(sec) || 3;
    save();
    refreshPreview();
  }

  // ===============================
  // 🔓 API PUBLIQUE
  // ===============================
  return {
    init,
    update,
    replace,
    getConfig,
    openOverlay,
    closeOverlay,
    downloadJSON,
    generateSnippet,
    resetLocal,

    // 🎨 Launcher
    setLauncherType,
    setLauncherSrc,
    setLauncherAlt,
    setLauncherPreviewSeconds,
  };
})();
