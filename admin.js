const SUPABASE_URL = 'https://ymdchsvjlommtwyzvpyy.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZGNoc3ZqbG9tbXR3eXp2cHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzE1NjYsImV4cCI6MjA5NjA0NzU2Nn0.HllimI-r8jKob67JvB81tfDn4HsUsc6Zx710tcVGaSw';
const EDGE_DELETE_URL = 'https://ymdchsvjlommtwyzvpyy.supabase.co/functions/v1/clever-action';
const ADMIN_PASSWORD = 'Luk$p13#2026';

const headers = {
  'apikey': SUPABASE_ANON,
  'Authorization': `Bearer ${SUPABASE_ANON}`,
  'Content-Type': 'application/json'
};

// -- Login --
function tryLogin() {
  const pass = document.getElementById('admin-pass').value;
  if (pass === ADMIN_PASSWORD) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadReviews();
  } else {
    document.getElementById('login-error').classList.remove('hidden');
    document.getElementById('admin-pass').value = '';
    document.getElementById('admin-pass').focus();
  }
}

document.getElementById('admin-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') tryLogin();
});

// -- Load reviews --
async function loadReviews() {
  const tbody = document.getElementById('reviews-tbody');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--muted); padding: 2rem;">Nacitavam...</td></tr>`;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reviews?order=created_at.desc`, { headers });
    const data = await res.json();

    updateStats(data);

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--muted); padding: 2rem;">Ziadne spravy.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(r => `
      <tr>
        <td style="color: var(--muted)">${r.id}</td>
        <td><strong>${escapeHtml(r.name)}</strong></td>
        <td style="max-width: 260px; line-height:1.5">${escapeHtml(r.comment)}</td>
        <td style="color: var(--muted); white-space: nowrap">${formatDate(r.created_at)}</td>
        <td>
          <span class="badge ${r.approved ? 'badge-approved' : 'badge-hidden'}">
            ${r.approved ? 'viditelne' : 'skryte'}
          </span>
        </td>
        <td style="white-space: nowrap; display: flex; gap: 6px;">
          <button class="action-btn" onclick="toggleApproved(${r.id}, ${r.approved})">
            ${r.approved ? 'skryt' : 'zobrazit'}
          </button>
          <button class="action-btn danger" onclick="deleteReview(${r.id})">zmazat</button>
        </td>
      </tr>
    `).join('');

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #ef4444; padding: 2rem;">Chyba pri nacitani.</td></tr>`;
    console.error(e);
  }
}

// -- Stats --
function updateStats(data) {
  const today = new Date().toDateString();
  const todayCount = data.filter(r => new Date(r.created_at).toDateString() === today).length;
  const approvedCount = data.filter(r => r.approved).length;

  document.getElementById('stat-total').textContent = data.length;
  document.getElementById('stat-today').textContent = todayCount;
  document.getElementById('stat-approved').textContent = approvedCount;
}

// -- Toggle approved --
async function toggleApproved(id, current) {
  await fetch(`${SUPABASE_URL}/rest/v1/reviews?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ approved: !current })
  });
  loadReviews();
}

// -- Delete via Edge Function --
async function deleteReview(id) {
  if (!confirm('Naozaj zmazat tuto spravu?')) return;
  try {
    const res = await fetch(EDGE_DELETE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password: ADMIN_PASSWORD })
    });
    const data = await res.json();
    if (data.success) {
      loadReviews();
    } else {
      alert('Chyba pri mazani: ' + (data.error || 'unknown'));
    }
  } catch (e) {
    console.error('Delete error:', e);
    alert('Chyba pri mazani.');
  }
}

// -- Helpers --
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
