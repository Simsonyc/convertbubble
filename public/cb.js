// ==========================================================
//  ConvertBubble Player V4.5 — Version stable + animations
//  Patch officiel "badge" : demi-cercle haut + bas plat arrondi
// ==========================================================

(function () {
  console.log("DEBUG — FICHIER CB.JS (MODE BADGE) CHARGE ✔️");
  // --------------------------------------------------------
  // 🔤 Chargement des polices Poppins & Inter (Google Fonts)
  // --------------------------------------------------------
  (function loadConvertBubbleFonts() {
    const FONT_LINK_ID = "convertbubble-fonts";
    if (document.getElementById(FONT_LINK_ID)) return;

    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
  })();

  // --------------------------------------------------------
  // 🔥 HOTFIX MOBILE — Empêche la vidéo de déborder
  // --------------------------------------------------------
  const fix = document.createElement("style");
  fix.textContent = `
    .convertbubble-wrapper video {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      object-position: center !important;
      display: block !important;
      border-radius: inherit !important;
      overflow: hidden !important;
    }
  `;
  document.head.appendChild(fix);

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

  function toRGBA(hex, alpha = 1) {
    if (!hex) return `rgba(255,0,85,${alpha})`;
    hex = hex.replace("#", "").trim();
    if (hex.length === 3) {
      hex = hex[0]+hex[0] + hex[1]+hex[1] + hex[2]+hex[2];
    }
    if (hex.length !== 6) return hex;
    const r = parseInt(hex.slice(0,2),16);
    const g = parseInt(hex.slice(2,4),16);
    const b = parseInt(hex.slice(4,6),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  async function loadConfig() {
    const script = document.currentScript;
    const cfg = script ? script.getAttribute("data-config") : null;
    const url = cfg || "/config.json";
    const res = await fetch(url, { cache: "no-store" });
    return await res.json();
  }

  // Nettoyage complet avant chaque init/reload
function clearAll() {
  try {

    // 🔥 Suppression complète : bulle, overlay, wrapper flottant
    document.querySelectorAll(
      ".convertbubble-wrapper, .cb-overlay, #convertbubble-floating-wrapper"
    ).forEach(el => el.remove());

    // 🔥 Annuler toutes animations Web
    document.getAnimations().forEach(a => {
      try { a.cancel(); } catch(_) {}
    });

  } catch (e) {
    console.warn("clearAll() error:", e);
  }
}

    


  // --------------------------------------------------------
  // Animations
  // --------------------------------------------------------
  const activeAnimations = new WeakMap();

  function applyAnimation(node, type) {
    const prev = activeAnimations.get(node);
    if (prev && prev.cancel) try { prev.cancel(); } catch(_){}
    if (!type || type === "none") return;

    let a;
    if (type === "pulse") {
      a = node.animate([
        { transform:"scale(1)" }, { transform:"scale(1.06)" }, { transform:"scale(1)" }
      ], { duration:1200, iterations:Infinity, easing:"ease-in-out" });
    }
    if (type === "bounce") {
      a = node.animate([
        { transform:"translateY(0)" }, { transform:"translateY(-6px)" }, { transform:"translateY(0)" }
      ], { duration:900, iterations:Infinity, easing:"ease-in-out" });
    }
    if (type === "float") {
      a = node.animate([
        { transform:"translateY(0)" }, { transform:"translateY(-4px)" }, { transform:"translateY(0)" }
      ], { duration:3000, iterations:Infinity, easing:"ease-in-out" });
    }
    if (type === "rotate") {
      a = node.animate([
        { transform:"rotate(0deg)" }, { transform:"rotate(5deg)" }, { transform:"rotate(-5deg)" }, { transform:"rotate(0deg)" }
      ], { duration:4000, iterations:Infinity, easing:"ease-in-out" });
    }
    if (type === "breath") {
      a = node.animate([
        { transform:"scale(1)", filter:"brightness(1)" },
        { transform:"scale(1.03)", filter:"brightness(1.1)" },
        { transform:"scale(1)", filter:"brightness(1)" }
      ], { duration:2500, iterations:Infinity, easing:"ease-in-out" });
    }

    activeAnimations.set(node, a);
  }

  // --------------------------------------------------------
  // Bulle flottante (LA PARTIE IMPORTANTE AVEC LE BADGE)
  // --------------------------------------------------------
  async function createBubble(config) {
    const theme   = config.theme   || {};
    const bubble  = theme.bubble   || {};
    const caption = theme.caption  || {};

    // 🔥🔥🔥 FIX MAGISTRAL : on transforme "circle" → "badge"
        const shape = theme.shape || "rounded";
    // 🔥🔥🔥 Maintenant, ton test fonctionne enfin.

    const anim    = config.animation || "none";

    const w = bubble.width  || 180;
    const h = bubble.height || 120;

    const isBadge = shape === "badge";

    // ---- WRAPPER ----
    const wrapper = el("div", {
  position: "relative",
  width: px(w),
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",

  // --- Formes officielles ---
  borderRadius:
    shape === "badge"
      ? "999px 999px 300px 300px"  // badge rond + bas plat
      : shape === "square"
        ? "0"                      // carré strict
        : "16px",                  // arrondi standard

  background: theme.primary || "#ff0055",
  outline:
    (theme.border?.width || 0) +
    "px solid " +
    (theme.border?.color || "transparent"),
  cursor: "pointer",
  boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
  fontFamily: theme.fontFamily || "Poppins, system-ui, sans-serif",
  userSelect: "none",
});


    wrapper.classList.add("convertbubble-wrapper");

    // --------------------------------------------------------
    // ---- CONTENU LAUNCHER (vidéo / image / logo)
    // --------------------------------------------------------
    const launcher = config.launcherContent || {
      type: "videoPreview",
      src: "https://convertbubble-cdn.vercel.app/assets/convertbubble-default.mp4",
      previewSeconds: 3,
      alt: caption.text || "ConvertBubble",
    };

    const videoBox = el("div", {
      width: "100%",
      height: isBadge ? px(Math.round(h * 0.72)) : px(h),
      overflow: "hidden",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: shape === "badge" ? "999px 999px 0 0" : "inherit",
    });

    //----------------------------------------------------------
    // IMAGE
    //----------------------------------------------------------
    if (launcher.type === "image") {
      const img = document.createElement("img");
      img.src = launcher.src || "";
      img.alt = launcher.alt || caption.text || "ConvertBubble image";

      Object.assign(img.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
        borderRadius: "inherit",
        display: "block",
      });

      videoBox.appendChild(img);
    }

    //----------------------------------------------------------
    // LOGO (centré + paddings)
    //----------------------------------------------------------
    else if (launcher.type === "logo") {
      const img = document.createElement("img");
      img.src = launcher.src || "";
      img.alt = launcher.alt || caption.text || "ConvertBubble logo";

      Object.assign(img.style, {
        width: "70%",
        height: "70%",
        objectFit: "contain",
        objectPosition: "center",
        borderRadius: "inherit",
        display: "block",
      });

      videoBox.appendChild(img);
    }

    //----------------------------------------------------------
    // VIDEO PREVIEW (boucle courte)
    //----------------------------------------------------------
    else {
      const v = document.createElement("video");

      Object.assign(v, {
        src: launcher.src,
        muted: true,
        autoplay: true,
        playsInline: true,
      });

      Object.assign(v.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
        borderRadius: "inherit",
        display: "block",
      });

      const limit = Number(launcher.previewSeconds || 3);
      v.addEventListener("timeupdate", () => {
        if (v.currentTime >= limit) v.currentTime = 0;
      });

      v.addEventListener("error", () => {
        console.warn("⚠️ Launcher vidéo introuvable:", launcher.src);
      });

      videoBox.appendChild(v);
    }

    wrapper.appendChild(videoBox);



// ---- CAPTION (VERSION PREMIUM AUTO-ADAPTATIVE) ----
if (caption.text) {
  const cap = el("div", {
    width: "100%",
    padding: "10px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontSize: (caption.fontSize || 14) + "px",
    color: caption.color || "#fff",
    fontFamily: caption.fontFamily || theme.fontFamily || "Poppins, system-ui, sans-serif",
    background: "transparent",

    // Bas arrondi spécial mode badge
    borderRadius: isBadge ? "0 0 999px 999px" : "inherit",

    lineHeight: "1.25",
    overflow: "visible",
  // ⭐ AJOUTS CRUCIAUX ⭐
  boxSizing: "border-box",
  gap: "4px",
  });

  const span = el("span", {
  display: "block",
  padding: "0 6px 4px 6px",
  maxWidth: "100%",
  whiteSpace: "normal",
  overflowWrap: "break-word",
  wordBreak: "break-word",
  textAlign: "center",
  boxSizing: "border-box",
});

  span.textContent = caption.text;

  cap.appendChild(span);
  wrapper.appendChild(cap);
}



    applyAnimation(wrapper, anim);
    return wrapper;
  }

  // --------------------------------------------------------
  // Overlay vidéo
  // --------------------------------------------------------
  function openOverlay(config, bubbleWrapper) {
    if (!config.video?.src) return;

    const overlay = el("div", {
      position:"fixed", inset:"0", zIndex:2147483647,
      background:"rgba(0,0,0,0.82)",
      display:"flex", alignItems:"center", justifyContent:"center",
      backdropFilter:"blur(4px)"
    });

    overlay.classList.add("cb-overlay");

    const box = el("div", {
      position:"relative",
      background:"rgba(5,7,16,0.92)",
      borderRadius:"16px",
      padding:"12px",
      width:"min(900px,94vw)",
      maxHeight:"90vh",
      display:"flex",
      flexDirection:"column",
      overflow:"hidden"
    });

    const video = document.createElement("video");
    Object.assign(video, {
      src: config.video.src,
      controls:true,
      autoplay:true,
      playsInline:true
    });
    Object.assign(video.style, {
      width:"100%",
      maxHeight:"calc(90vh - 120px)",
      borderRadius:"12px",
      objectFit:"contain",
      background:"#000"
    });

    box.appendChild(video);

    const closeBtn = el("button", {
      position:"absolute", top:"10px", right:"10px",
      width:"34px", height:"34px",
      borderRadius:"50%",
      border:"none",
      background:"rgba(255,255,255,0.25)",
      color:"#fff", cursor:"pointer", fontSize:"20px"
    });

    closeBtn.textContent = "×";
    closeBtn.onclick = () => {
      overlay.remove();
      try{ video.pause(); }catch(_){}
    };

    box.appendChild(closeBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }
  // --------------------------------------------------------
  // INIT
  // --------------------------------------------------------
  (async function init(){
    try {
      clearAll();
      const config = await loadConfig();
      const bubble = await createBubble(config);

      let fw = document.getElementById("convertbubble-floating-wrapper");
      if (!fw) {
        fw = document.createElement("div");
        fw.id = "convertbubble-floating-wrapper";
        Object.assign(fw.style,{
          position:"fixed",
          right:"20px",
          bottom:"20px",
          zIndex:2147483646,
          pointerEvents:"none"
        });
        document.body.appendChild(fw);
      }

      bubble.style.pointerEvents = "auto";
      fw.innerHTML = "";
      fw.appendChild(bubble);

      bubble.onclick = () => openOverlay(config, bubble);

    } catch(e) {
      console.error("Erreur init:", e);
    }
  })();

  // --------------------------------------------------------
  // RELOAD (pour le Builder)
  // --------------------------------------------------------
  window.ConvertBubble = {
    reload: async function(cfg){
      try {
        clearAll();
        const config = cfg || await loadConfig();

        const bubble = await createBubble(config);
        let fw = document.getElementById("convertbubble-floating-wrapper");
        if (!fw) {
          fw = document.createElement("div");
          fw.id="convertbubble-floating-wrapper";
          Object.assign(fw.style,{
            position:"fixed",
            right:"20px",
            bottom:"20px",
            zIndex:2147483646,
            pointerEvents:"none"
          });
          document.body.appendChild(fw);
        }

        bubble.style.pointerEvents="auto";
        fw.innerHTML="";
        fw.appendChild(bubble);

        bubble.onclick = () => openOverlay(config, bubble);

      } catch(e) {
        console.error("Erreur reload:", e);
      }
    }
  };

})();


