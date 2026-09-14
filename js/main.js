/* SECUREYE CCTV — main.js
   Handles: navbar, back-to-top, reveal-on-scroll, counters, forms, year, carousel timing */
(function(){
  "use strict";
  // Year
  document.querySelectorAll("[data-year]").forEach(function(el){ el.textContent = new Date().getFullYear(); });

  // Navbar shrink
  var nav = document.getElementById("mainNav");
  function onScrollNav(){ if(!nav) return; nav.classList.toggle("shadow", window.scrollY > 10); }
  window.addEventListener("scroll", onScrollNav, {passive:true}); onScrollNav();

  // Back to top
  var toTop = document.getElementById("toTop");
  window.addEventListener("scroll", function(){
    if(!toTop) return;
    toTop.classList.toggle("show", window.scrollY > 600);
  }, {passive:true});
  if(toTop) toTop.addEventListener("click", function(){ window.scrollTo({top:0, behavior:"smooth"}); });

  // Reveal on scroll (stylish animation)
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("on"); io.unobserve(e.target); } });
  }, {threshold:.12});
  document.querySelectorAll(".reveal").forEach(function(el){ io.observe(el); });

  // Animated counters
  var cio = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      var el = e.target, end = parseInt(el.getAttribute("data-count")||"0",10), t0 = null;
      function step(t){ if(!t0) t0=t; var p=Math.min((t-t0)/1400,1);
        el.innerHTML = Math.floor(end*(1-Math.pow(1-p,3))).toLocaleString() + (el.getAttribute("data-suffix")||"");
        if(p<1) requestAnimationFrame(step); }
      requestAnimationFrame(step); cio.unobserve(el);
    });
  }, {threshold:.4});
  document.querySelectorAll("[data-count]").forEach(function(el){ cio.observe(el); });

  // Real form handling: contact + newsletter → harleyvasquez@icloud.com via FormSubmit AJAX
  // Fallback: comment forms stay demo-only
  document.querySelectorAll("form[data-demo-form]").forEach(function(f){
    f.addEventListener("submit", function(ev){
      var isReal = f.hasAttribute("data-form") && f.getAttribute("action") && f.getAttribute("action").indexOf("formsubmit.co")>=0;
      if(!isReal){
        ev.preventDefault();
        var ok0 = f.querySelector("[data-form-ok]");
        if(ok0){ ok0.classList.remove("d-none"); setTimeout(function(){ ok0.classList.add("d-none"); }, 5000); }
        f.reset(); return;
      }
      ev.preventDefault();
      var btn = f.querySelector('button[type="submit"]') || f.querySelector("button");
      var orig = btn ? btn.innerHTML : "";
      if(btn){ btn.disabled=true; btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Enviando…'; }
      var ok = f.querySelector("[data-form-ok]");
      var fd = new FormData(f);
      // ensure FormSubmit AJAX header
      fetch(f.action, {method:"POST", body:fd, headers:{"Accept":"application/json"}}).then(function(r){
        if(!r.ok) throw new Error("HTTP "+r.status);
        return r.json().catch(function(){ return {}; });
      }).then(function(){
        if(ok){ ok.textContent = ok.getAttribute("data-i18n")==="contact.ok" ? "Su mensaje se envió con exito, nos pondremos en contacto con usted pronto." : "Ha quedado inscrito a nuestra Newsletter"; ok.classList.remove("d-none"); ok.scrollIntoView({behavior:"smooth",block:"center"}); setTimeout(function(){ ok.classList.add("d-none"); }, 8000); }
        f.reset();
      }).catch(function(err){
        // Fallback: open mailto if AJAX fails (e.g. CORS offline)
        var mail = "mailto:harleyvasquez@icloud.com?subject="+encodeURIComponent(fd.get("_subject")||"SECUREYE web")+"&body="+encodeURIComponent("Nombre: "+(fd.get("name")||"")+"%0AEmail: "+(fd.get("email")||"")+"%0AMensaje: "+(fd.get("message")||fd.get("email")||""));
        if(ok){ ok.textContent = "Sin conexión — abre tu correo: "+mail; ok.classList.remove("d-none"); }
      }).finally(function(){ if(btn){ btn.disabled=false; btn.innerHTML=orig; } });
    });
  });

  // Active nav link by filename
  try{
    var page = (location.pathname.split("/").pop()||"index.html").toLowerCase();
    document.querySelectorAll('#mainNav .nav-link[data-page]').forEach(function(a){
      if(a.getAttribute("data-page")===page) a.classList.add("active");
      if(page===""&&a.getAttribute("data-page")==="index.html") a.classList.add("active");
    });
  }catch(e){}
})();
