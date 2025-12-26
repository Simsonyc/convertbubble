/*
 * ConvertBubble — cb-builder.js
 * Version : BUILDER-MASTER
 * Rôle : Builder UI → pilote la bulle flottante (parent)
 */

window.__CB_CONTEXT__ = "builder";

const Builder = (() => {
  let iframe;
  let config = {};
  const STORAGE_KEY = "convertbubble_config_v461";

  function deepMerge(target, source) {
    const output = structuredClone(target || {});
    for (const key in source) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        output[key] = deepMerge(output[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }

  function snapshot() {
    return structuredClone(config);
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch {}
  }

  function loadLocal() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  }

  async function loadDefaultConfig() {
    const res = await fetch("/public/config.json", { cache: "no-store" });
    return res.json();
  }

  // (optionnel) si tu gardes l'iframe pour autre chose
  function post(type, payload = {}) {
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type, payload }, "*");
  }

  function refresh() {
    const snap = snapshot();

    // ✅ UNE SEULE vérité : la bulle flottante du builder
    if (window.ConvertBubble && typeof window.ConvertBubble.reload === "function") {
      window.ConvertBubble.reload(snap);
    }

    // optionnel: si tu veux garder l’iframe, tu peux laisser ce post
    post("cb:update", snap);
  }

  function replace(newConfig) {
    config = structuredClone(newConfig || {});
    save();
    refresh();
  }

  function update(patch) {
    config = deepMerge(config, patch || {});
    save();
    refresh();
  }

  function getConfig() {
    return snapshot();
  }

  function resetLocal() {
    localStorage.removeItem(STORAGE_KEY);
  }

  async function init({ iframe: iframeEl } = {}) {
    iframe = iframeEl || null;

    const local = loadLocal();
    if (local) {
      config = local;
    } else {
      config = await loadDefaultConfig();
      save();
    }

    // ✅ première bulle immédiatement visible, sans scroll
    refresh();
  }

  function downloadJSON(filename = "config.json") {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
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

  function copySnippet() {
    const snippet = generateSnippet();
    navigator.clipboard?.writeText(snippet);
    return snippet;
  }

  return {
    init,
    update,
    replace,
    getConfig,
    downloadJSON,
    generateSnippet,
    copySnippet,
    resetLocal,
  };
})();



