// autobuttons.js (marca alcohol y selector Copa/Botella para wines)
// (function(){
//   const SIDES_MAP = new Map([
//     ["whole chicken fried", 4],
//     ["whole chicken roasted", 4],
//     ["half chicken fried", 2],
//     ["half chicken roasted", 2],
//   ]);

//   function slug(s){ return s.toLowerCase().trim().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,''); }

//   function extractPrices(txt){
//     if (!txt) return [];
//     const nums = txt.replace(',', '.').match(/(\d+(\.\d+)?)/g);
//     return (nums || []).map(n=>parseFloat(n));
//   }

//   function cleanNameFromRow(row){
//     const clone = row.cloneNode(true);
//     clone.querySelectorAll('.price,.price-w').forEach(n=>n.remove());
//     return clone.textContent.replace(/\s{2,}/g,' ').trim();
//   }

//   // ¿Esta página es de alcohol? (COCKTAIL LIST, BEER LIST, WINES)
//   const isAlcoholPage = Array.from(document.querySelectorAll('h2.category'))
//     .some(h => /cocktail|beer|wine/i.test(h.textContent || ''));

//   function makeButton({ text, id, name, price, sidesIncluded=0, optionGroup=null, isAlcohol=false }){
//     const btn = document.createElement('button');
//     btn.className = 'add-to-cart';
//     btn.type = 'button';
//     btn.textContent = text;
//     btn.dataset.id = id;
//     btn.dataset.name = name;
//     btn.dataset.price = String(price.toFixed(2));
//     if (sidesIncluded > 0){
//       btn.dataset.sidesIncluded = String(sidesIncluded);
//       btn.dataset.optionGroup = optionGroup || 'sides';
//     }
//     if (isAlcohol) btn.dataset.alcohol = "true";   // <- clave para cart.js
//     return btn;
//   }

//   document.querySelectorAll('.menu-item, .menu-item-w').forEach((row)=>{
//     if (row.querySelector('.add-to-cart')) return;

//     const priceNode = row.querySelector('.price, .price-w');
//     if (!priceNode) return;

//     const prices = extractPrices(priceNode.textContent);
//     if (prices.length === 0) return;

//     const baseName = cleanNameFromRow(row);
//     const baseId = slug(baseName);
//     const sidesIncluded = SIDES_MAP.get(baseName.toLowerCase()) || 0;

//     const isWineRow = priceNode.classList.contains('price-w') && prices.length >= 2;
//     const isAlcoholRow = isAlcoholPage || isWineRow; // wines/cocktails/beers

//     if (isWineRow){
//       // Selector Copa/Botella + 1 botón
//       const sel = document.createElement('select');
//       sel.className = 'variant-select';
//       const optGlass = document.createElement('option');
//       optGlass.value = 'glass';
//       optGlass.dataset.price = String(prices[0]);
//       optGlass.textContent = `Copa — $${prices[0].toFixed(2)}`;
//       const optBottle = document.createElement('option');
//       optBottle.value = 'bottle';
//       optBottle.dataset.price = String(prices[1]);
//       optBottle.textContent = `Botella — $${prices[1].toFixed(2)}`;
//       sel.appendChild(optGlass);
//       sel.appendChild(optBottle);

//       const btn = makeButton({
//         text: '+ Añadir',
//         id: `${baseId}-glass`,
//         name: `${baseName} (copa)`,
//         price: prices[0],
//         sidesIncluded,
//         isAlcohol: true
//       });

//       function syncFromSelect(){
//         const v = sel.value;
//         const p = parseFloat(sel.selectedOptions[0].dataset.price || "0");
//         btn.dataset.price = String(p.toFixed(2));
//         btn.dataset.name  = `${baseName} (${v === 'glass' ? 'copa' : 'botella'})`;
//         btn.dataset.id    = `${baseId}-${v}`;
//       }
//       sel.addEventListener('change', syncFromSelect);
//       syncFromSelect();

//       const uiWrap = document.createElement('div');
//       uiWrap.style.display = 'flex';
//       uiWrap.style.gap = '8px';
//       uiWrap.style.alignItems = 'center';
//       uiWrap.appendChild(sel);
//       uiWrap.appendChild(btn);
//       row.appendChild(uiWrap);
//     } else {
//       // Botón normal
//       const btn = makeButton({
//         text: '+ Añadir',
//         id: baseId,
//         name: baseName,
//         price: prices[0],
//         sidesIncluded,
//         isAlcohol: isAlcoholRow
//       });
//       row.appendChild(btn);
//     }
//   });
// })();


// autobuttons.js
(function(){
    function slug(s){ return s.toLowerCase().trim().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,''); }
    function parsePrice(node){
      if(!node) return null;
      const txt = node.textContent || "";
      const m = txt.replace(',', '.').match(/(\d+(\.\d+)?)/g);
      // si hay "12.00/60.00" (wines) tomamos el primero por defecto
      return m ? parseFloat(m[0]) : null;
    }
    function cleanName(fullText){
      return fullText.replace(/\$?\s*\d+([.,]\d+)?(\/\d+([.,]\d+)?)?/g,'').trim().replace(/\s{2,}/g,' ');
    }
  
    // decide tax por página
    const path = (location.pathname || "").toLowerCase();
    const isAlcoholPage = path.includes("cocktails") || path.includes("beers") || path.includes("wines");
    const defaultTax = isAlcoholPage ? 0.11 : 0.07;
  
    // sides incluidos (por nombre)
    const SIDES_MAP = new Map([
      ["whole chicken fried", 4],
      ["whole chicken roasted", 4],
      ["half chicken fried", 2],
      ["half chicken roasted", 2],
    ]);
  
    // Recorre todos los .menu-item / .menu-item-w y les añade botón si falta
    document.querySelectorAll('.menu-item, .menu-item-w').forEach((row)=>{
      if (row.querySelector('.add-to-cart')) return;
  
      const priceNode = row.querySelector('.price, .price-w');
      const price = parsePrice(priceNode);
      if (price == null) return;
  
      const fullText = row.cloneNode(true);
      fullText.querySelectorAll('.price,.price-w').forEach(n=>n.remove());
      const name = cleanName(fullText.textContent);
  
      const sidesIncluded = SIDES_MAP.get(name.toLowerCase()) || 0;
  
      const btn = document.createElement('button');
      btn.className = 'add-to-cart';
      btn.textContent = 'Add';
      btn.dataset.id = slug(name);
      btn.dataset.name = name;
      btn.dataset.price = String(price.toFixed(2));
      btn.dataset.tax = String(defaultTax); // <<— aquí ponemos 0.07 comida / 0.11 alcohol
  
      if (sidesIncluded > 0){
        btn.dataset.sidesIncluded = String(sidesIncluded);
        btn.dataset.optionGroup = 'sides';
      }
  
      row.appendChild(btn);
    });
  
    // si cart.js expone enganche manual (no es necesario en tu versión)
    if (typeof setupAddButtons === 'function') {
      setupAddButtons();
    }
  })();
  