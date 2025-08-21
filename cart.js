/* ====== Config ====== */
// OJO: Ya no usamos un TAX_RATE global. Cada item trae su taxRate (0.07 comida, 0.11 alcohol)
let tipRate = 0.15;        // 0, .15, .18, .20

/* ====== Catálogo de opciones ====== */
const CATALOG = {
  optionGroups: {
    sides: {
      title: "Elige tus acompañantes",
      allowExtras: true,
      max: 6,
      items: [
        { id:"mamposteao",       label:"Mamposteao",               baseUpcharge:0 },
        { id:"butter-biscuits",  label:"Butter Biscuits",          baseUpcharge:0 },
        { id:"cornbread",        label:"Cornbread Biscuits",       baseUpcharge:0 },
        { id:"fries",            label:"French fries",             baseUpcharge:0 },
        { id:"fries-truffle",    label:"Truffle french fries",     baseUpcharge:4 },
        { id:"mac",              label:"Mac & cheese",             baseUpcharge:0 },
        { id:"mac-truffle",      label:"Truffle Mac & cheese",     baseUpcharge:4 },
        { id:"polenta",          label:"Polenta w/ mushrooms",     baseUpcharge:0 },
        { id:"cream-spinach",    label:"Cream & spinach",          baseUpcharge:0 },
        { id:"rice-beans",       label:"Rice & beans",             baseUpcharge:0 },
        { id:"sauteed-veggies",  label:"Sauteed veggies",          baseUpcharge:0 },
        { id:"potato-puree",     label:"Potato puree",             baseUpcharge:0 },
        { id:"cole-slaw",        label:"Cole slaw",                baseUpcharge:0 },
        { id:"petite-salad",     label:"Petite salad",             baseUpcharge:0 },
        { id:"confit-potatoes",  label:"Confit potatoes",          baseUpcharge:0 }, 
      ]
    }
  }
};

/* ====== Estado + storage ====== */
const cart = [];
const STORAGE_KEY = "pc-cart-v1";
const STORAGE_TIP = "pc-tip-v1";

function saveCart(){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    localStorage.setItem(STORAGE_TIP, String(tipRate));
  } catch(_) {}
}
function loadCart(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const savedTip = localStorage.getItem(STORAGE_TIP);
    if (raw){
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) cart.splice(0, cart.length, ...parsed);
    }
    if (savedTip) tipRate = parseFloat(savedTip) || 0;
  } catch(_) {}
}

function money(n){ return `$${n.toFixed(2)}`; }

/* ====== Precios por opciones ====== */
function computeOptionsPrice(selectedIds, groupKey){
  const group = CATALOG.optionGroups[groupKey];
  if(!group || !selectedIds?.length) return 0;
  let price = 0;
  selectedIds.forEach(id=>{
    const opt = group.items.find(i=>i.id===id);
    if (opt?.baseUpcharge) price += opt.baseUpcharge;
  });
  return price;
}

/* ====== Modal de opciones ====== */
function openOptionsModal({ title, groupKey, includedCount, onConfirm }){
  const modal = document.getElementById("options-modal");
  if (!modal) return;
  const group = CATALOG.optionGroups[groupKey];
  if (!group) return;

  const titleNode = document.getElementById("opt-title");
  const listNode = document.getElementById("opt-list");
  const counterNode = document.getElementById("opt-counter");
  const btnConfirm = document.getElementById("opt-confirm");
  const btnCancel = document.getElementById("opt-cancel");

  titleNode.textContent = `${title} — ${group.title}`;
  listNode.innerHTML = "";
  const selected = new Set();

  function updateCounter(){
    const need = Math.max(0, includedCount - selected.size);
    counterNode.textContent = need > 0
      ? `Choose ${need} more (included: ${includedCount})`
      : `You're. Confirm ${group.allowExtras ? " or add some extras" : ""}.`;
    btnConfirm.disabled = selected.size < Math.min(includedCount, group.max);
  }

  group.items.forEach(opt=>{
    const wrap = document.createElement("label"); wrap.className = "opt-item";
    const cb = document.createElement("input"); cb.type = "checkbox"; cb.value = opt.id;
    cb.addEventListener("change", ()=>{
      if (cb.checked){
        if (!group.allowExtras && selected.size >= includedCount){ cb.checked = false; return; }
        if (selected.size >= group.max){ cb.checked = false; return; }
        selected.add(opt.id);
      } else {
        selected.delete(opt.id);
      }
      updateCounter();
    });
    const lbl = document.createElement("span");
    lbl.textContent = opt.label + (opt.baseUpcharge>0 ? ` (+$${opt.baseUpcharge.toFixed(2)})` : "");
    wrap.appendChild(cb); wrap.appendChild(lbl);
    listNode.appendChild(wrap);
  });

  updateCounter();

  function close(){
    modal.setAttribute("hidden","");
    btnConfirm.onclick = null; btnCancel.onclick = null;
    modal.querySelector(".modal-backdrop").onclick = null;
  }
  btnCancel.onclick = close;
  modal.querySelector(".modal-backdrop").onclick = close;
  btnConfirm.onclick = ()=>{
    const ids = Array.from(selected);
    const labels = ids.map(id=> group.items.find(i=>i.id===id)?.label || id);
    onConfirm(ids, labels);
    close();
  };

  modal.removeAttribute("hidden");
}

/* ====== Totales ====== */
function calcSubtotal(){ 
  // total de líneas sin impuesto (base + upcharge) * qty
  return cart.reduce((s,i)=> s + (i.total * (i.qty || 1)), 0); 
}
function calcTax(){
  // impuesto por item según su taxRate
  return cart.reduce((s,i)=> s + ((i.total * (i.qty || 1)) * (i.taxRate ?? 0.07)), 0);
}
function renderTotals(){
  const sub = calcSubtotal();
  const tax = calcTax();
  const total = sub + tax;
  const tip = total * tipRate;
  const grand = total + tip;

  const set = (id,val)=>{ const el = document.getElementById(id); if (el) el.textContent = val; };
  set("t-tax",   money(tax));
  set("t-total", money(total));
  set("t-grand", money(grand));
}

/* ====== Render carrito ====== */
function renderCart(){
  const list = document.getElementById("cart-items");
  const countNode = document.getElementById("cart-count");
  if (!list || !countNode) return;

  list.innerHTML = "";
  let count = 0;

  cart.forEach((item, idx)=>{
    const qty = item.qty || 1;
    count += qty;

    const li = document.createElement("li");
    li.className = "cart-line";
    li.dataset.index = String(idx);

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.gap = "8px";

    const title = document.createElement("span");
    const optText = item.options?.sides?.length ? ` · Sides: ${item.options.sidesLabels.join(", ")}` : "";
    title.textContent = `${qty}× ${item.name} — ${money(item.total)}${optText}`;

    const del = document.createElement("button");
    del.className = "trash-btn"; del.type = "button"; del.setAttribute("aria-label","Eliminar");
    del.innerHTML = "🗑️";

    row.appendChild(title);
    row.appendChild(del);
    li.appendChild(row);
    list.appendChild(li);
  });

  countNode.textContent = count;
  renderTotals();
}

/* ====== Mutadores ====== */
function addToCart(entry){
  // defaults seguros
  if (!entry.qty) entry.qty = 1;
  if (typeof entry.taxRate !== "number") entry.taxRate = 0.07; // default comida
  cart.push(entry); 
  saveCart(); 
  renderCart();
}
function removeFromCart(index){
  if (index < 0 || index >= cart.length) return;
  cart.splice(index, 1); saveCart(); renderCart();
}

/* ====== Panel (pointer-events fix) ====== */
function panel(){ return document.getElementById("cart-panel"); }
function isCartOpen(){ return panel()?.classList.contains("open"); }

function openCart(){
  const p = panel(); if (!p) return;
  p.classList.add("open");
  p.style.transform  = "translateX(0)";
  p.style.transition = "transform .25s ease";
  p.style.pointerEvents = "auto";
  const closeBtn = document.getElementById("cart-close");
  if (closeBtn) closeBtn.focus({ preventScroll:true });
}

function closeCart(){
  const p = panel(); if (!p) return;
  const active = document.activeElement;
  if (p.contains(active)) {
    const trig = document.getElementById("cart-trigger");
    if (trig) trig.focus({ preventScroll:true });
  }
  p.classList.remove("open");
  p.style.transform  = "translateX(100%)";
  p.style.transition = "transform .25s ease";
  p.style.pointerEvents = "none";
}

function toggleCart(){ isCartOpen() ? closeCart() : openCart(); }

// asegurar que el botón abre/cierra
document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.getElementById("cart-trigger");
  if (trigger) {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      toggleCart();
    });
  }
});

/* ====== Delegación global ====== */
document.addEventListener("click", (e)=>{
  // abrir/cerrar con el MISMO botón
  if (e.target.closest("#cart-trigger")) { toggleCart(); return; }
  if (e.target.closest("#cart-close"))   { closeCart(); return; }

  // borrar línea (🗑️ dentro del carrito)
  const trash = e.target.closest(".trash-btn");
  if (trash){
    const li = trash.closest(".cart-line");
    const idx = li ? parseInt(li.dataset.index || "-1", 10) : -1;
    removeFromCart(idx); return;
  }

  // cambiar propina
  const tipBtn = e.target.closest(".tip-btn");
  if (tipBtn){
    document.querySelectorAll(".tip-btn").forEach(b=>b.classList.remove("active"));
    tipBtn.classList.add("active");
    tipRate = parseFloat(tipBtn.dataset.tip || "0");
    renderTotals(); saveCart();
    return;
  }

  // —— Botones estándar “+ Añadir” (y los de vinos/copa-botella si los usas)
  const btn = e.target.closest(".add-to-cart");
  if (!btn) return;

  const name     = btn.dataset.name;
  const price    = parseFloat(btn.dataset.price);
  const taxRate  = parseFloat(btn.dataset.tax || "0.07"); // ← aquí viene 0.07 comida o 0.11 alcohol
  const groupKey = btn.dataset.optionGroup;
  const included = parseInt(btn.dataset.sidesIncluded || "0", 10);

  if (groupKey && included > 0){
    openOptionsModal({
      title: name, groupKey, includedCount: included,
      onConfirm: (selectedIds, labels)=>{
        const upcharge = computeOptionsPrice(selectedIds, groupKey);
        addToCart({ 
          id: btn.dataset.id, 
          name, 
          qty: 1, 
          basePrice: price, 
          upcharge,
          options:{ sides:selectedIds, sidesLabels:labels }, 
          total: price + upcharge,
          taxRate
        });
        // YA NO abrimos el carrito automáticamente aquí
      }
    });
  } else {
    addToCart({ 
      id: btn.dataset.id, 
      name, 
      qty: 1, 
      basePrice: price, 
      upcharge: 0, 
      options:{}, 
      total: price,
      taxRate
    });
    // YA NO abrimos el carrito automáticamente aquí
  }
});

/* ====== Init ====== */
document.addEventListener("DOMContentLoaded", ()=>{
  loadCart();
  renderCart();
  // cerrar con ESC
  document.addEventListener("keydown", (e)=>{ if (e.key === "Escape") closeCart(); });
});
