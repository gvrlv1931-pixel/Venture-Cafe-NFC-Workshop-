(function () {
  'use strict';

  var STORAGE_KEY = 'nfc-workshop-progress-v1';
  var RANKS = [
    { min: 0, name: 'Rookie Tapper' },
    { min: 0.2, name: 'Tag Technician' },
    { min: 0.45, name: 'NFC Adept' },
    { min: 0.7, name: 'Automation Wizard' },
    { min: 0.95, name: 'Tap Master' }
  ];

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { unlocked: [], bonusXp: 0 };
    } catch (e) {
      return { unlocked: [], bonusXp: 0 };
    }
  }

  function saveProgress(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) { /* storage unavailable, degrade silently */ }
  }

  var progress = loadProgress();

  function rankFor(ratio) {
    var current = RANKS[0].name;
    for (var i = 0; i < RANKS.length; i++) {
      if (ratio >= RANKS[i].min) current = RANKS[i].name;
    }
    return current;
  }

  function showToast(msg) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove('show');
    }, 2600);
  }

  /* ---------- gamebar computation per database ---------- */

  function collectCards(grid) {
    return Array.prototype.slice.call(grid.querySelectorAll('.idea-card'));
  }

  function xpOf(card) {
    return parseInt(card.getAttribute('data-xp'), 10) || 0;
  }

  function updateGamebar(dbKey, cards) {
    var maxXp = cards.reduce(function (sum, c) { return sum + xpOf(c); }, 0);
    var earned = cards.reduce(function (sum, c) {
      var id = c.getAttribute('data-id');
      return progress.unlocked.indexOf(id) !== -1 ? sum + xpOf(c) : sum;
    }, 0);

    var fill = document.getElementById(dbKey + 'ProgressFill');
    var rankEl = document.getElementById(dbKey + 'RankName');
    var xpValEl = document.getElementById(dbKey + 'XpValue');
    var xpMaxEl = document.getElementById(dbKey + 'XpMax');

    var ratio = maxXp > 0 ? earned / maxXp : 0;
    if (fill) fill.style.width = (ratio * 100) + '%';
    if (rankEl) rankEl.textContent = rankFor(ratio);
    if (xpValEl) xpValEl.textContent = earned;
    if (xpMaxEl) xpMaxEl.textContent = maxXp;

    return { earned: earned, maxXp: maxXp };
  }

  function updateOverall(dbTotals) {
    var earned = 0, maxXp = 0;
    dbTotals.forEach(function (t) { earned += t.earned; maxXp += t.maxXp; });
    earned += progress.bonusXp || 0;

    var fill = document.getElementById('overallProgressFill');
    var rankEl = document.getElementById('overallRankName');
    var xpValEl = document.getElementById('overallXpValue');
    var xpMaxEl = document.getElementById('overallXpMax');

    var ratio = maxXp > 0 ? Math.min(earned / maxXp, 1) : 0;
    if (fill) fill.style.width = (ratio * 100) + '%';
    if (rankEl) rankEl.textContent = rankFor(ratio);
    if (xpValEl) xpValEl.textContent = earned;
    if (xpMaxEl) xpMaxEl.textContent = maxXp;
  }

  var databases = {};

  function refreshAll() {
    var totals = [];
    Object.keys(databases).forEach(function (key) {
      totals.push(updateGamebar(key, databases[key]));
    });
    updateOverall(totals);
  }

  function markExploredState(card) {
    var id = card.getAttribute('data-id');
    if (progress.unlocked.indexOf(id) !== -1) {
      card.classList.add('explored');
    }
  }

  function initDatabase(gridId, dbKey) {
    var grid = document.getElementById(gridId);
    if (!grid) return;
    var cards = collectCards(grid);
    databases[dbKey] = cards;

    cards.forEach(function (card) {
      markExploredState(card);
      card.addEventListener('toggle', function () {
        if (!card.open) return;
        var id = card.getAttribute('data-id');
        if (progress.unlocked.indexOf(id) === -1) {
          progress.unlocked.push(id);
          saveProgress(progress);
          card.classList.add('explored');
          var xp = xpOf(card);
          var title = card.querySelector('.idea-title');
          showToast('+' + xp + ' XP — ' + (title ? title.textContent : 'Idea') + ' unlocked');
          refreshAll();
        }
      });
    });
  }

  /* ---------- filters ---------- */

  function initFilters(scopeSelector, gridId) {
    var scope = document.querySelector(scopeSelector);
    var grid = document.getElementById(gridId);
    if (!scope || !grid) return;

    var state = { category: 'all', difficulty: 'all' };
    var emptyState = grid.parentElement.querySelector('.empty-state');

    function apply() {
      var cards = collectCards(grid);
      var visibleCount = 0;
      cards.forEach(function (card) {
        var cat = card.getAttribute('data-category');
        var diff = card.getAttribute('data-difficulty');
        var matches =
          (state.category === 'all' || state.category === cat) &&
          (state.difficulty === 'all' || state.difficulty === diff);
        card.hidden = !matches;
        if (matches) visibleCount++;
      });
      if (emptyState) emptyState.hidden = visibleCount !== 0;
    }

    scope.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var type = btn.getAttribute('data-filter-type');
        var value = btn.getAttribute('data-filter-value');
        state[type] = value;

        scope.querySelectorAll('.filter-btn[data-filter-type="' + type + '"]').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        apply();
      });
    });

    apply();
  }

  /* ---------- nav toggle ---------- */

  function initNav() {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('siteNav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- typewriter (respects reduced motion) ---------- */

  function initTypewriter() {
    var el = document.querySelector('.terminal-line');
    if (!el) return;
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    var cursor = el.querySelector('.cursor');
    var full = '> booting tap-to-automate protocol';
    el.textContent = '';
    var cursorSpan = document.createElement('span');
    cursorSpan.className = 'cursor';
    cursorSpan.textContent = '_';

    var i = 0;
    function tick() {
      if (i <= full.length) {
        el.textContent = full.slice(0, i);
        el.appendChild(cursorSpan);
        i++;
        setTimeout(tick, 22);
      }
    }
    tick();
  }

  /* ---------- konami easter egg ---------- */

  function initEasterEgg() {
    var seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    var pos = 0;
    document.addEventListener('keydown', function (e) {
      var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === seq[pos]) {
        pos++;
        if (pos === seq.length) {
          pos = 0;
          progress.bonusXp = (progress.bonusXp || 0) + 50;
          saveProgress(progress);
          showToast('🛸 CHEAT CODE ACCEPTED — +50 bonus XP');
          refreshAll();
        }
      } else {
        pos = (key === seq[0]) ? 1 : 0;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initTypewriter();
    initDatabase('ideasGrid', 'ideas');
    initDatabase('taskerGrid', 'tasker');
    initFilters('.filters[data-db="ideas"]', 'ideasGrid');
    initFilters('.filters[data-db="tasker"]', 'taskerGrid');
    initEasterEgg();
    refreshAll();
  });
})();
