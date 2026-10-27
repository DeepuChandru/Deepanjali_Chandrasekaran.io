/* =========================================================
   Deepanjali Chandrasekaran — Portfolio 2026
   Vanilla JS, no dependencies.
   ========================================================= */
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Hero title: split into characters ---------- */
  $$('[data-split]').forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = [...text].map((ch, i) => `<span class="char" aria-hidden="true" style="--i:${i}">${ch}</span>`).join('');
  });
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-ready')));

  /* ---------- Theme toggle (circular reveal via View Transitions) ---------- */
  const setTheme = (t) => {
    root.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
    $('meta[name="theme-color"]').setAttribute('content', t === 'dark' ? '#0b0b1d' : '#f5f6f0');
  };
  $('#themeToggle').addEventListener('click', (e) => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduceMotion) return setTheme(next);
    const x = e.clientX || innerWidth - 60;
    const y = e.clientY || 30;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => setTheme(next)).ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 600, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  });

  /* ---------- Nav: active section + mobile menu ---------- */
  const nav = $('#nav');
  const navLinks = $$('.nav__link');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['impact', 'about', 'focus', 'skills', 'experience', 'work', 'speaking', 'contact']
    .forEach((id) => { const s = document.getElementById(id); s && sectionObserver.observe(s); });

  const burger = $('#burger');
  const menu = $('#mobileMenu');
  const toggleMenu = (open) => {
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggleMenu(!menu.classList.contains('is-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------- Scroll-driven effects (one rAF) ---------- */
  const progress = $('#progress');
  const panel = $('#panel');
  const statement = $('#statement');
  const timeline = $('#timeline');
  const timelineFill = $('#timelineFill');

  if (statement) {
    statement.innerHTML = statement.textContent.trim().split(/\s+/).map((w) => `<span class="word">${w}</span>`).join(' ');
  }
  const words = statement ? $$('.word', statement) : [];

  const onScroll = () => {
    const y = scrollY;
    const max = root.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('is-scrolled', y > 8);

    if (panel && !reduceMotion) {
      // dashboard starts tilted back and lies flat as it scrolls into view
      const top = panel.getBoundingClientRect().top;
      const p = clamp((innerHeight * 0.9 - top) / (innerHeight * 0.65));
      const e = 1 - Math.pow(1 - p, 2);
      panel.style.setProperty('--rx', `${18 * (1 - e)}deg`);
      panel.style.setProperty('--sc', 0.94 + 0.06 * e);
    }
    if (words.length) {
      const r = statement.getBoundingClientRect();
      const p = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.3));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    }
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      timelineFill.style.setProperty('--p', clamp((innerHeight * 0.6 - r.top) / r.height));
    }
  };
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Counters ---------- */
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
    const t0 = performance.now();
    const dur = 1500;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = (target * (1 - Math.pow(1 - p, 4))).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-in');
      $$('[data-count]', el).forEach(animateCount);
      revealObserver.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  $$('[data-reveal]').forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    el.style.setProperty('--d', `${Math.min(siblings.indexOf(el), 8) * 60}ms`);
    revealObserver.observe(el);
  });

  /* ---------- Tooltip ---------- */
  const tooltip = $('#tooltip');
  const bindTip = (el, html) => {
    el.addEventListener('pointermove', (e) => {
      tooltip.innerHTML = html;
      tooltip.style.left = `${clamp(e.clientX, 140, innerWidth - 140)}px`;
      tooltip.style.top = `${e.clientY}px`;
      tooltip.classList.add('is-on');
    });
    el.addEventListener('pointerleave', () => tooltip.classList.remove('is-on'));
  };

  /* ---------- Bar charts ---------- */
  const renderBars = (el, data, unit) => {
    if (!el) return;
    const max = Math.max(...data.map((d) => d.value));
    el.innerHTML = data.map((d, i) => `
      <div class="hbar__row" tabindex="0" data-i="${i}">
        <span class="hbar__label">${d.label}<small>${d.sub}</small></span>
        <span class="hbar__track"><span class="hbar__bar${d.projected ? ' hbar__bar--hatch' : ''}" style="--w:${(d.value / max) * 100}%;--i:${i}"></span></span>
        <span class="hbar__value">${d.value}${unit}</span>
      </div>`).join('');
    $$('.hbar__row', el).forEach((row) => {
      const d = data[row.dataset.i];
      bindTip(row, `<b>${d.value}${unit}</b> · ${d.label}<br>${d.tip}`);
    });
  };

  renderBars($('#impactChart'), [
    { label: 'Data processing efficiency', sub: 'MIT Square · DS intern', value: 40, tip: 'Python cleansing & analysis of large mental-health datasets' },
    { label: 'User engagement', sub: 'Voice chatbot · projected', value: 40, projected: true, tip: 'Projected lift for the ExpenseAnywhere voice chatbot' },
    { label: 'Task time reduction', sub: 'Voice chatbot · projected', value: 30, projected: true, tip: 'Projected reduction in user task time' },
    { label: 'Response time', sub: 'NLP backend · ExpenseAnywhere', value: 30, tip: 'Faster responses via NLP integration' },
    { label: 'Task accuracy', sub: 'Chat & voice workflows', value: 25, tip: 'With development & UX teams' },
    { label: 'Learning outcomes', sub: 'AI curriculum · Kodate', value: 25, tip: 'Grades 8–10 AI curriculum' },
    { label: 'Model performance', sub: 'Fraud detection · City, Univ. of London', value: 20, tip: 'Data mining & parameter tuning' },
    { label: 'Trainee scores', sub: 'DS training · MIT Square', value: 20, tip: 'Interactive lessons & real-world datasets' },
  ], '%');

  renderBars($('#citeChart'), [
    { label: 'Mental Health Analysis', sub: 'IEEE · 2022', value: 24, tip: 'Mental Health Analysis of Employees using ML' },
    { label: 'Road Accident Analysis', sub: 'Paideuma · 2021', value: 15, tip: 'Road Accident Analysis in Kerala using Decision Tree' },
    { label: 'Reveal: Fake Job Ads', sub: 'IEEE · 2022', value: 7, tip: 'Online Fake Job Advert Detection using ML' },
    { label: 'Abnormal User Behavior', sub: 'IEEE · 2023', value: 2, tip: 'Process mining for social-media behavior' },
  ], '');

  /* ---------- Gantt ---------- */
  function openJob(job, open) {
    job.classList.toggle('is-open', open);
    $('.job__head', job).setAttribute('aria-expanded', String(open));
  }
  const gantt = $('#gantt');
  if (gantt) {
    const toNum = (y, m) => y + (m - 1) / 12;
    const now = new Date();
    const nowNum = toNum(now.getFullYear(), now.getMonth() + 1);
    const d0 = 2021;
    const d1 = Math.max(2027, Math.ceil(nowNum + 0.1));
    const pct = (v) => ((v - d0) / (d1 - d0)) * 100;
    const roles = [
      { id: 'job-ea', name: 'Data Analyst', org: 'ExpenseAnywhere', from: [2024, 6], to: null, label: 'Jun 2024 — Present' },
      { id: 'job-trainer', name: 'Data Science Trainer', org: 'MIT Square', from: [2022, 3], to: [2022, 5], label: 'Mar — May 2022' },
      { id: 'job-kodate', name: 'AI Curriculum Creator', org: 'Kodate Services', from: [2021, 8], to: [2022, 2], label: 'Aug 2021 — Feb 2022' },
      { id: 'job-city', name: 'ML Intern', org: 'City, Univ. of London', from: [2021, 7], to: [2021, 9], label: 'Jul — Sep 2021' },
      { id: 'job-intern', name: 'Data Science Intern', org: 'MIT Square', from: [2021, 2], to: [2021, 9], label: 'Feb — Sep 2021' },
    ];
    const years = [];
    for (let y = d0; y <= d1; y++) years.push(y);

    gantt.innerHTML = `<div class="gantt__plot">
      <div class="gantt__axis">${years.map((y) => `<span class="gantt__tick" style="left:${pct(y)}%">${y}</span>`).join('')}</div>
      <div class="gantt__grid">${years.map((y) => `<span style="left:${pct(y)}%"></span>`).join('')}<span class="gantt__now" style="left:${pct(nowNum)}%"></span></div>
      <div class="gantt__rows">${roles.map((r, i) => {
        const a = toNum(...r.from);
        const b = r.to ? toNum(r.to[0], r.to[1] + 1) : nowNum;
        r.months = Math.round((b - a) * 12);
        return `<div class="gantt__row" data-i="${i}" tabindex="0" role="button" aria-label="${r.name}, ${r.org}, ${r.label}">
          <span class="gantt__name">${r.name}<small>${r.org}</small></span>
          <span class="gantt__lane"><span class="gantt__bar${r.to ? '' : ' gantt__bar--live'}" style="--l:${pct(a)}%;--w:${pct(b) - pct(a)}%;--i:${i}"></span></span>
        </div>`;
      }).join('')}</div>
    </div>`;

    $$('.gantt__row', gantt).forEach((row) => {
      const r = roles[row.dataset.i];
      bindTip(row, `<b>${r.name}</b> · ${r.org}<br>${r.label} · ${r.months} months`);
      const go = () => {
        const job = document.getElementById(r.id);
        if (!job) return;
        openJob(job, true);
        job.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        job.classList.add('is-flash');
        setTimeout(() => job.classList.remove('is-flash'), 1600);
      };
      row.addEventListener('click', go);
      row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }

  /* ---------- Segmented controls ---------- */
  const moveGlider = (seg) => {
    const active = $('.seg__btn.is-active', seg);
    const glider = $('.seg__glider', seg);
    if (!active || !glider) return;
    glider.style.width = `${active.offsetWidth}px`;
    glider.style.transform = `translateX(${active.offsetLeft}px)`;
  };
  const segs = $$('.seg');
  const setupSeg = (seg, onSelect) => {
    $$('.seg__btn', seg).forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.seg__btn', seg).forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
        moveGlider(seg);
        onSelect(btn);
      });
    });
    moveGlider(seg);
  };

  // Dashboard views — replay chart animation each time a view opens
  const panelSeg = panel && $('.seg', panel);
  const showView = (name) => {
    $$('.view', panel).forEach((v) => {
      const on = v.dataset.view === name;
      v.classList.toggle('is-active', on);
      if (on) {
        v.classList.remove('is-in');
        void v.offsetWidth;
        v.classList.add('is-in');
        $$('[data-count]', v).forEach(animateCount);
      }
    });
  };
  if (panelSeg) {
    setupSeg(panelSeg, (btn) => showView(btn.dataset.view));
    let shown = false;
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting && !shown) { shown = true; showView('overview'); obs.disconnect(); }
    }, { threshold: 0.25 }).observe(panel);
  }

  // Research tabs
  const researchSeg = $('#work .seg');
  if (researchSeg) {
    setupSeg(researchSeg, (btn) => {
      $$('.tab-panel').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === btn.dataset.tab));
    });
  }
  const refreshGliders = () => segs.forEach(moveGlider);
  addEventListener('resize', refreshGliders);
  document.fonts && document.fonts.ready.then(refreshGliders);

  /* ---------- Experience accordion ---------- */
  $$('.job').forEach((job) => {
    $('.job__head', job).addEventListener('click', () => openJob(job, !job.classList.contains('is-open')));
  });

  /* ---------- SQL console ---------- */
  const SKILLS = {
    languages: [
      ['Python', 'Data, ML & automation'], ['SQL', 'Querying & modeling'], ['JavaScript', 'Web'],
      ['HTML', 'Web'], ['CSS', 'Web'], ['C', 'Systems'], ['C++', 'Systems & DSA'],
    ],
    analytics: [
      ['Power BI', 'BI dashboards'], ['Tableau', 'BI dashboards'], ['MS Excel', 'Spreadsheet analysis'],
      ['Jupyter Notebook', 'Exploration'], ['SSMS', 'SQL Server'], ['Matplotlib', 'Python viz'],
      ['Seaborn', 'Python viz'], ['Figma', 'UX & dashboard design'],
    ],
    ai: [
      ['OpenAI GPT-4o', 'LLMs'], ['EasyOCR', 'Document OCR'], ['spaCy', 'NLP'], ['NLTK', 'NLP'],
      ['Scikit-learn', 'Classical ML'], ['TensorFlow', 'Deep learning'], ['Keras', 'Deep learning'],
      ['Pandas', 'DataFrames'], ['NumPy', 'Numerics'], ['DeepL', 'Translation'],
    ],
    cloud: [
      ['Microsoft Azure', 'Cloud platform'], ['Azure Blob Storage', 'Storage & analytics'],
      ['Azure Function Apps', 'Serverless'], ['REST API', 'Integration'], ['Flask', 'Web APIs'],
      ['Blazor', 'Dashboards'], ['Git', 'Version control'],
    ],
  };
  const TABLES = { languages: 'languages', analytics: 'analytics_viz', ai: 'ai_ml', cloud: 'cloud_dev' };
  const sqlQuery = $('#sqlQuery');
  const sqlResult = $('#sqlResult');
  const sqlStatus = $('#sqlStatus');
  let currentCat = 'languages';
  let typingTimer = null;

  const tokensFor = (cat) => [
    ['k', 'SELECT'], ['', ' name, used_for\n'], ['k', 'FROM'], ['s', ` skills.${TABLES[cat]}`], ['', '\n'],
    ['k', 'WHERE'], ['', ' proficient = '], ['b', 'TRUE'], ['', ';'],
  ];
  const renderTokens = (tokens, n) => {
    let out = '';
    let left = n;
    for (const [cls, text] of tokens) {
      if (left <= 0) break;
      const part = text.slice(0, left);
      left -= part.length;
      out += cls ? `<span class="${cls}">${part}</span>` : part;
    }
    // one span per line so CSS can number them
    return out.split('\n').map((l) => `<span class="line">${l || ' '}</span>`).join('');
  };
  const runQuery = (cat) => {
    clearTimeout(typingTimer);
    currentCat = cat;
    const tokens = tokensFor(cat);
    const total = tokens.reduce((s, [, t]) => s + t.length, 0);
    sqlResult.innerHTML = '';
    sqlStatus.innerHTML = '&nbsp;';
    let n = reduceMotion ? total : 0;
    const type = () => {
      sqlQuery.innerHTML = renderTokens(tokens, n).replace(/<\/span>$/, n < total ? '<span class="caret"></span></span>' : '</span>');
      if (n < total) { n += 1; typingTimer = setTimeout(type, 16 + Math.random() * 20); return; }
      sqlStatus.textContent = 'Running…';
      typingTimer = setTimeout(() => {
        const rows = SKILLS[cat];
        sqlResult.innerHTML = `<table class="rtable">
          <thead><tr><th>#</th><th>name</th><th>used_for</th></tr></thead>
          <tbody>${rows.map((r, i) => `<tr style="--i:${i}"><td>${String(i + 1).padStart(2, '0')}</td><td>${r[0]}</td><td><span class="chip">${r[1]}</span></td></tr>`).join('')}</tbody>
        </table>`;
        sqlStatus.innerHTML = `<span class="console__ok">✓ Success</span>${rows.length} rows · ${(4 + Math.random() * 18).toFixed(0)} ms`;
      }, reduceMotion ? 0 : 280);
    };
    type();
  };
  const consoleTabs = $$('.console__tab');
  consoleTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      consoleTabs.forEach((t) => { t.classList.toggle('is-active', t === tab); t.setAttribute('aria-selected', String(t === tab)); });
      runQuery(tab.dataset.cat);
    });
  });
  $('#runQuery')?.addEventListener('click', () => runQuery(currentCat));
  const consoleEl = $('.console');
  if (consoleEl) {
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) { runQuery(currentCat); obs.disconnect(); }
    }, { threshold: 0.35 }).observe(consoleEl);
  }

  /* ---------- Publication filters ---------- */
  $$('.filter').forEach((f) => {
    f.addEventListener('click', () => {
      $$('.filter').forEach((x) => x.classList.toggle('is-active', x === f));
      const type = f.dataset.filter;
      $$('#pubs .pub').forEach((p) => {
        const show = type === 'all' || p.dataset.type === type;
        p.classList.toggle('is-hidden', !show);
        if (show && !reduceMotion) p.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'cubic-bezier(.22,1,.36,1)' });
      });
    });
  });

  /* ---------- Copy email ---------- */
  const toast = $('#toast');
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove('is-on'), 2200);
  };
  $('#copyEmail')?.addEventListener('click', async (e) => {
    const email = e.currentTarget.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      showToast('Email copied to clipboard');
    } catch (err) {
      location.href = `mailto:${email}`;
    }
  });

  /* ---------- Card glow follows pointer ---------- */
  $$('.card, .project, .patent, .cert, .contact__card').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Hero canvas: quiet data network ---------- */
  (() => {
    const canvas = $('#heroCanvas');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    const hero = canvas.closest('.hero');
    const mouse = { x: -9999, y: -9999 };
    let w, h, pts, rgb, visible = true;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(clamp((w * h) / 22000, 24, 70));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.7,
        vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, r: Math.random() * 1.2 + 0.5,
      }));
    };
    const draw = () => {
      if (visible) {
        rgb = getComputedStyle(root).getPropertyValue('--canvas-rgb').trim();
        ctx.clearRect(0, 0, w, h);
        for (const p of pts) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h * 0.75) p.vy *= -1;
        }
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i];
          const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
          for (let j = i + 1; j < pts.length; j++) {
            const b = pts[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 130) {
              ctx.strokeStyle = `rgba(${rgb},${(1 - d / 130) * (md < 200 ? 0.28 : 0.1)})`;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
          ctx.fillStyle = `rgba(${rgb},${md < 200 ? 0.9 : 0.4})`;
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    };
    resize();
    addEventListener('resize', resize);
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(canvas);
    draw();
  })();

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
