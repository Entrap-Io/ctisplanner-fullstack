// Utility helper functions

const gc = (id) => courses.find(c => c.id === id);
const gisc = (id) => ISCAT.find(c => c.id === id);
const gp = (id) => profs.find(p => p.id === id);
const profName = (id) => { const p = gp(id); return p ? p.name : id; };
const initials = (n) => n.split(' ').filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join('');
const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const uid = () => `c${Date.now()}${Math.floor(Math.random()*999)}`;

function toast(msg, type='ok') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
