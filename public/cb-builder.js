/*
 * ConvertBubble — cb-builder.js
 * Version : 4.6.1 SAFE
 * Rôle : Builder UI → Preview uniquement
 * ⚠️ Le builder NE CRÉE JAMAIS de bulle
 */

// 🔒 CONTEXTE CRITIQUE (ANTI BULLE FIXE)
window.__CB_CONTEXT__ = "builder";

const Builder = (() => {
  let iframe;
  let config = {};
  const STORAGE_KEY = "convertbubble_config_v461";

  // ===============================
  // Utils
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
    } catch {}
  }

  function loadLocal() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }

  // ===============================
  // PREVIEW COMMUNICATION ONLY
  // ===============================
  function post(type, payload = {}) {
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type, payload }, "*");
  }

  function refreshPreview() {
    post("cb:update", config);
  }

  // ===============================
  // API CONFIG
  // ===============================
  function replace(newConfig) {
    config = JSON.parse(JSON.stringify(newConfig || {}));
    save();
    refreshPreview();
  }

  function update(patch) {
    config = deepMerge(config, patch || {});
    save();
    refreshPreview();
  }

  function getConfig() {
    return config;
  }

  function resetLocal() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ===============================
  // EXPORT
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
  // INIT
  // ===============================
  async function init({ iframe: iframeEl }) {
    iframe = iframeEl;
    if (!iframe) return;

    const local = loadLocal();
    config = local || {};

    const sendInit = () => post("cb:init", config);
    iframe.complete
      ? sendInit()
      : iframe.addEventListener("load", sendInit, { once: true });
  }

  // ===============================
  // LAUNCHER HELPERS
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
  // PUBLIC API
  // ===============================
  return {
    init,
    update,
    replace,
    getConfig,
    downloadJSON,
    generateSnippet,
    resetLocal,

    setLauncherType,
    setLauncherSrc,
    setLauncherAlt,
    setLauncherPreviewSeconds,
  };
})();

