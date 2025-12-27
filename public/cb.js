(function () {
  console.log(" cb.js initialisé (overlay CTA actif)");

  // ==========================================================
  // UTILITAIRES DE BASE
  // ==========================================================
  function el(tag, style) {
    const e = document.createElement(tag);
    if (style) Object.assign(e.style, style);
    return e;
  }
  function px(n) { return typeof n === "number" ? n + "px" : n; }

  // Convertit couleur → rgba()
  function toRgba(color, alpha = 1) {
    alpha = Math.max(0, Math.min(1, alpha));
    if (!color) return `rgba(255,0,85,${alpha})`;
    if (color.startsWith("rgba(")) {
      const parts = color.slice(5, -1).split(",").map(s => s.trim());
      if (parts.length === 4) parts[3] = String(alpha); else parts.push(String(alpha));
      return `rgba(${parts.join(",")})`;
    }
    if (color.startsWith("rgb(")) {
      const body = color.slice(4, -1);
      return `rgba(${body}, ${alpha})`;
    }
    const hex = color.replace("#", "").trim();
    if (/^[0-9a-fA-F]{3}$/.test(hex)) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return color;
  }

  // ==========================================================
  // CONFIG
  // ==========================================================
  async function loadConfig() {
    const url = window.location.origin + "/config.json";
    console.log(" Chargement config depuis:", url);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Config introuvable: " + res.status);
    return await res.json();
  }

  // ==========================================================
  // RÈGLES D’AFFICHAGE
  // ==========================================================
  function matchAnyRegex(patterns, href) {
    try { return patterns.some(p => new RegExp(p).test(href)); }
    catch (e) { console.warn("Regex invalide:", e); return false; }
  }
  function shouldRenderByUrl(config) {
    const rules = config?.display?.rules;
    if (!rules || !Array.isArray(rules.patterns) || !rules.patterns.length) return true;
    const href = location.href;
    const isMatch = matchAnyRegex(rules.patterns, href);
    return rules.mode === "blocklist" ? !isMatch : isMatch;
  }

  // ==========================================================
  // ANIMATIONS
  // ==========================================================
  const activeAnimations = new WeakMap();
  function applyAnimation(node, type) {
    const prev = activeAnimations.get(node);
    if (prev && prev.cancel) try { prev.cancel(); } catch { }
    if (!type || type === "none") return;
    let a;
    if (type === "pulse")
      a = node.animate([{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }],
        { duration: 1200, iterations: Infinity, easing: "ease-in-out" });
    else if (type === "bounce")
      a = node.animate([{ transform: "translateY(0)" }, { transform: "translateY(-6px)" }, { transform: "translateY(0)" }],
        { duration: 900, iterations: Infinity, easing: "ease-in-out" });
    activeAnimations.set(node, a);
  }

  // ==========================================================
  // BULLE
  // ==========================================================
  function clearOldBubbles() {
    document.querySelectorAll('[data-cb-root], .convertbubble-wrapper, .cb-overlay')
      .forEach(el => el.remove());
    document.getAnimations().forEach(a => { try { a.cancel(); } catch { } });
  }

  function createBubble(config) {
    clearOldBubbles();

    const theme = config.theme || {};
    const bubbleTheme = theme.bubble || {};
    const captionCfg = theme.caption || {};
    const shape = theme.shape || "circle";
    const pos = config.position || "BR";
    const anim = config.animation || "none";
    const bw = Math.max(bubbleTheme.width || 120, 120);
    const bh = bubbleTheme.height || 120;
    const captionPos = captionCfg.position || "right";
    const maxFraction = captionCfg.maxFraction || 0.5;

    const wrapper = el("div", {
      position: "fixed",
      zIndex: 2147483646,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      userSelect: "none",
      background: theme.primary || "#ff0055",
      color: captionCfg.color || "#fff",
      border: (theme.border?.width || 0) + "px solid " + (theme.border?.color || "transparent"),
      borderRadius: shape === "circle" ? "50%" : "14px",
      boxShadow: "0 10px 20px rgba(0,0,0,.18)",
      overflow: "hidden"
    });
    wrapper.classList.add("convertbubble-wrapper");
    wrapper.setAttribute("data-cb-root", "1");

    if (captionPos === "left" || captionPos === "right") {
      wrapper.style.width = px(bw + bw * maxFraction);
      wrapper.style.height = px(bh);
      wrapper.style.flexDirection = captionPos === "left" ? "row-reverse" : "row";
    } else {
      wrapper.style.width = px(bw);
      wrapper.style.height = px(bh + bh * maxFraction);
      wrapper.style.flexDirection = captionPos === "top" ? "column-reverse" : "column";
    }

    const bubbleContent = el("div", {
      width: px(bw),
      height: px(bh),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: "0",
      overflow: "hidden"
    });

    const lc = config.launcherContent || { type: "emoji", emoji: " " };
    if (lc.type === "videoPreview") {
      const pv = el("video", { width: "100%", height: "100%", objectFit: "cover" });
      pv.src = lc.src || "";
      pv.muted = true; pv.autoplay = true; pv.playsInline = true; pv.loop = false;
      bubbleContent.appendChild(pv);
      const limit = lc.previewSeconds || 3;
      pv.addEventListener("timeupdate", () => { if (pv.currentTime >= limit) { pv.currentTime = 0; pv.play().catch(() => { }); } });
    } else if (lc.type === "image") {
      const img = el("img", { width: "100%", height: "100%", objectFit: "cover" });
      img.src = lc.src || "";
      bubbleContent.appendChild(img);
    } else {
      const icon = el("div", { fontSize: "34px" });
      icon.textContent = lc.emoji || " ";
      bubbleContent.appendChild(icon);
    }
    wrapper.appendChild(bubbleContent);

    if (captionCfg.text) {
      const caption = el("div", {
        flex: "1",
        padding: "4px 6px",
        fontSize: (captionCfg.fontSize || 13) + "px",
        textAlign: "center",
        color: captionCfg.color || "#fff"
      });
      caption.textContent = captionCfg.text;
      wrapper.appendChild(caption);
    }

    const margin = 18;
    if (pos.includes("B")) wrapper.style.bottom = px(margin);
    if (pos.includes("T")) wrapper.style.top = px(margin);
    if (pos.includes("R")) wrapper.style.right = px(margin);
    if (pos.includes("L")) wrapper.style.left = px(margin);

    applyAnimation(wrapper, anim);
    return wrapper;
  }

  // ==========================================================
  // OVERLAY VIDÉO
  // ==========================================================
  function openOverlay(config, wrapper) {
    document.querySelectorAll(".cb-overlay").forEach(o => o.remove());
    wrapper.style.display = "none";

    const overlay = el("div", {
      position: "fixed",
      inset: "0",
      background: `rgba(0,0,0,${config.theme?.overlayOpacity ?? 0.8})`,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10000
    });
    overlay.classList.add("cb-overlay");

    const box = el("div", {
      background: "rgba(11,16,32,0.8)",
      backdropFilter: "blur(12px)",
      borderRadius: "16px",
      padding: "16px",
      maxWidth: "90%",
      maxHeight: "90%",
      display: "flex",
      flexDirection: "column",
      color: "white",
      boxShadow: "0 0 40px rgba(0,0,0,0.6)"
    });

    const vcfg = config.video || {};
    const video = document.createElement("video");
    Object.assign(video.style, {
      width: "100%",
      height: "auto",
      borderRadius: "10px",
      objectFit: "contain",
      background: "#000"
    });
    video.src = vcfg.src || "";
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    box.appendChild(video);

    const closeBtn = el("button", {
      position: "absolute",
      top: "12px",
      right: "12px",
      border: "none",
      background: "rgba(255,255,255,0.25)",
      color: "#fff",
      fontSize: "22px",
      borderRadius: "50%",
      width: "36px",
      height: "36px",
      cursor: "pointer"
    });
    closeBtn.textContent = "×";
    closeBtn.onclick = () => { overlay.remove(); wrapper.style.display = "flex"; };
    box.appendChild(closeBtn);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // ==========================================================
  // INITIALISATION AUTOMATIQUE
  // ==========================================================
  (async function init() {
    try {
      clearOldBubbles();
      const config = await loadConfig();
      if (!shouldRenderByUrl(config)) return;
      const wrapper = createBubble(config);
      wrapper.onclick = () => openOverlay(config, wrapper);
      document.body.appendChild(wrapper);
    } catch (e) {
      console.error(" Erreur init ConvertBubble:", e);
    }
  })();

  // exporte les fonctions internes
  window.__cb_internal_createBubble = createBubble;
  window.__cb_internal_openOverlay = openOverlay;

})(); // FIN DU IIFE


// ==========================================================
// EXPORT GLOBAL POUR BUILDER
// ==========================================================
let __cb_createBubble, __cb_openOverlay;

document.addEventListener("DOMContentLoaded", () => {
  __cb_createBubble = window.__cb_internal_createBubble;
  __cb_openOverlay = window.__cb_internal_openOverlay;
});

window.ConvertBubble = {
  reload: async (newConfig) => {
    try {
      console.log(" Rechargement ConvertBubble avec nouvelle config...");
      document.querySelectorAll('[data-cb-root], .convertbubble-wrapper, .cb-overlay').forEach(e => e.remove());

      const config = newConfig || await (async () => {
        const url = window.location.origin + "/config.json";
        const res = await fetch(url, { cache: "no-store" });
        return await res.json();
      })();

      if (typeof __cb_createBubble !== "function") {
        console.warn(" createBubble non encore chargé, on réessaie...");
        return;
      }

      const wrapper = __cb_createBubble(config);
      wrapper.onclick = () => __cb_openOverlay(config, wrapper);
      document.body.appendChild(wrapper);

      console.log(" ConvertBubble rechargé avec succès");
    } catch (e) {
      console.error(" Erreur reload ConvertBubble:", e);
    }
  }
};

console.log(" ConvertBubble exporté globalement -> window.ConvertBubble OK"); 

