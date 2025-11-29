(function () {
  console.log("✅ cb.js initialisé (overlay CTA actif)");

  // --------- Utilitaires -----------------
  function el(tag, style) {
    const e = document.createElement(tag);
    if (style) Object.assign(e.style, style);
    return e;
  }
  function px(n){ return typeof n === "number" ? n + "px" : n; }

  async function loadConfig() {
    const url = (document.currentScript && document.currentScript.dataset.config) || "config.json";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Config introuvable: " + res.status);
    return await res.json();
  }

  function matchAnyRegex(patterns, href) {
    try { return patterns.some(p => new RegExp(p).test(href)); }
    catch(e){ console.warn("Regex invalide:", e); return false; }
  }
  function shouldRenderByUrl(config) {
    const rules = config && config.display && config.display.rules;
    if (!rules || !Array.isArray(rules.patterns) || !rules.patterns.length) return true;
    const href = location.href;
    const isMatch = matchAnyRegex(rules.patterns, href);
    if (rules.mode === "allowlist") return isMatch;
    if (rules.mode === "blocklist") return !isMatch;
    return true;
  }

  function applyAnimation(node, type) {
    if (type === "pulse") {
      node.animate([{ transform:"scale(1)" }, { transform:"scale(1.06)" }, { transform:"scale(1)" }],
                   { duration: 1200, iterations: Infinity, easing:"ease-in-out" });
    } else if (type === "bounce") {
      node.animate([{ transform:"translateY(0)" }, { transform:"translateY(-6px)" }, { transform:"translateY(0)" }],
                   { duration: 900, iterations: Infinity, easing:"ease-in-out" });
    }
  }

  // --------- Création de la bulle -----------------
  function createBubble(config) {
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
      position:"fixed", zIndex:2147483646,
      display:"flex", alignItems:"center", justifyContent:"center",
      cursor:"pointer", userSelect:"none",
      background: theme.primary || "#ff0055",
      color: captionCfg.color || "#fff",
      border: (theme.border?.width || 0) + "px solid " + (theme.border?.color || "transparent"),
      borderRadius: shape === "circle" ? "50%" : "14px",
      boxShadow:"0 10px 20px rgba(0,0,0,.18)", overflow:"hidden"
    });

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
      width: px(bw), height: px(bh),
      display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink:"0", overflow:"hidden"
    });

    const lc = config.launcherContent || { type:"emoji", emoji:"▶" };
    if (lc.type === "videoPreview") {
      const pv = el("video", { width:"100%", height:"100%", objectFit:"cover" });
      pv.src = lc.src || "";
      pv.muted = true; pv.autoplay = true; pv.playsInline = true; pv.loop = false;
      bubbleContent.appendChild(pv);
      const limit = lc.previewSeconds || 3;
      pv.addEventListener("timeupdate", () => { if (pv.currentTime >= limit) { pv.currentTime = 0; pv.play().catch(()=>{}); } });
    }
    wrapper.appendChild(bubbleContent);

    if (captionCfg && captionCfg.text) {
      const caption = el("div", {
        flex:"1", padding:"4px 6px",
        fontSize:(captionCfg.fontSize || 13)+"px",
        textAlign:"center", whiteSpace:"normal", wordBreak:"break-word",
        color: captionCfg.color || "#fff"
      });
      caption.textContent = captionCfg.text;
      wrapper.appendChild(caption);
    }

    const margin = 18;
    if (pos === "BR") { wrapper.style.bottom = px(margin); wrapper.style.right = px(margin); }

    applyAnimation(wrapper, anim);
    return wrapper;
  }

  // --------- Player overlay -----------------
  function openOverlay(config, wrapper) {
    wrapper.style.display = "none";

    const overlay = el("div", {
      position: "fixed", inset: "0",
      background: `rgba(0,0,0,${config.theme?.overlayOpacity ?? 0.9})`,
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 10000
    });

    const box = el("div", {
      background:"#0b1020", borderRadius:"12px", padding:"16px",
      maxWidth:"90%", maxHeight:"90%", position:"relative",
      display:"flex", flexDirection:"column", boxShadow:"0 12px 40px rgba(0,0,0,0.5)", color:"white"
    });

    // Branding
    if (config.branding && config.branding.enabled) {
      const header = el("div", {
        width:"100%", height:"80px",
        background: config.branding.color || "#ff0055",
        display:"flex", alignItems:"center", justifyContent:"center",
        position:"relative", borderRadius:"8px",
        border:"2px solid #2563eb",   // ✅ uniforme sur tout le contour
        marginBottom:"8px", boxSizing:"border-box"
      });
      const label = el("div", { color:"#fff", fontWeight:"bold", fontSize:"28px" });
      label.textContent = config.branding.label || "";
      const closeBtn = el("button", {
        position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)",
        width:"36px", height:"36px", border:"none", borderRadius:"50%",
        fontSize:"22px", cursor:"pointer",
        background:"rgba(255,255,255,0.3)", color:"white"
      });
      closeBtn.textContent = "×";
      closeBtn.onclick = () => { overlay.remove(); wrapper.style.display = "flex"; };
      header.appendChild(label); header.appendChild(closeBtn);
      box.appendChild(header);
    }

    // Vidéo
    const videoWrap = el("div", {
      position:"relative", width:"100%", flex:"1",
      background:"#000", borderRadius:"10px", overflow:"hidden"
    });
    const vcfg = config.video || {};
    const video = el("video", {
      width:"100%", height:"100%", objectFit:"contain", background:"#000",
      controls: true,
      controlsList: "nodownload"
    });
    video.src = vcfg.src || ""; 
    video.autoplay = true;
    video.playsInline = true; 
    video.preload = "auto";
    videoWrap.appendChild(video);

    // CTA corrigé (80% largeur, mais remonté pour libérer la barre native)
    const ctasWrap = el("div", {
      position:"absolute", bottom:`${config.ctaOverlay?.offset ?? 120}px`, // ⬅️ relevé
      left:"50%", transform:"translateX(-50%)",
      display:"none", gap:"10px",
      width:"80%", justifyContent:"center",
      borderRadius:"6px",
      background:`rgba(0,0,0,${config.ctaOverlay?.opacity ?? 0.6})`,
      zIndex:20002
    });

    function makeCta(c) {
      const a = el("a", {
        flex:"1", textAlign:"center",
        background: config.theme?.primary || "#ff0055",
        padding:"10px 16px", borderRadius:"6px",
        color:"white", fontWeight:"bold",
        textDecoration:"none", display:"none",
        minWidth:"0"
      });
      a.textContent = c.label || "Action"; a.href = c.href || "#";
      return a;
    }
    const ctas = (config.ctas || []).map(makeCta);
    ctas.forEach(a => ctasWrap.appendChild(a));
    videoWrap.appendChild(ctasWrap);

    box.appendChild(videoWrap);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // logique CTA
    const seq = config.timing?.sequence || [];
    const showAllAt = config.timing?.showAllAt;
    video.addEventListener("timeupdate", () => {
      const t = video.currentTime || 0;
      let anyVisible = false;
      seq.forEach(s => {
        const idx = s.index|0;
        if (ctas[idx]) {
          const inWindow = (s.duration) ? (t >= s.showAt && t < (s.showAt+s.duration)) : (t >= s.showAt);
          ctas[idx].style.display = inWindow ? "block" : "none";
          if (inWindow) anyVisible = true;
        }
      });
      if ((typeof showAllAt==="number" && t>=showAllAt) || (showAllAt==="end" && video.duration && t>=video.duration-0.5)) {
        ctas.forEach(a=>a.style.display="block");
        anyVisible = true;
      }
      ctasWrap.style.display = anyVisible ? "flex" : "none";
    });

    video.play().catch(()=>{});
  }

  // --------- Bootstrap -----------------
  (async function init(){
    try {
      const config = await loadConfig();
      if (!shouldRenderByUrl(config)) return;
      const wrapper = createBubble(config);
      wrapper.onclick = () => openOverlay(config, wrapper);
      document.body.appendChild(wrapper);
    } catch (e) {
      console.error("❌ Erreur init ConvertBubble:", e);
    }
  })();
})();

