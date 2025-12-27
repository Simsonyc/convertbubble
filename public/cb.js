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
})(); puis  preview.html : <!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>ConvertBubble – Live Preview</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: #0b0b12;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      color: white;
      font-family: system-ui, sans-serif;
    }
    .notice {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(255,255,255,0.08);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      color: #aaa;
      backdrop-filter: blur(6px);
    }
  </style>
</head>

<body>
  <div class="notice"> ConvertBubble — Mode Preview Live</div>

  <!-- Script principal -->
  <script src="../cb.js" defer></script>

  <script>
    console.log(" Preview live initialisée…");

    // Attente du chargement complet
    window.addEventListener("load", () => {
      console.log(" Preview chargé, attente des messages du Builder...");
      waitForConvertBubble();
    });

    // ======================================================
    // Vérifie la présence de ConvertBubble
    // ======================================================
    function waitForConvertBubble() {
      const start = performance.now();
      const check = setInterval(() => {
        if (window.ConvertBubble && (window.ConvertBubble.reload || window.ConvertBubble.init)) {
          clearInterval(check);
          console.log(` ConvertBubble détecté après ${Math.round(performance.now() - start)} ms`);
        }
      }, 200);

      setTimeout(() => {
        clearInterval(check);
        if (!window.ConvertBubble) {
          console.error(" Toujours pas de ConvertBubble après 4 secondes !");
        }
      }, 4000);
    }

    // ======================================================
    // Gestion propre des messages envoyés par le Builder
    // ======================================================
    window.addEventListener("message", async (ev) => {
      if (!ev.data || !ev.data.type) return;
      const { type, payload } = ev.data;

      switch (type) {
        case "cb:config":
          try {
            console.log(" Nouvelle config reçue du Builder :", payload);

            // Nettoyage avant reload
            document.querySelectorAll(".convertbubble-wrapper, .cb-overlay").forEach(e => e.remove());

            // Recharge ou init ConvertBubble proprement
            if (window.ConvertBubble && typeof window.ConvertBubble.reload === "function") {
              console.log(" Rechargement ConvertBubble avec nouvelle config...");
              await window.ConvertBubble.reload(payload);
            } else if (window.ConvertBubble && typeof window.ConvertBubble.init === "function") {
              console.log(" Initialisation ConvertBubble avec nouvelle config...");
              await window.ConvertBubble.init(payload);
            } else {
              console.warn(" ConvertBubble non encore prêt pour rechargement.");
            }

            console.log(" ConvertBubble rechargé avec succès");
          } catch (err) {
            console.error(" Erreur pendant le reload ConvertBubble :", err);
          }
          break;

        case "cb:open":
          document.querySelector("[data-cb-root]")?.click();
          console.log(" Ouverture manuelle de la bulle depuis le Builder");
          break;

        case "cb:close":
          document.querySelector(".cb-overlay")?.remove();
          console.log(" Fermeture manuelle de la bulle depuis le Builder");
          break;

        case "cb:clear":
          document.querySelectorAll(".convertbubble-wrapper, .cb-overlay").forEach(e => e.remove());
          console.log(" ConvertBubble nettoyé manuellement.");
          break;

        default:
          console.log(" Message ignoré :", ev.data);
      }
    });
  </script>
</body>
</html>


