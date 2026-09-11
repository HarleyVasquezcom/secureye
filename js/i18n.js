/* SECUREYE CCTV — i18n.js
   6 languages: EN EN · ES · DE · PT · FR · IT
   Usage: elements carry data-i18n="key", placeholders carry data-i18n-ph="key".
   Dictionaries live in ../lang/{en,es,de,pt,fr,it}.json */
(function(){
  "use strict";
  var LANGS = ["en","es","de","pt","fr","it"];
  var LABELS = {en:"EN",es:"ES",de:"DE",pt:"PT",fr:"FR",it:"IT"};
  var cache = {};
  function current(){ try{ return localStorage.getItem("seclang") || "es"; }catch(e){ return "es"; } }
  function set(l){ try{ localStorage.setItem("seclang", l); }catch(e){} }
  function getJSON(l){
    if(cache[l]) return Promise.resolve(cache[l]);
    return fetch("lang/"+l+".json").then(function(r){
      if(!r.ok) throw 0; return r.json();
    }).then(function(j){ cache[l]=j; return j; }).catch(function(){ return cache.en||{}; });
  }
  function get(obj, path){ return path.split(".").reduce(function(a,k){ return (a&&a[k]!==undefined)?a[k]:undefined; }, obj); }
  function apply(dict){
    document.querySelectorAll("[data-i18n]").forEach(function(el){
      var v = get(dict, el.getAttribute("data-i18n"));
      if(typeof v==="string") el.innerHTML = v;
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function(el){
      var v = get(dict, el.getAttribute("data-i18n-ph"));
      if(typeof v==="string") el.setAttribute("placeholder", v);
    });
    document.documentElement.lang = current();
    document.querySelectorAll("[data-lang-btn]").forEach(function(b){
      b.classList.toggle("active", b.getAttribute("data-lang-btn")===current());
    });
    var cur = document.getElementById("curLang");
    if(cur) cur.textContent = LABELS[current()]||"EN";
  }
  function load(l){
    if(LANGS.indexOf(l)<0) l="en";
    set(l);
    Promise.all([getJSON("en"), getJSON(l)]).then(function(res){
      var merged = Object.assign({}, res[0], res[1]);
      // deep merge one level (sections)
      Object.keys(res[1]||{}).forEach(function(k){
        if(typeof res[1][k]==="object" && typeof res[0][k]==="object")
          merged[k] = Object.assign({}, res[0][k], res[1][k]);
      });
      apply(merged);
    });
  }
  document.addEventListener("click", function(e){
    var b = e.target.closest("[data-lang-btn]");
    if(b) load(b.getAttribute("data-lang-btn"));
  });
  document.addEventListener("DOMContentLoaded", function(){ load(current()); });
})();
