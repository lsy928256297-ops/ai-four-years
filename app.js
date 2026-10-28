/* ========================================================================
   AI 这四年 · 口播稿  —— 页面交互
   数据来自 data.js（window.SCRIPT_DATA）
   ======================================================================== */
(function () {
  "use strict";

  var D = window.SCRIPT_DATA || {};
  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 文本渲染 ---------- */
  function fillHeader() {
    $("ver").textContent = D.version || "";
    $("verFoot").textContent = "活码 " + (D.version || "");
    $("updated").textContent = D.updatedAt || "";
    $("kicker").textContent = D.kicker || "";
    $("title").textContent = D.title || "";
    $("subtitle").textContent = D.subtitle || "";
    $("footerNote").textContent = D.footerNote || "";
    document.title = (D.title || "口播稿") + " · 口播稿";

    var stats = $("stats");
    (D.stats || []).forEach(function (s) {
      var el = document.createElement("div");
      el.className = "stat";
      el.innerHTML = "<b></b><span></span>";
      el.querySelector("b").textContent = s.value;
      el.querySelector("span").textContent = s.label;
      stats.appendChild(el);
    });

    var threads = $("threads");
    (D.threads || []).forEach(function (t) {
      var el = document.createElement("div");
      el.className = "thread";
      el.innerHTML = '<span class="lab"></span><span class="txt"></span>';
      el.querySelector(".lab").textContent = t.label;
      el.querySelector(".txt").textContent = t.text;
      threads.appendChild(el);
    });
  }

  function buildTimeline() {
    var wrap = $("timeline");
    var frag = document.createDocumentFragment();

    (D.segments || []).forEach(function (seg, i) {
      var art = document.createElement("article");
      art.className = "seg reveal";
      art.style.transitionDelay = reduceMotion ? "0ms" : Math.min(i * 45, 260) + "ms";

      var rail = document.createElement("div");
      rail.className = "rail";
      rail.innerHTML = '<i class="node" aria-hidden="true"></i><span class="idx"></span>';
      rail.querySelector(".idx").textContent = seg.no;

      var card = document.createElement("div");
      card.className = "card";

      var top = document.createElement("div");
      top.className = "card-top";
      top.innerHTML = '<span class="year"></span><span class="dur">约 10 秒</span>';
      top.querySelector(".year").textContent = seg.year || "";

      var h2 = document.createElement("h2");
      h2.textContent = seg.node || "";

      var p = document.createElement("p");
      p.className = "script";
      p.textContent = seg.text || "";

      var tools = document.createElement("div");
      tools.className = "tools";
      var bCopy = document.createElement("button");
      bCopy.type = "button";
      bCopy.textContent = "复制这段";
      bCopy.addEventListener("click", function () { copyText(seg.text, "已复制第 " + seg.no + " 段"); });
      var bSpeak = document.createElement("button");
      bSpeak.type = "button";
      bSpeak.textContent = "试读";
      bSpeak.setAttribute("aria-pressed", "false");
      bSpeak.addEventListener("click", function () { toggleSpeak(bSpeak, seg); });
      tools.appendChild(bCopy);
      tools.appendChild(bSpeak);

      card.appendChild(top);
      card.appendChild(h2);
      card.appendChild(p);
      card.appendChild(tools);

      art.appendChild(rail);
      art.appendChild(card);
      frag.appendChild(art);
    });

    wrap.appendChild(frag);
  }

  /* ---------- 滚动进度 ---------- */
  function initProgress() {
    var bar = $("progress");
    var ticking = false;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
      bar.style.width = Math.min(100, Math.max(0, p * 100)).toFixed(2) + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- 入场动画 ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 剪贴板 ---------- */
  function copyText(text, okMsg) {
    if (!text) return;
    var done = function () { toast(okMsg || "已复制"); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { toast("复制失败，请长按选择"); }
    document.body.removeChild(ta);
  }

  var toastTimer = null;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  /* ---------- 试读（语音合成） ---------- */
  var speakingBtn = null;
  function toggleSpeak(btn, seg) {
    if (!("speechSynthesis" in window)) { toast("当前浏览器不支持朗读"); return; }
    if (speakingBtn === btn) { stopSpeak(); return; }
    stopSpeak();
    var u = new SpeechSynthesisUtterance(seg.text);
    u.lang = "zh-CN";
    u.rate = 1.02;
    var voices = window.speechSynthesis.getVoices();
    var zh = voices.filter(function (v) { return /zh|Chinese/i.test(v.lang); })[0];
    if (zh) u.voice = zh;
    u.onend = function () { stopSpeak(); };
    u.onerror = function () { stopSpeak(); };
    speakingBtn = btn;
    btn.setAttribute("aria-pressed", "true");
    btn.textContent = "停止";
    window.speechSynthesis.speak(u);
  }
  function stopSpeak() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (speakingBtn) {
      speakingBtn.setAttribute("aria-pressed", "false");
      speakingBtn.textContent = "试读";
      speakingBtn = null;
    }
  }

  /* ---------- 底部按钮 ---------- */
  function initActions() {
    $("copyAll").addEventListener("click", function () {
      var full = (D.segments || []).map(function (s) {
        return s.no + " ｜ " + s.year + " · " + s.node + "\n" + s.text;
      }).join("\n\n");
      copyText(full, "全稿已复制（10 段）");
    });

    $("copyLink").addEventListener("click", function () {
      copyText(window.location.href, "链接已复制");
    });

    $("shareBtn").addEventListener("click", function () {
      var data = {
        title: D.title || document.title,
        text: D.subtitle || "",
        url: window.location.href
      };
      if (navigator.share) {
        navigator.share(data).catch(function () { /* 用户取消 */ });
      } else {
        copyText(window.location.href, "链接已复制，可粘贴分享");
      }
    });
  }

  /* ---------- 启动 ---------- */
  fillHeader();
  buildTimeline();
  initProgress();
  initReveal();
  initActions();
})();
