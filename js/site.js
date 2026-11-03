/* mindsoap.net — shared header/footer loader & site search */
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

  // 헤더 검색 기능 (초경량 실시간 필터링)
  function initSearch(el) {
    var input = el.querySelector("#siteSearchInput");
    var clearBtn = el.querySelector("#siteSearchClear");
    var dropdown = el.querySelector("#navSearchResults");
    if (!input || !dropdown) return;

    var postsData = window.MINDSOAP_POSTS || null;
    var isLoading = false;
    var selectedIndex = -1;

    function loadData(callback) {
      if (postsData) {
        if (callback) callback(postsData);
        return;
      }
      if (isLoading) return;
      isLoading = true;
      var s = document.createElement("script");
      s.src = "/js/posts-data.js";
      s.onload = function () {
        postsData = window.MINDSOAP_POSTS || [];
        isLoading = false;
        if (callback) callback(postsData);
      };
      s.onerror = function () {
        isLoading = false;
        if (callback) callback([]);
      };
      document.head.appendChild(s);
    }

    // 인풋 포커스 시 미리 데이터 로드
    input.addEventListener("focus", function () {
      loadData(function () {});
      if (input.value.trim().length > 0) {
        render();
      }
    });

    function escapeHtml(str) {
      return (str || "").replace(/[&<>"']/g, function (m) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
      });
    }

    function escapeRegExp(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function highlight(text, tokens) {
      if (!text) return "";
      var escaped = escapeHtml(text);
      if (!tokens || !tokens.length) return escaped;
      var pattern = tokens.map(escapeRegExp).join("|");
      try {
        var re = new RegExp("(" + pattern + ")", "gi");
        return escaped.replace(re, '<mark class="nav-search-highlight">$1</mark>');
      } catch (e) {
        return escaped;
      }
    }

    function render() {
      var q = input.value.trim();
      if (!q) {
        dropdown.style.display = "none";
        dropdown.innerHTML = "";
        clearBtn.style.display = "none";
        selectedIndex = -1;
        return;
      }

      clearBtn.style.display = "block";

      loadData(function (posts) {
        var tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
        var results = [];

        for (var i = 0; i < posts.length; i++) {
          var p = posts[i];
          var corpus = [
            p.title || "",
            p.date || "",
            p.category || "",
            p.desc || "",
            p.body || ""
          ].join(" ").toLowerCase();

          var match = true;
          for (var t = 0; t < tokens.length; t++) {
            if (corpus.indexOf(tokens[t]) === -1) {
              match = false;
              break;
            }
          }

          if (match) {
            results.push(p);
          }
        }

        selectedIndex = -1;

        if (results.length === 0) {
          dropdown.innerHTML = '<div class="nav-search-empty">No results found for "<b>' + escapeHtml(q) + '</b>"</div>';
          dropdown.style.display = "block";
          return;
        }

        var html = "";
        var maxShow = 15;
        for (var j = 0; j < Math.min(results.length, maxShow); j++) {
          var item = results[j];
          html += '<a href="' + item.url + '" class="nav-search-item" data-index="' + j + '">';
          html += '  <div class="nav-search-item-header">';
          html += '    <span class="nav-search-item-title">' + highlight(item.title, tokens) + '</span>';
          if (item.category) {
            html += '    <span class="nav-search-item-cat">' + escapeHtml(item.category) + '</span>';
          }
          html += '  </div>';
          html += '  <div class="nav-search-item-date">' + escapeHtml(item.date) + '</div>';
          if (item.desc) {
            html += '  <div class="nav-search-item-desc">' + highlight(item.desc, tokens) + '</div>';
          }
          html += '</a>';
        }

        dropdown.innerHTML = html;
        dropdown.style.display = "block";
      });
    }

    input.addEventListener("input", render);

    // 키보드 방향키 및 Enter / Escape 지원
    input.addEventListener("keydown", function (e) {
      var items = dropdown.querySelectorAll(".nav-search-item");
      if (!items || items.length === 0 || dropdown.style.display === "none") {
        if (e.key === "Escape") {
          dropdown.style.display = "none";
          input.blur();
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelection(items);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        updateSelection(items);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          items[selectedIndex].click();
        } else if (items[0]) {
          items[0].click();
        }
      } else if (e.key === "Escape") {
        dropdown.style.display = "none";
        input.blur();
      }
    });

    function updateSelection(items) {
      for (var i = 0; i < items.length; i++) {
        if (i === selectedIndex) {
          items[i].classList.add("is-selected");
          items[i].scrollIntoView({ block: "nearest" });
        } else {
          items[i].classList.remove("is-selected");
        }
      }
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        input.value = "";
        clearBtn.style.display = "none";
        dropdown.style.display = "none";
        dropdown.innerHTML = "";
        selectedIndex = -1;
        input.focus();
      });
    }

    // 바깥 클릭 시 드롭다운 닫기
    document.addEventListener("click", function (e) {
      if (!el.contains(e.target)) {
        dropdown.style.display = "none";
      }
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

  load("headers", "/header.html", function (el) {
    initNav(el);
    initSearch(el);
  });
  load("footers", "/footer.html", markYear);
})();
