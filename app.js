const API_URL = 'https://ton-url-render.onrender.com'; // À changer à la mise en ligne
const el = (id) => document.getElementById(id);
const TOKEN = () => localStorage.getItem('inex_token');
const IS_ADMIN = () => localStorage.getItem('inex_admin') === 'true';

// --- GESTION IA & VOCALE ---
let actionEnAttenteId = null;
const btnVoice = el('btn-toggle-voice');
let recognition = null;

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.onresult = (event) => {
        el('ai-input').value = event.results[0][0].transcript;
        envoyerIA();
    };
    btnVoice.onclick = () => { recognition.start(); btnVoice.innerText = "🔴 Écoute..."; };
}

async function envoyerIA() {
    const msg = el('ai-input').value;
    if (!msg) return;
    el('ai-chat-zone').innerHTML += `<div style="color:gold;">👤 ${msg}</div>`;
    el('ai-input').value = '';

    const res = await fetch(`${API_URL}/api/core/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN()}` },
        body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    
    el('ai-chat-zone').innerHTML += `<div style="color:cyan;">🤖 ${data.texte}</div>`;
    
    if (data.action === "demande_validation") {
        actionEnAttenteId = data.action_id;
        el('ai-confirm-zone').hidden = false;
    }
}

async function confirmerActionIA(confirmer) {
    el('ai-confirm-zone').hidden = true;
    const res = await fetch(`${API_URL}/api/core/ai/confirmer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN()}` },
        body: JSON.stringify({ action_id: actionEnAttenteId, confirmer: confirmer })
    });
    const data = await res.json();
    el('ai-chat-zone').innerHTML += `<div style="color:green;">🤖 ${data.message}</div>`;
    if(confirmer) chargerDashboard();
}

// --- GRAPHIQUE CHART.JS ---
async function chargerDashboard() {
    const resGraph = await fetch(`${API_URL}/api/core/graphique-mensuel`, {
        headers: { 'Authorization': `Bearer ${TOKEN()}` }
    });
    if(resGraph.ok) {
        const data = await resGraph.json();
        new Chart(el('chartRevenus'), {
            type: 'bar',
            data: {
                labels: data.map(d => d.mois),
                datasets: [{ label: 'Frais perçus ($)', data: data.map(d => d.montant), backgroundColor: '#00b4d8' }]
            }
        });
    }
}

// --- AUTH & NAVIGATION ---
el('btn-utilisateur').onclick = () => {
    if (TOKEN()) {
        el('vue-accueil').style.display = 'none';
        el('vue-membre').hidden = false;
        if (IS_ADMIN()) {
            el('carte-core').hidden = false;
            chargerDashboard();
        }
    } else {
        el('zone-auth').hidden = false;
    }
};
