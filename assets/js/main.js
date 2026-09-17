(function () {
  'use strict';

  var STORAGE_KEY = 'nfc-workshop-progress-v2';
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
      return raw ? JSON.parse(raw) : { completed: [], bonusXp: 0 };
    } catch (e) {
      return { completed: [], bonusXp: 0 };
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
      return progress.completed.indexOf(id) !== -1 ? sum + xpOf(c) : sum;
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

  function setCardCompleteState(card, isComplete) {
    var statusBadge = card.querySelector('.badge.status');
    card.classList.toggle('complete', isComplete);
    if (statusBadge) statusBadge.hidden = !isComplete;
  }

  function initDatabase(gridId, dbKey) {
    var grid = document.getElementById(gridId);
    if (!grid) return;
    var cards = collectCards(grid);
    databases[dbKey] = cards;

    cards.forEach(function (card) {
      var id = card.getAttribute('data-id');
      var checkbox = card.querySelector('.complete-checkbox');
      if (!checkbox) return;

      var alreadyComplete = progress.completed.indexOf(id) !== -1;
      checkbox.checked = alreadyComplete;
      setCardCompleteState(card, alreadyComplete);

      checkbox.addEventListener('change', function () {
        var xp = xpOf(card);
        var title = card.querySelector('.idea-title');
        var titleText = title ? title.textContent : 'Entry';
        var idx = progress.completed.indexOf(id);

        if (checkbox.checked && idx === -1) {
          progress.completed.push(id);
          showToast('+' + xp + ' XP: ' + titleText + ' marked complete');
        } else if (!checkbox.checked && idx !== -1) {
          progress.completed.splice(idx, 1);
          showToast(titleText + ' marked incomplete, ' + xp + ' XP removed');
        }

        saveProgress(progress);
        setCardCompleteState(card, checkbox.checked);
        refreshAll();
      });

      checkbox.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    });
  }

  /* ---------- progressive hint reveal ---------- */
  /* Hints are all visible by default in the HTML so the page works without
     JS. Here we hide every hint after the first, and reveal the next one
     each time the previous is opened, turning it into a step-by-step
     reveal instead of a flat list. */

  function initHintReveal() {
    document.querySelectorAll('.challenge').forEach(function (challenge) {
      var hints = Array.prototype.slice.call(challenge.querySelectorAll('.hint'));
      if (hints.length < 2) return;

      hints.forEach(function (hint, index) {
        if (index > 0 && !hint.open) hint.hidden = true;

        hint.addEventListener('toggle', function () {
          if (!hint.open) return;
          var next = hints[index + 1];
          if (next) next.hidden = false;
        });
      });

      hints.forEach(function (hint) {
        hint.addEventListener('click', function (e) {
          e.stopPropagation();
        });
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

  /* ---------- troubleshooting search ---------- */
  /* Each phone category is a collapsible <details class="readmore">. Typing
     a query filters the <li> items inside all of them, force-opens any
     category with a match so results are visible without an extra click,
     and hides categories with no match at all. Clearing the box restores
     the default collapsed state. */

  function initTroubleshootingSearch() {
    var input = document.getElementById('tsSearchInput');
    var section = document.getElementById('troubleshooting');
    if (!input || !section) return;

    var categories = Array.prototype.slice.call(section.querySelectorAll('details.readmore[data-ts-category]'));
    var emptyState = document.getElementById('tsSearchEmpty');

    function apply() {
      var query = input.value.trim().toLowerCase();
      var totalVisible = 0;

      categories.forEach(function (cat) {
        var items = Array.prototype.slice.call(cat.querySelectorAll('li'));
        var visibleInCat = 0;

        items.forEach(function (li) {
          var matches = query === '' || li.textContent.toLowerCase().indexOf(query) !== -1;
          li.hidden = !matches;
          if (matches) visibleInCat++;
        });

        cat.hidden = query !== '' && visibleInCat === 0;
        if (query !== '') {
          if (visibleInCat > 0) cat.open = true;
        } else {
          cat.open = false;
        }

        totalVisible += visibleInCat;
      });

      if (emptyState) emptyState.hidden = !(query !== '' && totalVisible === 0);
    }

    input.addEventListener('input', apply);
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

    var full = '> loading workshop reference: NFC + Tasker';
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
        setTimeout(tick, 20);
      }
    }
    tick();
  }

  /* ---------- konami-style bonus code (arrow keys, hidden) ---------- */

  function initBonusCode() {
    var seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
    var pos = 0;
    document.addEventListener('keydown', function (e) {
      if (e.key === seq[pos]) {
        pos++;
        if (pos === seq.length) {
          pos = 0;
          progress.bonusXp = (progress.bonusXp || 0) + 50;
          saveProgress(progress);
          showToast('Bonus code accepted: +50 XP');
          refreshAll();
        }
      } else {
        pos = (e.key === seq[0]) ? 1 : 0;
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
    initHintReveal();
    initTroubleshootingSearch();
    initBonusCode();
    refreshAll();
  });
})();
