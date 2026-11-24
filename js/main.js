/* rayt0o · Portafolio — comportamiento mínimo, sin dependencias */
(function () {
  "use strict";

  // Silueta provisional para personajes: los ojos son lo único que brilla.
  var GHOST =
    '<svg class="slot__ghost" viewBox="0 0 400 600" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' +
    '<defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1a2a"/><stop offset="1" stop-color="#07070B" stop-opacity="0"/></linearGradient>' +
    '<filter id="gb" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="5"/></filter></defs>' +
    '<path d="M200 70c-60 0-100 50-100 118 0 52 24 96 58 116v34c-80 12-148 52-158 130V600h400V468c-10-78-78-118-158-130v-34c34-20 58-64 58-116 0-68-40-118-100-118z" fill="url(#gg)" stroke="#262640" stroke-dasharray="4 6"/>' +
    '<g fill="#6FD3FF"><ellipse cx="165" cy="190" rx="13" ry="7" filter="url(#gb)"/><ellipse cx="235" cy="190" rx="13" ry="7" filter="url(#gb)"/>' +
    '<ellipse cx="165" cy="190" rx="7" ry="3.5" fill="#fff"/><ellipse cx="235" cy="190" rx="7" ry="3.5" fill="#fff"/></g></svg>';

  function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // 1. Huecos de imagen: ficha de exportación + carga automática si el archivo ya existe
  var slots = document.querySelectorAll(".slot[data-src]");
  slots.forEach(function (el) {
    var d = el.dataset;
    if (el.classList.contains("slot--figure")) el.insertAdjacentHTML("afterbegin", GHOST);
    if (!el.classList.contains("slot--quiet")) {
      el.insertAdjacentHTML("beforeend",
        '<figcaption class="slot__info"><b>' + esc(d.src.replace(/^img\//, "")) + "</b>" +
        (d.spec ? esc(d.spec) + "<br>" : "") +
        (d.from ? "<i>De: " + esc(d.from) + "</i>" : "<i>Falta exportar</i>") + "</figcaption>");
    }
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", d.alt || "");
  });

  function load(el) {
    var img = new Image();
    img.decoding = "async";
    img.alt = el.dataset.alt || "";
    img.onload = function () {
      el.insertBefore(img, el.firstChild);
      el.classList.add("is-loaded");
      el.removeAttribute("role"); el.removeAttribute("aria-label");
    };
    img.src = el.dataset.src;
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { load(e.target); io.unobserve(e.target); } });
    }, { rootMargin: "600px 0px" });
    slots.forEach(function (el) { io.observe(el); });
  } else {
    slots.forEach(load);
  }

  // 2. Letra como máscara: si la imagen existe, se mete dentro de la letra
  document.querySelectorAll(".letter-mask[data-src]").forEach(function (el) {
    var img = new Image();
    img.onload = function () { el.style.setProperty("--mask-img", "url('" + el.dataset.src + "')"); };
    img.src = el.dataset.src;
  });

  // 3. Cinta: se duplica el contenido para que corra sin cortes
  document.querySelectorAll(".tape__track").forEach(function (t) {
    t.innerHTML += t.innerHTML;
  });

  // 4. Carta AR: gira al tocarla
  document.querySelectorAll(".card-flip").forEach(function (c) {
    function flip() { c.classList.toggle("is-flipped"); }
    c.addEventListener("click", flip);
    c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
  });
})();

// Tarot de Satanæ: la carta más cercana al cursor se levanta; al tocarla se voltea y pasa al centro
(function () {
  document.querySelectorAll('[data-tarot]').forEach(function (deck) {
    var cards = Array.prototype.slice.call(deck.querySelectorAll('.tcard'));
    deck.addEventListener('pointermove', function (e) {
      if (deck.classList.contains('has-pick')) return;
      var best = null, bd = 1e9;
      cards.forEach(function (c) { var r = c.getBoundingClientRect(); var d = Math.abs(r.left + r.width / 2 - e.clientX); if (d < bd) { bd = d; best = c; } });
      cards.forEach(function (c) { c.classList.toggle('is-near', c === best); });
    });
    deck.addEventListener('pointerleave', function () { cards.forEach(function (c) { c.classList.remove('is-near'); }); });
    cards.forEach(function (c) {
      c.setAttribute('aria-pressed', 'false');
      c.addEventListener('click', function () {
        var was = c.classList.contains('is-picked');
        cards.forEach(function (o) { o.classList.remove('is-picked', 'is-near'); o.setAttribute('aria-pressed', 'false'); });
        if (!was) { c.classList.add('is-picked'); c.setAttribute('aria-pressed', 'true'); }
        deck.classList.toggle('has-pick', !was);
      });
    });
  });
})();
