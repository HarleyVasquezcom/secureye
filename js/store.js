/* SECUREYE — Store (tienda) — cart, filters, WhatsApp checkout
   Depends on store-data.js (window.SECUREYE_CATALOG). Persistent cart in localStorage. */
(function(){
  "use strict";
  const LS = "secureye_cart_v1";
  const WA = "573182020729"; // +57 (318) 202-0729
  const fmt = (n) => n==null ? "Cotización" : "$" + n.toLocaleString("es-CO") + " COP";
  const range = (p) => p.priceMax ? `Desde ${fmt(p.price)} · hasta ${fmt(p.priceMax)}` : fmt(p.price);
  const catalog = window.SECUREYE_CATALOG || [];
  const cats = window.SECUREYE_CATS || [];
  let cart = [];
  try{ cart = JSON.parse(localStorage.getItem(LS)||"[]"); }catch(e){ cart=[]; }
  function save(){ try{ localStorage.setItem(LS, JSON.stringify(cart)); }catch(e){} updateBadge(); }
  function get(id){ return catalog.find(function(p){ return p.id===id; }); }
  function add(id, qty){
    qty = qty||1; var f = cart.find(function(c){ return c.id===id; });
    if(f) f.qty += qty; else cart.push({id:id, qty:qty});
    save(); renderCart(); toast(get(id).name + " añadido");
    if(qty===1 && window.innerWidth<992){ openCart(); }
  }
  function remove(id){ cart = cart.filter(function(c){ return c.id!==id; }); save(); renderCart(); }
  function changeQty(id, d){
    var f = cart.find(function(c){ return c.id===id; }); if(!f) return;
    f.qty += d; if(f.qty<=0) remove(id); else { save(); renderCart(); }
  }
  function total(){
    var t=0, n=0; cart.forEach(function(c){ var p=get(c.id); if(p&&p.price) { t += p.price*c.qty; n+=c.qty; } });
    return {price:t, count:n};
  }
  function updateBadge(){
    var c = total().count; document.querySelectorAll("[data-cart-count]").forEach(function(b){
      b.textContent = c; b.classList.toggle("d-none", c===0); b.classList.toggle("d-inline-flex", c>0);
    });
  }
  function toast(msg){
    var t=document.getElementById("toast"); if(!t) return;
    t.querySelector("[data-toast-msg]").textContent = msg;
    t.classList.add("show"); setTimeout(function(){ t.classList.remove("show"); }, 2400);
  }
  function waLink(){
    var lines = ["Hola SECUREYE, quiero cotizar:"];
    cart.forEach(function(c){ var p=get(c.id); lines.push("- "+p.id+" · "+p.name+" ×"+c.qty+" — "+fmt(p.price)+" c/u"); });
    var tt = total(); lines.push(""); lines.push("Total estimado (sin IVA/envío): "+fmt(tt.price));
    lines.push("Precios de referencia en COP — sujetos a inventario y ciudad.");
    return "https://wa.me/"+WA+"?text="+encodeURIComponent(lines.join("\n"));
  }
  // --- grid
  var grid, search, catSel, sortSel, countEl, emptyEl;
  function filtered(){
    var q = (search && search.value || "").trim().toLowerCase();
    var cat = catSel && catSel.value || "all";
    var out = catalog.filter(function(p){
      if(cat!=="all" && p.cat!==cat) return false;
      if(!q) return true;
      return (p.id+" "+p.name+" "+p.spec).toLowerCase().indexOf(q)>=0;
    });
    var sort = sortSel && sortSel.value || "cat";
    if(sort==="price-asc") out.sort(function(a,b){ return (a.price||9e12)-(b.price||9e12); });
    else if(sort==="price-desc") out.sort(function(a,b){ return (b.price||0)-(a.price||0); });
    return out;
  }
  function renderGrid(){
    if(!grid) return; var list = filtered();
    countEl.textContent = list.length + " productos";
    grid.innerHTML = "";
    if(!list.length){ emptyEl.classList.remove("d-none"); return; } emptyEl.classList.add("d-none");
    list.forEach(function(p){
      var col = document.createElement("div"); col.className = "col-sm-6 col-lg-4";
      var badge = p.badge ? '<span class="badge bg-orange text-dark position-absolute top-0 start-0 m-2">'+p.badge+'</span>' : "";
      var priceLine = p.price==null ? '<span class="text-orange fw-bold">Bajo cotización</span>' : '<span class="text-orange fw-bold fs-5">'+fmt(p.price)+'</span> <small class="text-mut">'+ (p.priceMax? "– "+fmt(p.priceMax):"")+'</small>';
      var eta = '<small class="text-mut"><i class="fas fa-truck me-1"></i>'+p.eta+'</small>';
      col.innerHTML = '<div class="card-dark hover-lift h-100 position-relative overflow-hidden">'
        + badge
        + '<div class="img-duo"><picture><source srcset="'+p.imgWebp+'" type="image/webp"><img src="'+p.img+'" alt="'+p.name+'" loading="lazy" style="height:150px;object-fit:cover;width:100%"></picture></div>'
        + '<div class="p-3 d-flex flex-column" style="gap:.35rem">'
        + '<small class="text-orange text-uppercase" style="letter-spacing:.1em">'+p.id+' · '+p.cat+'</small>'
        + '<h3 class="h6 mb-1">'+p.name+'</h3>'
        + '<p class="text-mut small mb-1">'+p.spec+'</p>'
        + '<div>'+priceLine+'</div><div>'+eta+'</div>'
        + '<div class="d-flex gap-2 mt-2"><button class="btn btn-burn btn-sm flex-grow-1" data-add="'+p.id+'"><i class="fas fa-shopping-cart me-1"></i>Añadir</button><a class="btn btn-ghost btn-sm" href="catalogo.html">Ficha</a></div>'
        + '</div></div>';
      grid.appendChild(col);
    });
  }
  // --- cart panel
  var cartBody, cartFoot, cartEmpty;
  function renderCart(){
    if(!cartBody) return; cartBody.innerHTML = "";
    if(!cart.length){ cartEmpty.classList.remove("d-none"); cartFoot.classList.add("d-none"); return; }
    cartEmpty.classList.add("d-none"); cartFoot.classList.remove("d-none");
    cart.forEach(function(c){
      var p=get(c.id); var row=document.createElement("div"); row.className="d-flex gap-2 align-items-center border-bottom py-2";
      row.innerHTML = '<img src="'+p.img+'" width="44" height="44" style="object-fit:cover;border-radius:3px" loading="lazy">'
        + '<div class="flex-grow-1"><div class="small fw-bold">'+p.id+' · '+p.name+'</div><div class="small text-mut">'+fmt(p.price)+' × '+c.qty+'</div></div>'
        + '<div class="btn-group btn-group-sm"><button class="btn btn-ghost" data-dec="'+p.id+'">−</button><span class="btn btn-ghost disabled">'+c.qty+'</span><button class="btn btn-ghost" data-inc="'+p.id+'">+</button></div>'
        + '<button class="btn btn-ghost btn-sm" data-rm="'+p.id+'"><i class="fas fa-trash"></i></button>';
      cartBody.appendChild(row);
    });
    var tt=total();
    document.getElementById("cartTotal").textContent = fmt(tt.price);
    document.getElementById("cartCountFoot").textContent = tt.count + " ítems";
    document.getElementById("waBtn").href = waLink();
  }
  function openCart(){ var c=document.getElementById("cartPanel"); if(c) c.classList.add("open"); document.body.classList.add("cart-open"); }
  function closeCart(){ var c=document.getElementById("cartPanel"); if(c) c.classList.remove("open"); document.body.classList.remove("cart-open"); }
  document.addEventListener("DOMContentLoaded", function(){
    grid = document.getElementById("storeGrid");
    search = document.getElementById("storeSearch");
    catSel = document.getElementById("storeCat");
    sortSel = document.getElementById("storeSort");
    countEl = document.getElementById("storeCount");
    emptyEl = document.getElementById("storeEmpty");
    cartBody = document.getElementById("cartBody");
    cartFoot = document.getElementById("cartFoot");
    cartEmpty = document.getElementById("cartEmpty");
    // fill cat select
    if(catSel){ cats.forEach(function(c){ var o=document.createElement("option"); o.value=c.id; o.textContent=c.label; catSel.appendChild(o); }); }
    document.addEventListener("click", function(e){
      var a=e.target.closest("[data-add]"); if(a){ add(a.getAttribute("data-add")); return; }
      var d=e.target.closest("[data-dec]"); if(d){ changeQty(d.getAttribute("data-dec"), -1); return; }
      var i=e.target.closest("[data-inc]"); if(i){ changeQty(i.getAttribute("data-inc"), 1); return; }
      var r=e.target.closest("[data-rm]"); if(r){ remove(r.getAttribute("data-rm")); return; }
      if(e.target.closest("[data-open-cart]")){ e.preventDefault(); openCart(); }
      if(e.target.closest("[data-close-cart]")||e.target.id==="cartBackdrop"){ closeCart(); }
      if(e.target.closest("#clearCart")){ cart=[]; save(); renderCart(); }
    });
    if(search) search.addEventListener("input", renderGrid);
    if(catSel) catSel.addEventListener("change", renderGrid);
    if(sortSel) sortSel.addEventListener("change", renderGrid);
    renderGrid(); renderCart(); updateBadge();
  });
  window.SECUREYE_STORE = {add:add, cart:function(){ return cart; }};
})();
