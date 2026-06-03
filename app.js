const SUPABASE_URL = 'https://ymdchsvjlommtwyzvpyy.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZGNoc3ZqbG9tbXR3eXp2cHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzE1NjYsImV4cCI6MjA5NjA0NzU2Nn0.HllimI-r8jKob67JvB81tfDn4HsUsc6Zx710tcVGaSw';

const headers = {
  'apikey': SUPABASE_ANON,
  'Authorization': `Bearer ${SUPABASE_ANON}`,
  'Content-Type': 'application/json'
};

let reviews = [];
let floatReviews = [];

// ── Fetch reviews from Supabase ──
async function fetchReviews() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reviews?approved=eq.true&order=created_at.desc`, { headers });
    if (!res.ok) return;
    reviews = await res.json();
    const seen = new Set();
    floatReviews = reviews.filter(r => {
      const key = `${r.name}|${r.comment}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    startFloating();
    const countEl = document.getElementById("review-count");
    if (countEl) countEl.textContent = reviews.length;
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

// ── Floating pills logic ──
const container = document.getElementById('float-container');
let floatInterval = null;

function spawnPill() {
  if (floatReviews.length === 0) return;

  const review = floatReviews[Math.floor(Math.random() * floatReviews.length)];
  const pill = document.createElement('div');
  pill.className = 'float-pill';

  const isMobile = window.innerWidth < 640;
  const side = Math.random() < 0.5 ? 'left' : 'right';
  let left, startY;

  if (isMobile) {
    // Far edges only — card is full-width on mobile
    left = side === 'left' ? Math.random() * 16 : 80 + Math.random() * 16;
    // Below the card area only
    startY = 75 + Math.random() * 20;
  } else {
    // Desktop: avoid center 30%
    left = side === 'left' ? Math.random() * 32 : 58 + Math.random() * 32;
    startY = 55 + Math.random() * 40;
  }

  const duration = 12 + Math.random() * 10; // 12–22s

  pill.style.cssText = `
    left: ${left}%;
    top: ${startY}%;
    animation-duration: ${duration}s;
    animation-delay: 0s;
  `;

  pill.innerHTML = `
    <div class="float-pill-name">${escapeHtml(review.name)}</div>
    <div class="float-pill-comment">${escapeHtml(review.comment)}</div>
  `;

  container.appendChild(pill);

  // Remove after animation
  setTimeout(() => pill.remove(), duration * 1000 + 500);
}

function startFloating() {
  if (floatReviews.length === 0) return;
  // Spawn first few quickly
  for (let i = 0; i < Math.min(4, reviews.length); i++) {
    setTimeout(spawnPill, i * 1200);
  }
  // Then continuous spawn
  floatInterval = setInterval(spawnPill, 3500);
}

// ── Submit review ──
async function submitReview() {
  const name = document.getElementById('input-name').value.trim();
  const comment = document.getElementById('input-comment').value.trim();

  if (!name || !comment) {
    shake();
    return;
  }

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Odosielam...';

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ name, comment })
    });

    if (res.ok || res.status === 201) {
      document.getElementById('view-form').classList.add('hidden');
      document.getElementById('view-success').classList.remove('hidden');
      // Reload reviews to include new one
      fetchReviews();
    } else {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Odoslať';
    }
  } catch (e) {
    console.error('Submit error:', e);
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Odoslať';
  }
}

// ── Char counter ──
document.getElementById('input-comment').addEventListener('input', function () {
  document.getElementById('char-num').textContent = this.value.length;
});

// ── Shake animation on empty submit ──
function shake() {
  const card = document.getElementById('main-card');
  card.style.animation = 'none';
  card.style.transform = 'translateX(-6px)';
  setTimeout(() => { card.style.transform = 'translateX(6px)'; }, 80);
  setTimeout(() => { card.style.transform = 'translateX(-4px)'; }, 160);
  setTimeout(() => { card.style.transform = 'translateX(0)'; }, 240);
}

// ── Escape HTML ──
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ──
fetchReviews();

// ── Panak Fyzika ──
(function () {
  const canvas = document.getElementById('panakCanvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); updatePos(); });

  const isMob = () => window.innerWidth < 640;
  let figX, figY;
  function updatePos() {
    figX = isMob() ? window.innerWidth  * 0.50 : window.innerWidth  * 0.12;
    figY = isMob() ? window.innerHeight * 0.78 : window.innerHeight * 0.73;
  }
  updatePos();

  // 2-segment IK solver
  function ik(base, end, l1, l2) {
    const dx = end.x - base.x, dy = end.y - base.y;
    const d  = Math.min(Math.sqrt(dx*dx + dy*dy), l1 + l2 - 0.5);
    const a0 = Math.atan2(dy, dx);
    const ca = (l1*l1 + d*d - l2*l2) / (2 * l1 * d);
    const a  = Math.acos(Math.max(-1, Math.min(1, ca)));
    return { x: base.x + Math.cos(a0 - a) * l1, y: base.y + Math.sin(a0 - a) * l1 };
  }

  const S = 0.9;
  const BODY = 50*S, HEAD = 13*S;
  const L1A  = 27*S, L2A  = 24*S;
  const L1L  = 31*S, L2L  = 29*S;

  const BASES = {
    lHand: { x: -14, y: -BODY },
    rHand: { x:  14, y: -BODY },
    lFoot: { x: -11, y:  0   },
    rFoot: { x:  11, y:  0   },
  };

  function restPos() {
    return {
      lHand: { x: -38, y: -BODY + 18 },
      rHand: { x:  38, y: -BODY + 18 },
      lFoot: { x: -22, y:  L1L + L2L },
      rFoot: { x:  22, y:  L1L + L2L },
    };
  }

  const ends = restPos();
  let activeLimb = null, retTimer = null;

  function hit(px, py) {
    const lx = px - figX, ly = py - figY;
    let best = 'lHand', bestD = Infinity;
    for (const k in ends) {
      const d = Math.hypot(lx - ends[k].x, ly - ends[k].y);
      if (d < bestD) { bestD = d; best = k; }
    }
    const b = BASES[best];
    const isArm = best.endsWith('Hand');
    const reach = (isArm ? L1A + L2A : L1L + L2L) * 0.94;
    const dx = lx - b.x, dy = ly - b.y;
    const d  = Math.hypot(dx, dy) || 1;
    ends[best] = { x: b.x + (dx/d)*Math.min(d, reach), y: b.y + (dy/d)*Math.min(d, reach) };
    activeLimb = best;
    clearTimeout(retTimer);
    retTimer = setTimeout(springBack, 650);
  }

  function springBack() {
    if (!activeLimb) return;
    const limb   = activeLimb;
    const target = restPos()[limb];
    const start  = { ...ends[limb] };
    let t = 0;
    function step() {
      t += 0.055;
      if (t >= 1) { Object.assign(ends[limb], target); activeLimb = null; return; }
      const e = 1 - Math.pow(1 - t, 3);
      ends[limb] = { x: start.x + (target.x - start.x)*e, y: start.y + (target.y - start.y)*e };
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(figX, figY);
    ctx.strokeStyle = '#555';
    ctx.fillStyle   = '#555';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    // Limbs
    for (const [k, b] of Object.entries(BASES)) {
      const e    = ends[k];
      const isA  = k.endsWith('Hand');
      const joint = ik(b, e, isA ? L1A : L1L, isA ? L2A : L2L);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(joint.x, joint.y);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
    }

    // Torso
    ctx.beginPath(); ctx.moveTo(0, -BODY); ctx.lineTo(0, 0); ctx.stroke();

    // Head
    ctx.beginPath(); ctx.arc(0, -BODY - HEAD, HEAD, 0, Math.PI * 2); ctx.stroke();

    // Label
    ctx.font      = '500 9px "DM Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('fyzika', 0, -BODY - HEAD * 2 - 6);

    ctx.restore();
    requestAnimationFrame(drawFrame);
  }
  requestAnimationFrame(drawFrame);

  const skipEl = e => e.target.closest('input, textarea, button');
  document.addEventListener('click', e => {
    if (skipEl(e)) return;
    hit(e.clientX, e.clientY);
  });
  document.addEventListener('touchend', e => {
    if (skipEl(e)) return;
    const t = e.changedTouches[0];
    hit(t.clientX, t.clientY);
  }, { passive: true });
})();
