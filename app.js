const API_URL = 'http://localhost:8000';
const el = (id) => document.getElementById(id);
const TOKEN = () => localStorage.getItem('inex_token');

async function api(path, opts = {}) {
const headers = { 'Content-Type': 'application/json' };
if (TOKEN()) headers['Authorization'] = Bearer ${TOKEN()}; const res = await fetch(``${API_URL}${path}`, { ...opts, headers });
return { ok: res.ok, data: await res.json().catch(() => null) };
}

document.addEventListener('DOMContentLoaded', () => {
// ... [ Garde tout le code de navigation, auth, carrousel, etc. de ton ancien app.js ] ...

// 💡 NOUVEAU : Logique Pixabay
window.chercherImagePixabay = async () => {
const q = el('pixabay-query').value;
if (!q) return;
const zone = el('pixabay-results');
zone.innerHTML = "Recherche...";

const { ok, data } = await api(/api/media/pixabay?q=${encodeURIComponent(q)}); if (ok && data.images.length &gt; 0) { zone.innerHTML = data.images.map(url =&gt;
<img src=" {url}')"
onmouseover="this.style.borderColor='#00b4d8'"
onmouseout="this.style.borderColor='transparent'">
`).join('');
} else {
zone.innerHTML = "<span style='color: #e63946; font-size: 0.85rem;'>Aucune image trouvée.</span>";
}
};

window.selectionnerImage = (url) => {
el('ads-url').value = url; // Remplit l'URL automatiquement
alert("✅ Image sélectionnée !");
};
});

function afficherEspaceMembre(data) {
el('zone-auth').hidden = true;
el('vue-accueil').style.display = 'none';
el('vue-plateforme').hidden = true;
el('vue-membre').hidden = false;

// 💡 SÉCURITÉ : Gemini (carte-core) n'apparaît QUE pour l'admin
if (data.is_core_admin) {
el('carte-core').hidden = false;
chargerDashboard();
} else {
el('carte-core').hidden = true; // Caché pour les utilisateurs normaux
}
}
