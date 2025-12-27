// ======================================================
// ConvertBubble Builder – Live Engine NeuroBreak™ V3.0
// ======================================================

window.Builder = (() => {
  const STORAGE_KEY = "convertbubble_builder_config";
  let iframe, iframeWindow;
  let currentConfig = {};
  let lastSentConfig = null;

  // ======================================================
  // INIT
  // ======================================================
  async function init({ iframe: iframeElement }) {
    iframe = iframeElement;
    iframeWindow = iframe.contentWindow;
    console.log(" [Builder] Initialisation...");

    // Restaure config locale
    restoreLocal();

    iframe.addEventListener("load", () => {
      console.log(" [Builder] Preview prête");
      sendConfig();
      fillInputsFromConfig(); // Synchronise les champs
    });

    setTimeout(sendConfig, 1000);
  }

  // ======================================================
  // UPDATE / REPLACE
  // ======================================================
  function update(partialConfig = {}) {
    currentConfig = deepMerge(currentConfig, partialConfig);
    saveLocal();
    sendConfig();
  }

  function replace(newConfig = {}) {
    currentConfig = structuredClone(newConfig);
    saveLocal();
    sendConfig();
    fillInputsFromConfig();
  }

  // ======================================================
  // LOCAL STORAGE
  // ======================================================
  function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
    console.log(" [Builder] Config enregistrée localement");
  }

  function restoreLocal() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        currentConfig = JSON.parse(saved);
        console.log(" [Builder] Config restaurée depuis localStorage");
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  function resetLocal() {
    localStorage.removeItem(STORAGE_KEY);
    currentConfig = {};
    console.log(" [Builder] Sauvegarde locale supprimée");
  }

  // ======================================================
  // COMMUNICATION
  // ======================================================
  function sendConfig() {
    if (!iframeWindow) return;
    if (JSON.stringify(currentConfig) === JSON.stringify(lastSentConfig)) return;
    lastSentConfig = structuredClone(currentConfig);

    iframeWindow.postMessage({ type: "cb:config", payload: currentConfig }, "*");
    console.log(" [Builder] Config envoyée à la Preview");
  }

  // ======================================================
  // SYNC DES INPUTS
  // ======================================================
  function fillInputsFromConfig() {
    Object.entries({
      primary: currentConfig?.theme?.primary,
      shape: currentConfig?.theme?.shape,
      animation: currentConfig?.animation,
      brandLabel: currentConfig?.branding?.label,
      brandColor: currentConfig?.branding?.color,
      videoUrl: currentConfig?.video?.src,
      poster: currentConfig?.video?.poster,
      ctaLabel: currentConfig?.ctas?.[0]?.label,
      ctaHref: currentConfig?.ctas?.[0]?.href,
    }).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) el.value = val;
    });
  }

  // ======================================================
  // OVERLAY
  // ======================================================
  function openOverlay() {
    iframeWindow?.postMessage({ type: "cb:open" }, "*");
  }
  function closeOverlay() {
    iframeWindow?.postMessage({ type: "cb:close" }, "*");
  }

  // ======================================================
  // EXPORT
  // ======================================================
  function downloadJSON(filename = "config.json") {
    const blob = new Blob([JSON.stringify(currentConfig, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  function generateSnippet() {
    return `
<!-- ConvertBubble Snippet (NeuroBreak™) -->
<script src="./cb.js" data-config="./config.json" defer></script>
<!-- /ConvertBubble -->
`.trim();
  }

  // ======================================================
  // UTILS
  // ======================================================
  function deepMerge(target, source) {
    for (const key in source) {
      if (
        typeof source[key] === "object" &&
        !Array.isArray(source[key]) &&
        source[key] !== null
      ) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  // ======================================================
  // API PUBLIQUE
  // ======================================================
  return {
    init,
    update,
    replace,
    openOverlay,
    closeOverlay,
    downloadJSON,
    generateSnippet,
    resetLocal,
  };
})(); 



