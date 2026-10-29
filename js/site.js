/* mindsoap.net — shared header/footer loader (no jQuery) */
(function () {
  "use strict";

  function load(id, url, done) {
    var el = document.getElementById(id);
    if (!el) return;
    fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        el.innerHTML = html;
        if (done) done(el);
      })
      .catch(function () { /* 로컬 file:// 등에서는 조용히 무시 */ });
  }

  // 모바일 햄버거 메뉴 (Bootstrap 3 collapse 대체)
  function initNav(el) {
    var btn = el.querySelector(".navbar-toggle");
    var menu = el.querySelector(".navbar-collapse");
    if (!btn || !menu) return;
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", function () {
      var open = menu.classList.toggle("in");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // 하단 연도 내비게이션: 현재 연도 강조
  function markYear(el) {
    var path = location.pathname || "";
    var year = "2026";
    if (/index2025|\/2025\//.test(path)) year = "2025";
    else if (/index2024|\/2024\//.test(path)) year = "2024";
    var links = el.querySelectorAll(".year-nav a[data-year]");
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute("data-year") === year) {
        links[i].classList.add("is-active");
        links[i].setAttribute("aria-current", "page");
      }
    }
  }

  load("headers", "/header.html", initNav);
  load("footers", "/footer.html", markYear);
})();
