// // promo.js — Pop-up Happy Hour (sale a los 5s, solo una vez)
// (function(){
//   const SEEN_KEY = "pc-hh-ad-seen-v1";
//   if (localStorage.getItem(SEEN_KEY) === "1") return;

//   // espera 5s

  // promo.js — Pop-up Happy Hour (sale a los 5s SIEMPRE)
// promo.js — Pop-up Happy Hour
// promo.js — Pop-up Happy Hour (aparece a los 5s por sesión)
// Silencio por sesión si: (1) lo cierran, o (2) tocan SEE NOW y luego añaden algo de Happy Hour
(function(){
  const SEEN_KEY = "pc-hh-seen";     // silencia solo en esta sesión
  const CTA_ARMED = "pc-hh-cta";     // banderita: dieron "SEE NOW"

  // Limpia claves viejas basadas en localStorage para evitar bloqueos de pruebas anteriores
  try { localStorage.removeItem("pc-hh-ad-seen-v1"); } catch(_) {}

  // Si ya está silenciado en esta sesión, no mostrar
  if (sessionStorage.getItem(SEEN_KEY) === "1") return;

  // Muestra el pop-up a los 5s
  setTimeout(() => {
    if (sessionStorage.getItem(SEEN_KEY) === "1") return; // por si algo lo marcó mientras tanto

    const overlay = document.createElement("div");
    overlay.id = "hh-modal-overlay";
    overlay.innerHTML = `
      <div id="hh-modal" role="dialog" aria-modal="true" aria-labelledby="hh-title">
        <button id="hh-close" aria-label="Close">✕</button>
        <div class="hh-card">
          <img class="hh-img" alt="Happy Hour" loading="lazy" src="images/happyhour.webp" />
          <h3 id="hh-title">HAPPY HOUR</h3>
          <p class="hh-sub">LIMITED TIME DISCOUNTS!</p>
          <a class="hh-cta" href="happyhour.html">SEE NOW</a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const closeBtn = document.getElementById("hh-close");
    const cta = overlay.querySelector(".hh-cta");

    function silenceThisSession(){
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch(_){}
    }
    function armCta(){
      // marcar que el usuario mostró intención de ver HH; no silenciamos aún
      try { sessionStorage.setItem(CTA_ARMED, "1"); } catch(_){}
    }
    function closeModal(){
      overlay.classList.add("is-hiding");
      setTimeout(()=> overlay.remove(), 180);
    }

    // Accesibilidad
    closeBtn?.focus({preventScroll:true});

    // Cerrar y silenciar por sesión si toca la X, clic fuera o ESC
    closeBtn?.addEventListener("click", ()=>{ silenceThisSession(); closeModal(); });
    overlay.addEventListener("click", (e)=>{ if (e.target.id === "hh-modal-overlay"){ silenceThisSession(); closeModal(); }});
    document.addEventListener("keydown", (e)=>{ if (e.key === "Escape"){ silenceThisSession(); closeModal(); }});

    // SEE NOW: arma la intención (no silencia aún). Navegará a happyhour.html.
    cta?.addEventListener("click", armCta);

  }, 4000);

  // Si el usuario agrega algo de Happy Hour después de tocar SEE NOW, silenciamos por sesión
  document.addEventListener("click", (e)=>{
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;

    // ¿es un botón marcado como happy hour?
    const isHH = btn.dataset && btn.dataset.happyhour === "1";
    const armed = sessionStorage.getItem(CTA_ARMED) === "1";

    if (isHH && armed){
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch(_){}
      // ya no necesitamos la marca de armado
      try { sessionStorage.removeItem(CTA_ARMED); } catch(_){}
    }
  });
})();



//   setTimeout(() => {
//     // Marca como visto apenas aparece (para que no regrese aunque cierren sin interactuar)
//     try { localStorage.setItem(SEEN_KEY, "1"); } catch(_) {}

//     // Crea overlay + modal
//     const overlay = document.createElement("div");
//     overlay.id = "hh-modal-overlay";
//     overlay.innerHTML = `
//       <div id="hh-modal" role="dialog" aria-modal="true" aria-labelledby="hh-title">
//         <button id="hh-close" aria-label="Close">✕</button>
//         <div class="hh-card">
//           <img class="hh-img" alt="Happy Hour" loading="lazy"
//                src="images/happyhour.jpg" />
//           <h3 id="hh-title">HAPPY HOUR</h3>
//           <p class="hh-sub">¡Descuentos limited time!</p>
//           <a class="hh-cta" href="happyhour.html">SEE NOW</a>
//         </div>
//       </div>
//     `;
//     document.body.appendChild(overlay);

//     // Focus al botón de cerrar
//     const closeBtn = document.getElementById("hh-close");
//     if (closeBtn) closeBtn.focus({preventScroll:true});

//     // Cerrar: X, click afuera, ESC
//     function closeModal(){
//       overlay.classList.add("is-hiding");
//       setTimeout(()=> overlay.remove(), 180);
//     }
//     overlay.addEventListener("click", (e)=>{
//       if (e.target.id === "hh-modal-overlay") closeModal();
//     });
//     closeBtn.addEventListener("click", closeModal);
//     document.addEventListener("keydown", (e)=>{
//       if (e.key === "Escape") closeModal();
//     });

//     // Por si quieres marcar “visto” al clicar CTA también:
//     const cta = overlay.querySelector(".hh-cta");
//     if (cta) cta.addEventListener("click", ()=> {
//       try { localStorage.setItem(SEEN_KEY, "1"); } catch(_){}
//     });
//   }, 5000);
// })();
