// cart-ui.js (limpio, sin aria-hidden, con focus seguro)
(function () {
  // ===== helpers =====
  function ensure(id, html) {
    let el = document.getElementById(id);
    if (!el) {
      document.body.insertAdjacentHTML("beforeend", html);
      el = document.getElementById(id);
    }
    return el;
  }
  function panel()   { return document.getElementById("cart-panel"); }
  function trigger() { return document.getElementById("cart-trigger"); }
  function isOpen()  { return panel()?.classList.contains("open"); }

  function open() {
    const p = panel(); if (!p) return;
    p.classList.add("open");
    p.style.transform  = "translateX(0)";
    p.style.transition = "transform .25s ease";
    const closeBtn = document.getElementById("cart-close");
    if (closeBtn) closeBtn.focus({ preventScroll:true });
  }

  function close() {
    const p = panel(); if (!p) return;
    const active = document.activeElement;
    if (p.contains(active)) {
      const t = trigger();
      if (t) t.focus({ preventScroll:true });
    }
    p.classList.remove("open");
    p.style.transform  = "translateX(100%)";
    p.style.transition = "transform .25s ease";
  }

  function toggle() { isOpen() ? close() : open(); }

  // ===== tema por defecto =====
  if (!document.body.classList.contains("theme-sky") && !document.body.classList.contains("theme-white")) {
    document.body.classList.add("theme-sky");
  }

  // ===== trigger (inyectar si no existe) =====
  ensure("cart-trigger", `
    <button id="cart-trigger" aria-label="Abrir carrito" title="Carrito"
      style="position:fixed;top:16px;right:16px;z-index:100000;pointer-events:auto;">
      🛒 <span class="badge" id="cart-count">0</span>
    </button>
  `);

  // ===== panel (inyectar si no existe) =====
  ensure("cart-panel", `
    <aside id="cart-panel"
      style="position:fixed;top:0;right:0;height:100dvh;width:min(92vw,380px);
             z-index:100000;background:color-mix(in srgb,var(--pc-white) 92%, var(--pc-pink-2));
             color:var(--pc-navy);box-shadow:-18px 0 30px rgba(var(--pc-navy-rgb),.2);
             transform:translateX(100%);transition:transform .25s ease;
             border-left:1px solid rgba(var(--pc-navy-rgb),.15);display:flex;flex-direction:column;">
      <div style="display:flex;align-items:center;justify-content:flex-end;padding:10px 12px;">
        <button id="cart-close" class="btn" style="padding:6px 10px;border-radius:10px;background:var(--pc-pink);">✕</button>
      </div>
      <ul id="cart-items" style="list-style:none;margin:0;padding:10px 12px;display:grid;gap:10px;overflow:auto;"></ul>
      <div class="cart-totals" style="margin-top:auto;padding:12px 12px 16px;display:grid;gap:8px;border-top:1px solid rgba(var(--pc-navy-rgb),.12);">
        <div class="row" style="display:flex;justify-content:space-between;"><span>IVU</span> <strong id="t-tax">$0.00</strong></div>
        <div class="row" style="display:flex;justify-content:space-between;"><span>Total</span> <strong id="t-total">$0.00</strong></div>
        <div class="row" style="margin-top:6px"><span>Propina</span></div>
        <div class="tip-group" style="display:flex;gap:8px;flex-wrap:wrap;">
          
          <button class="tip-btn" data-tip="0.15">15%</button>
          <button class="tip-btn" data-tip="0.18">18%</button>
          <button class="tip-btn" data-tip="0.20">20%</button>
        </div>
        <div class="row" style="display:flex;justify-content:space-between;"><span>Total + propina</span> <strong id="t-grand" class="emph">$0.00</strong></div>
      </div>
    </aside>
  `);

  // ===== modal de opciones (inyectar si no existe) =====
  ensure("options-modal", `
    <div id="options-modal" class="modal" hidden>
      <div class="modal-card">
        <h3 id="opt-title">Elige tus acompañantes</h3>
        <p class="opt-sub"><span id="opt-counter"></span></p>
        <div id="opt-list" class="opt-list"></div>
        <div class="opt-actions">
          <button id="opt-cancel" class="btn" style="background:var(--pc-pink-2);color:var(--pc-navy)">Cancelar</button>
          <button id="opt-confirm" class="btn" disabled>Confirmar</button>
        </div>
      </div>
      <div class="modal-backdrop"></div>
    </div>
  `);

  // ===== listeners (siempre rebind limpios) =====
  const trig = trigger();
  const btnClose = document.getElementById("cart-close");

  if (trig.__pc_handler__) trig.removeEventListener("click", trig.__pc_handler__);
  trig.__pc_handler__ = (e)=>{ e.preventDefault(); toggle(); };
  trig.addEventListener("click", trig.__pc_handler__);

  if (btnClose) {
    if (btnClose.__pc_handler__) btnClose.removeEventListener("click", btnClose.__pc_handler__);
    btnClose.__pc_handler__ = (e)=>{ e.preventDefault(); close(); };
    btnClose.addEventListener("click", btnClose.__pc_handler__);
  }

  document.addEventListener("keydown", (e)=>{ if (e.key === "Escape") close(); });

  // z-index y click asegurados
  trig.style.zIndex = "100000";
  trig.style.pointerEvents = "auto";
  panel().style.zIndex = "100000";

  // ===== scroll reveal =====
  const io = new IntersectionObserver(
    (ents)=>ents.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('is-visible'); } }),
    {threshold:.12}
  );
  document.querySelectorAll("[data-reveal]").forEach(el=>io.observe(el));
})();