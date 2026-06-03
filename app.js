const SUPABASE_URL = 'https://ymdchsvjlommtwyzvpyy.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZGNoc3ZqbG9tbXR3eXp2cHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzE1NjYsImV4cCI6MjA5NjA0NzU2Nn0.HllimI-r8jKob67JvB81tfDn4HsUsc6Zx710tcVGaSw';

const headers = {
  'apikey': SUPABASE_ANON,
  'Authorization': `Bearer ${SUPABASE_ANON}`,
  'Content-Type': 'application/json'
};

let reviews = [];

// ── Fetch reviews from Supabase ──
async function fetchReviews() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reviews?approved=eq.true&order=created_at.desc`, { headers });
    if (!res.ok) return;
    reviews = await res.json();
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
  if (reviews.length === 0) return;

  const review = reviews[Math.floor(Math.random() * reviews.length)];
  const pill = document.createElement('div');
  pill.className = 'float-pill';

  // Random horizontal position (avoid center 30%)
  const side = Math.random() < 0.5 ? 'left' : 'right';
  let left;
  if (side === 'left') {
    left = Math.random() * 32; // 0–32%
  } else {
    left = 58 + Math.random() * 32; // 58–90%
  }

  // Random vertical start (bottom half, float up)
  const startY = 55 + Math.random() * 40; // 55–95% from top
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
  if (reviews.length === 0) return;
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
