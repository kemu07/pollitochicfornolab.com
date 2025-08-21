/* ========= REVEAL ON SCROLL ========= */
(() => {
    const els = document.querySelectorAll('[data-reveal], #introduction, .menu-section, #categorias');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  })();
  
  /* ========= CARRITO con persistencia y cálculo de IVU + propina ========= */
  (() => {
    const STORAGE_KEY = 'pc_cart_v1';
    const TAX_RATE = 0.115; // Puerto Rico IVU 11.5% (10.5% estatal + 1% municipal)
  
    const $ = (sel, ctx=document) => ctx.querySelector(sel);
    const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
    const money = (n) => '$' + n.toFixed(2);
  
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        return new Map(Object.entries(obj));
      } catch { return new Map(); }
    };
    const save = (map) => {
      const obj = {};
      for (const [k,v] of map.entries()) obj[k] = v;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    };
  
    let cart = load(); // Map name -> { price:number, qty:number }
  
    // UI refs
    const btnToggle = $('#cart-toggle');
    const panel     = $('#cart-panel');
    const btnClose  = $('#cart-close');
    const listEl    = $('#cart-items');
    const subtotalEl= $('#sum-subtotal');
    const taxEl     = $('#sum-tax');
    const tipEl     = $('#sum-tip');
    const totalEl   = $('#sum-total');
    const countEl   = $('#cart-count');
    const clearBtn  = $('#cart-clear');
    const tipBtns   = $$('.tip-btn');
  
    // Estado propina
    let tipRate = 0; // default 0%
  
    // Abrir/cerrar panel
    btnToggle?.addEventListener('click', () => {
      const open = panel.classList.toggle('is-open');
      panel.setAttribute('aria-hidden', String(!open));
    });
    btnClose?.addEventListener('click', () => {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
    });
  
    // Eventos propina
    tipBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tipBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tipRate = parseFloat(btn.dataset.tip || '0') || 0;
        render();
      });
    });
  
    // Agregar botón “Añadir” automáticamente a cada .menu-item
    autoButtons();
    function autoButtons(){
      // captura tanto <span class="price"> como <spam class="price">
      const items = $$('.menu-item');
      items.forEach(item => {
        if (item.nextElementSibling?.classList?.contains('add-to-cart')) return; // ya tiene botón
        const priceNode = item.querySelector('.price, .price-w') || item.querySelector('spam.price');
        let price = 0;
        if (priceNode) {
          price = parseFloat((priceNode.textContent || '').replace(/[^\d.]/g,''));
        } else {
          // no hay <span class="price"> — ignorar
          return;
        }
        const name = (item.textContent || '').replace(/\$\s*\d+([.,]\d+)?/g,'').trim();
  
        const btn = document.createElement('button');
        btn.className = 'add-to-cart';
        btn.type = 'button';
        btn.textContent = 'Añadir';
        btn.dataset.name = name;
        btn.dataset.price = String(price);
  
        // insertar botón justo después del item
        item.insertAdjacentElement('afterend', btn);
      });
    }
  
    // Delegación: click en botones “Añadir”
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('.add-to-cart');
      if (!btn) return;
      const name  = (btn.dataset.name || '').trim();
      const price = parseFloat(btn.dataset.price || '0');
      if (!name || !Number.isFinite(price)) return;
  
      const item = cart.get(name) || { price, qty: 0 };
      item.qty += 1;
      cart.set(name, item);
      save(cart);
      render();
  
      panel.classList.add('is-open'); panel.setAttribute('aria-hidden', 'false');
    });
  
    // Delegación: +/- dentro del carrito
    listEl.addEventListener('click', (e) => {
      const minus = e.target.closest('.qty-btn[data-act="minus"]');
      const plus  = e.target.closest('.qty-btn[data-act="plus"]');
      if (!minus && !plus) return;
  
      const row  = e.target.closest('.cart-row');
      if (!row) return;
      const name = row.dataset.name;
      const item = cart.get(name);
      if (!item) return;
  
      if (minus) item.qty = Math.max(0, item.qty - 1);
      if (plus)  item.qty += 1;
  
      if (item.qty === 0) cart.delete(name);
      else cart.set(name, item);
  
      save(cart);
      render();
    });
  
    // Vaciar
    clearBtn?.addEventListener('click', () => {
      cart.clear();
      save(cart);
      render();
    });
  
    function calc(){
      let subtotal = 0, count = 0;
      for (const {price, qty} of cart.values()){
        subtotal += price * qty;
        count += qty;
      }
      const tax = subtotal * TAX_RATE;
      const tip = (subtotal + tax) * tipRate; // propina sobre total con IVU (ajústalo si la quieres solo sobre subtotal)
      const total = subtotal + tax + tip;
      return { subtotal, tax, tip, total, count };
    }
  
    function render(){
      // items
      listEl.innerHTML = '';
      for (const [name, item] of cart.entries()){
        const row = document.createElement('div');
        row.className = 'cart-row';
        row.dataset.name = name;
        row.innerHTML = `
          <div class="cart-name">${name}</div>
          <div class="cart-price">${money(item.price)}</div>
          <div class="qty-controls">
            <button class="qty-btn" data-act="minus" aria-label="restar">−</button>
            <span class="qty">${item.qty}</span>
            <button class="qty-btn" data-act="plus" aria-label="sumar">+</button>
          </div>
        `;
        listEl.appendChild(row);
      }
  
      // sumas
      const { subtotal, tax, tip, total, count } = calc();
      subtotalEl.textContent = money(subtotal);
      taxEl.textContent = money(tax);
      tipEl.textContent = money(tip);
      totalEl.textContent = money(total);
      countEl.textContent = count;
    }
  
    // activar 15% por defecto (opcional)
    const defaultTip = document.querySelector('.tip-btn[data-tip="0.15"]');
    if (defaultTip){ defaultTip.click(); } else { render(); }
  })();
  