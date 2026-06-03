// ── Fyzika Run ──
(function () {

  const GRAV   = 0.7;
  const JUMP   = -12;
  const FLOOR  = 165;
  const CH     = 200;   // canvas height
  const SPD0   = 4;
  const DINC   = 0.0008;
  const PW = 26, PH = 26;

  const wrap = document.getElementById('game-wrapper');
  const cv   = document.getElementById('game-canvas');
  const cx   = cv.getContext('2d');

  const resize = () => { cv.width = wrap.clientWidth; cv.height = CH; };
  resize();
  window.addEventListener('resize', resize);

  // ── Obstacle catalogue ──
  const DEFS = [
    { lbl: 'v⃗', w: 24, h: 52, s: 'arrow' },
    { lbl: 'Ep',      w: 20, h: 72, s: 'rect'  },
    { lbl: 'Ek',      w: 58, h: 24, s: 'rect'  },
    { lbl: 'F=ma',    w: 30, h: 40, s: 'rect'  },
    { lbl: 'p=mv',    w: 26, h: 26, s: 'spin'  },
    { lbl: 'λ',  w: 68, h: 22, s: 'wave'  },
    { lbl: 'Fd',      w: 64, h: 20, s: 'rect'  },
    { lbl: 'g',       w: 24, h: 38, s: 'grav'  },
  ];

  // ── State ──
  let mode  = 'idle';
  let score = 0;
  let spd   = SPD0;
  let fr    = 0;
  let nxt   = 90;
  let top5  = [];

  const pl  = { x: 75, y: FLOOR - PH, vy: 0, gr: true };
  let obs   = [];

  // ── Input ──
  const act = () => {
    if (mode === 'idle') { mode = 'run'; return; }
    if (mode === 'dead') { restart(); return; }
    if (pl.gr) { pl.vy = JUMP; pl.gr = false; }
  };

  document.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); act(); }
  });
  cv.addEventListener('click',      e => { e.stopPropagation(); act(); });
  cv.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); act(); }, { passive: false });

  // ── Obstacle helpers ──
  const randDef = () => DEFS[Math.floor(Math.random() * DEFS.length)];
  const mkObs   = (d, x) => ({ x, y: FLOOR - d.h, w: d.w, h: d.h, lbl: d.lbl, s: d.s, rot: 0 });

  function spawn() {
    const d = randDef();
    const o = mkObs(d, cv.width + 20);
    obs.push(o);
    // Occasional double obstacle after score 300
    if (score > 300 && Math.random() < 0.3) {
      const d2 = randDef();
      obs.push(mkObs(d2, o.x + d.w + 50 + Math.random() * 30));
    }
  }

  function hits(o) {
    const m = 4;
    return pl.x+m < o.x+o.w && pl.x+PW-m > o.x &&
           pl.y+m < o.y+o.h && pl.y+PH-m > o.y;
  }

  function restart() {
    score = 0; spd = SPD0; fr = 0; nxt = 90;
    obs = []; top5 = [];
    pl.y = FLOOR - PH; pl.vy = 0; pl.gr = true;
    mode = 'run';
  }

  async function die() {
    mode = 'dead';
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/runs`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ score }),
      });
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/runs?select=score&order=score.desc&limit=5`,
        { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
      );
      top5 = await r.json();
    } catch (_) {}
  }

  // ── Update ──
  function update() {
    if (mode !== 'run') return;
    fr++; score++;
    spd = SPD0 + score * DINC;

    pl.vy += GRAV;
    pl.y  += pl.vy;
    if (pl.y >= FLOOR - PH) { pl.y = FLOOR - PH; pl.vy = 0; pl.gr = true; }

    if (fr >= nxt) {
      spawn();
      nxt = fr + Math.max(45, 90 - score * 0.014) + Math.random() * 50;
    }

    for (let i = obs.length - 1; i >= 0; i--) {
      const o = obs[i];
      o.x -= spd;
      if (o.s === 'spin') o.rot += 0.06;
      if (o.x + o.w < 0) { obs.splice(i, 1); continue; }
      if (hits(o)) { die(); return; }
    }
  }

  // ── Draw ──
  const fnt = (sz, w = '500') => `${w} ${sz}px "DM Mono",monospace`;

  function drawObs(o) {
    cx.save();
    cx.fillStyle = '#1e1e1e'; cx.strokeStyle = '#3a3a3a'; cx.lineWidth = 1;

    if (o.s === 'spin') {
      cx.translate(o.x + o.w/2, o.y + o.h/2);
      cx.rotate(o.rot);
      cx.fillRect(-o.w/2, -o.h/2, o.w, o.h);
      cx.strokeRect(-o.w/2, -o.h/2, o.w, o.h);
      cx.fillStyle = '#666'; cx.font = fnt(8);
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(o.lbl, 0, 0);
      cx.restore(); return;
    }

    if (o.s === 'wave') {
      cx.beginPath();
      cx.moveTo(o.x, o.y + o.h);
      for (let i = 0; i <= o.w; i++)
        cx.lineTo(o.x + i, o.y + o.h - Math.abs(Math.sin(i / o.w * Math.PI * 3)) * o.h);
      cx.lineTo(o.x + o.w, o.y + o.h);
      cx.closePath(); cx.fill(); cx.stroke();
    } else if (o.s === 'arrow') {
      const mx = o.x + o.w / 2;
      cx.beginPath();
      cx.moveTo(o.x + 5,     o.y + o.h);
      cx.lineTo(o.x + o.w-5, o.y + o.h);
      cx.lineTo(o.x + o.w-5, o.y + o.h * 0.5);
      cx.lineTo(o.x + o.w+5, o.y + o.h * 0.5);
      cx.lineTo(mx,           o.y);
      cx.lineTo(o.x - 5,     o.y + o.h * 0.5);
      cx.lineTo(o.x + 5,     o.y + o.h * 0.5);
      cx.closePath(); cx.fill(); cx.stroke();
    } else if (o.s === 'grav') {
      cx.fillRect(o.x, o.y, o.w, o.h);
      cx.strokeRect(o.x, o.y, o.w, o.h);
      // falling arrow above block
      const mx = o.x + o.w / 2;
      cx.strokeStyle = '#444'; cx.lineWidth = 1.5;
      cx.beginPath();
      cx.moveTo(mx, o.y - 14); cx.lineTo(mx, o.y - 3);
      cx.moveTo(mx - 4, o.y - 8); cx.lineTo(mx, o.y - 3); cx.lineTo(mx + 4, o.y - 8);
      cx.stroke();
    } else {
      cx.fillRect(o.x, o.y, o.w, o.h);
      cx.strokeRect(o.x, o.y, o.w, o.h);
    }

    // Label
    cx.fillStyle = '#666';
    cx.font = fnt(o.h > 35 ? 9 : 8);
    cx.textAlign = 'center';
    if (o.s === 'arrow') {
      cx.textBaseline = 'bottom';
      cx.fillText(o.lbl, o.x + o.w / 2, o.y - 2);
    } else {
      cx.textBaseline = 'middle';
      cx.fillText(o.lbl, o.x + o.w / 2, o.y + o.h / 2);
    }
    cx.restore();
  }

  function draw() {
    cx.fillStyle = '#0d0d0d';
    cx.fillRect(0, 0, cv.width, CH);

    // Ground
    cx.strokeStyle = '#2e2e2e'; cx.lineWidth = 1;
    cx.beginPath(); cx.moveTo(0, FLOOR); cx.lineTo(cv.width, FLOOR); cx.stroke();

    obs.forEach(drawObs);

    // Player — square "m"
    cx.fillStyle = '#e8e8e8'; cx.strokeStyle = '#888'; cx.lineWidth = 1;
    cx.fillRect(pl.x, pl.y, PW, PH);
    cx.strokeRect(pl.x, pl.y, PW, PH);
    cx.fillStyle = '#0d0d0d'; cx.font = fnt(12, 'bold');
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillText('m', pl.x + PW / 2, pl.y + PH / 2);

    // Score (top right)
    if (mode !== 'idle') {
      cx.fillStyle = '#333'; cx.font = fnt(11);
      cx.textAlign = 'right'; cx.textBaseline = 'top';
      cx.fillText(String(score).padStart(6, '0'), cv.width - 14, 12);
    }

    if (mode === 'idle') {
      cx.fillStyle = '#2e2e2e'; cx.font = fnt(10);
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(
        cv.width < 500 ? 'tap pre štart' : 'SPACE alebo klikni pre štart',
        cv.width / 2, FLOOR / 2
      );
    }

    if (mode === 'dead') {
      cx.fillStyle = 'rgba(13,13,13,0.92)';
      cx.fillRect(0, 0, cv.width, CH);
      cx.textAlign = 'center';

      cx.fillStyle = '#e8e8e8'; cx.font = fnt(13, '700'); cx.textBaseline = 'middle';
      cx.fillText('GAME OVER', cv.width / 2, 28);

      cx.fillStyle = '#555'; cx.font = fnt(10);
      cx.fillText(`score: ${score}`, cv.width / 2, 46);

      if (top5.length) {
        cx.fillStyle = '#252525'; cx.font = fnt(8);
        cx.fillText('─── top 5 ───', cv.width / 2, 65);
        top5.forEach((r, i) => {
          const me = r.score === score;
          cx.fillStyle = i === 0 ? '#777' : me ? '#ccc' : '#333';
          cx.font = fnt(me ? 10 : 9, me ? '600' : '400');
          cx.fillText(`${i + 1}. ${r.score}`, cv.width / 2, 80 + i * 16);
        });
      } else {
        cx.fillStyle = '#252525'; cx.font = fnt(9);
        cx.fillText('načítavam...', cv.width / 2, 90);
      }

      cx.fillStyle = '#2a2a2a'; cx.font = fnt(8);
      cx.fillText(
        cv.width < 500 ? 'tap pre restart' : 'SPACE / klikni pre restart',
        cv.width / 2, CH - 12
      );
    }
  }

  const loop = () => { update(); draw(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);

})();
