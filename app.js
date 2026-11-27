/* INEXAPPS — frontend (index.html + styles.css + app.js). Aucune clé secrète ici : tout passe par l'API. */
'use strict';

// ======================================================================== Configuration
const API_BASE = window.INEX_API_URL || 'https://inexapps-backend-g3a5.onrender.com';
const API = API_BASE + '/api';
const $ = (id) => document.getElementById(id);
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } },
  del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};
const state = { mode: null, profil: 'particulier', user: null, acces: {}, espaces: [], paypal: false, tab: null };

// ======================================================================== Utilitaires DOM sûrs (pas d'innerHTML sur données)
function h(tag, attrs, ...enfants) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of enfants.flat()) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}
const vider = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
function toast(msg, erreur) {
  const t = $('toast');
  t.textContent = msg; t.className = 'toast' + (erreur ? ' err' : ''); t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 4200);
}
const fmtDate = (d) => { try { return new Date(d).toLocaleString(); } catch (e) { return d || ''; } };
const usd = (n) => (Number(n) || 0).toFixed(2) + ' $';

// ======================================================================== API
const TOKEN = () => store.get('inex_token');
async function api(path, opts = {}) {
  const headers = {};
  if (TOKEN()) headers.Authorization = 'Bearer ' + TOKEN();
  let body;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.body); }
  try {
    const res = await fetch(API + path, { method: opts.method || (body ? 'POST' : 'GET'), headers, body });
    const data = await res.json().catch(() => null);
    if (res.status === 401 && TOKEN() && !opts.silencieux) { deconnecter(true); }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { detail: 'Serveur injoignable. Réessayez dans un instant.' } };
  }
}
function erreur(r) {
  const d = r.data && r.data.detail;
  if (Array.isArray(d)) return d.map((x) => x.msg).join(' ; ');
  return d || 'Une erreur est survenue.';
}
async function action(r, succes) {            // affiche toast succès/erreur
  if (r.ok) { toast((r.data && (r.data.message || r.data.resultat)) || succes || 'OK'); return true; }
  toast(erreur(r), true); return false;
}

// ======================================================================== Traductions (FR par défaut)
const T = {
  fr: { slogan: "Un monde d'opportunités en un clic", visiteur: 'VISITEUR', visiteur_desc: 'Accéder à la plateforme en tant que visiteur', utilisateur: 'UTILISATEUR', utilisateur_desc: 'Accéder à son espace personnel', retour: 'Retour', bienvenue: 'Bienvenue sur INEXAPPS', vous_etes: 'Vous êtes :', particulier: 'Particulier', entreprise: 'Entreprise', connexion_inscription: 'Connexion / Inscription', sinscrire: "S'inscrire", seconnecter: 'Se connecter', creer_compte: 'Créer mon compte', me_connecter: 'Me connecter', slogan_fam: "VIVEZ L'EXPÉRIENCE UNIQUE AVEC INEXAPPS LA GRANDE FAMILLE", conformite: "L'AUTHENTIFICATION, CERTIFICATION ET CERTIFICATION+ LEUR AUTHENTICITÉ N'EST VÉRIFIABLE QUE DANS INEXAPPS POUR DES RAISONS DE CONFORMITÉ ET DE NON FRAUDE.", categories: 'Catégories de services', tarifs: 'Tarifs applicables', mon_espace: 'Mon Espace', deconnexion: 'Déconnexion', profil: 'Profil',
    e_trust: 'INEX TRUST', d_trust: 'Identité et confiance', e_ads: 'INEX ADS', d_ads: 'Publicité et visibilité', e_business: 'INEX BUSINESS', d_business: 'Répertoire commercial', e_community: 'INEX COMMUNITY', d_community: 'Réseau des membres', e_opportunity: 'INEX OPPORTUNITY', d_opportunity: "Opportunités d'affaires", e_group: 'INEX GROUP', d_group: 'Opérations collectives', e_partnership: 'INEX PARTNERSHIP', d_partnership: 'Partenariats commerciaux', e_mediation: 'INEX MEDIATION', d_mediation: 'Facilitation des différends' },
  en: { slogan: 'A world of opportunities in one click', visiteur: 'VISITOR', visiteur_desc: 'Access the platform as a visitor', utilisateur: 'USER', utilisateur_desc: 'Access your personal space', retour: 'Back', bienvenue: 'Welcome to INEXAPPS', vous_etes: 'You are:', particulier: 'Individual', entreprise: 'Company', connexion_inscription: 'Log in / Sign up', sinscrire: 'Sign up', seconnecter: 'Log in', creer_compte: 'Create my account', me_connecter: 'Log in', slogan_fam: 'LIVE THE UNIQUE EXPERIENCE WITH INEXAPPS, THE BIG FAMILY', conformite: 'AUTHENTICATION, CERTIFICATION AND CERTIFICATION+ CAN ONLY BE VERIFIED INSIDE INEXAPPS, FOR COMPLIANCE AND ANTI-FRAUD REASONS.', categories: 'Service categories', tarifs: 'Applicable pricing', mon_espace: 'My Space', deconnexion: 'Log out', profil: 'Profile',
    d_trust: 'Identity and trust', d_ads: 'Advertising and visibility', d_business: 'Business directory', d_community: 'Member network', d_opportunity: 'Business opportunities', d_group: 'Collective operations', d_partnership: 'Business partnerships', d_mediation: 'Dispute facilitation' },
  ar: { slogan: 'عالم من الفرص بنقرة واحدة', visiteur: 'زائر', visiteur_desc: 'الدخول إلى المنصة كزائر', utilisateur: 'مستخدم', utilisateur_desc: 'الدخول إلى مساحتك الشخصية', retour: 'رجوع', bienvenue: 'مرحباً بكم في INEXAPPS', vous_etes: 'أنت:', particulier: 'فرد', entreprise: 'شركة', connexion_inscription: 'تسجيل الدخول / التسجيل', sinscrire: 'إنشاء حساب', seconnecter: 'تسجيل الدخول', creer_compte: 'إنشاء حسابي', me_connecter: 'دخول', slogan_fam: 'عيشوا التجربة الفريدة مع INEXAPPS العائلة الكبيرة', conformite: 'لا يمكن التحقق من المصادقة والتوثيق والتوثيق+ إلا داخل INEXAPPS لأسباب الامتثال ومكافحة الاحتيال.', categories: 'فئات الخدمات', tarifs: 'الأسعار المطبقة', mon_espace: 'مساحتي', deconnexion: 'خروج', profil: 'الملف الشخصي',
    d_trust: 'الهوية والثقة', d_ads: 'الإعلان والظهور', d_business: 'الدليل التجاري', d_community: 'شبكة الأعضاء', d_opportunity: 'فرص الأعمال', d_group: 'العمليات الجماعية', d_partnership: 'الشراكات التجارية', d_mediation: 'تسهيل النزاعات' },
  zh: { slogan: '一键开启机遇世界', visiteur: '访客', visiteur_desc: '以访客身份进入平台', utilisateur: '用户', utilisateur_desc: '进入个人空间', retour: '返回', bienvenue: '欢迎来到 INEXAPPS', vous_etes: '您是：', particulier: '个人', entreprise: '企业', connexion_inscription: '登录 / 注册', sinscrire: '注册', seconnecter: '登录', creer_compte: '创建账户', me_connecter: '登录', slogan_fam: '与 INEXAPPS 大家庭共享独特体验', conformite: '出于合规与防欺诈的原因，认证、证书及证书+ 的真实性只能在 INEXAPPS 内验证。', categories: '服务类别', tarifs: '适用资费', mon_espace: '我的空间', deconnexion: '退出', profil: '个人资料',
    d_trust: '身份与信任', d_ads: '广告与曝光', d_business: '商业名录', d_community: '会员网络', d_opportunity: '商业机会', d_group: '集体行动', d_partnership: '商业合作', d_mediation: '纠纷调解' },
  es: { slogan: 'Un mundo de oportunidades en un clic', visiteur: 'VISITANTE', visiteur_desc: 'Acceder a la plataforma como visitante', utilisateur: 'USUARIO', utilisateur_desc: 'Acceder a su espacio personal', retour: 'Volver', bienvenue: 'Bienvenido a INEXAPPS', vous_etes: 'Usted es:', particulier: 'Particular', entreprise: 'Empresa', connexion_inscription: 'Iniciar sesión / Registrarse', sinscrire: 'Registrarse', seconnecter: 'Iniciar sesión', creer_compte: 'Crear mi cuenta', me_connecter: 'Entrar', slogan_fam: 'VIVA LA EXPERIENCIA ÚNICA CON INEXAPPS, LA GRAN FAMILIA', conformite: 'LA AUTENTICACIÓN, CERTIFICACIÓN Y CERTIFICACIÓN+ SOLO SE PUEDEN VERIFICAR EN INEXAPPS POR RAZONES DE CUMPLIMIENTO Y ANTIFRAUDE.', categories: 'Categorías de servicios', tarifs: 'Tarifas aplicables', mon_espace: 'Mi Espacio', deconnexion: 'Cerrar sesión', profil: 'Perfil',
    d_trust: 'Identidad y confianza', d_ads: 'Publicidad y visibilidad', d_business: 'Directorio comercial', d_community: 'Red de miembros', d_opportunity: 'Oportunidades de negocio', d_group: 'Operaciones colectivas', d_partnership: 'Alianzas comerciales', d_mediation: 'Facilitación de disputas' },
};
let langue = store.get('inex_lang') || 'fr';
const t = (k) => (T[langue] && T[langue][k]) || T.fr[k] || k;
function appliquerLangue() {
  document.documentElement.lang = langue;
  document.body.dir = langue === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $('select-langue').value = langue;
  if (state.user) afficherGrilleEspaces();
  if (!$('vue-plateforme').hidden) afficherVisiteur();
}

// ======================================================================== Départements INEX
const ICONES = {
  trust: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  ads: '<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  business: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  community: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  opportunity: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/>',
  group: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  partnership: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M8 11h8M12 7v8"/>',
  mediation: '<path d="M12 3v18M3 7h18"/><path d="M6 7l-3 6h6L6 7zM18 7l-3 6h6l-3-6z"/>',
  core: '<path d="M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6l9-4z"/><circle cx="12" cy="11" r="3"/>',
};
const ESPACES = ['trust', 'ads', 'business', 'community', 'opportunity', 'group', 'partnership', 'mediation'];
function svgIcone(cle, couleur) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', couleur || '#00b4d8');
  s.setAttribute('stroke-width', '2'); s.setAttribute('class', 'icone-espace');
  s.innerHTML = ICONES[cle]; // contenu constant défini ci-dessus (jamais de données utilisateur)
  return s;
}
function carteEspace(cle, onclick, extra) {
  const nom = cle === 'core' ? 'INEX CORE' : t('e_' + cle);
  const carte = h('div', { class: 'carte-espace' + (cle === 'core' ? ' core' : '') + (onclick ? '' : ' statique'), onclick },
    svgIcone(cle, cle === 'core' ? '#e63946' : null), h('h3', {}, nom),
    h('p', {}, cle === 'core' ? 'Administration, finances, Gemini' : t('d_' + cle)));
  if (extra) carte.append(extra);
  return carte;
}

// ======================================================================== Navigation
const VUES = ['vue-accueil', 'vue-pub', 'vue-plateforme', 'vue-membre', 'vue-verif'];
function montrer(id) {
  VUES.forEach((v) => { const e = $(v); if (e) { if (v === 'vue-accueil') e.style.display = v === id ? '' : 'none'; else e.hidden = v !== id; } });
  $('zone-auth').hidden = true;
  if (id !== 'vue-pub') arreterCarrousel();
  window.scrollTo(0, 0);
}

// ======================================================================== Panneau publicitaire : 3 images collées qui défilent
const carrousel = { timer: null, cur: 0, ads: [], vus: new Set() };
function placeholder(i) {
  const couleurs = [['#0b3d91', '#00b4d8'], ['#3a0ca3', '#7209b7'], ['#0a6e4f', '#4ade80'], ['#7a4a00', '#d4af37'], ['#6b0f1a', '#e63946']];
  const [a, b] = couleurs[i % couleurs.length];
  const textes = ['Votre publicité ici', 'INEX ADS', 'Visibilité mondiale', 'Faites-vous connaître', 'Un monde d’opportunités'];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="640" height="400" fill="url(#g)"/><text x="320" y="215" font-family="Arial" font-size="44" font-weight="700" fill="#fff" text-anchor="middle">${textes[i % 5]}</text></svg>`;
  return { id: null, titre: textes[i % 5], media_url: 'data:image/svg+xml;utf8,' + encodeURIComponent(svg), badge: 'PUB' };
}
async function demarrerCarrousel() {
  const panneau = vider($('panneau-pub'));
  const r = await api('/ads/publiques', { silencieux: true });
  const ads = r.ok && Array.isArray(r.data) ? r.data.slice() : [];
  const base = ads.slice();
  for (let i = 0; ads.length < 5; i++) ads.push(base.length ? { ...base[i % base.length] } : placeholder(i));   // anneau d'au moins 5 images
  carrousel.ads = ads; carrousel.cur = 0; carrousel.vus.clear();
  ads.forEach((ad, i) => {
    const media = /\.(mp4|webm)(\?|$)/i.test(ad.media_url)
      ? h('video', { src: ad.media_url, muted: true, autoplay: true, loop: true, playsinline: true })
      : h('img', { src: ad.media_url, alt: ad.titre || '', loading: 'lazy' });
    panneau.append(h('div', { class: 'pub-carte', 'data-i': i, onclick: () => clicPub(ad) }, media,
      h('span', { class: 'badge-pub' }, ad.badge || 'PUB'), h('div', { class: 'legende' }, ad.titre || '')));
  });
  placerCartes();
  arreterCarrousel();
  carrousel.timer = setInterval(() => { carrousel.cur = (carrousel.cur + 1) % carrousel.ads.length; placerCartes(); }, 3000);
}
function placerCartes() {
  const n = carrousel.ads.length;
  document.querySelectorAll('#panneau-pub .pub-carte').forEach((c) => {
    const i = Number(c.dataset.i);
    const rel = (i - carrousel.cur + n) % n;
    let s = rel > n / 2 ? rel - n : rel;           // -2..2 : gauche-hors, gauche, centre, droite, droite-hors
    s = Math.max(-2, Math.min(2, s));
    // L'image du centre (agrandie) est affichée en position 0 : on mappe s=0 → centre
    c.dataset.pos = String(s);
  });
  const ad = carrousel.ads[carrousel.cur];
  if (ad && ad.id && !carrousel.vus.has(ad.id)) { carrousel.vus.add(ad.id); api('/ads/' + ad.id + '/vue', { method: 'POST', silencieux: true }); }
}
function arreterCarrousel() { if (carrousel.timer) { clearInterval(carrousel.timer); carrousel.timer = null; } }
async function clicPub(ad) {
  if (!ad.id) return;
  const r = await api('/ads/' + ad.id + '/clic', { method: 'POST', silencieux: true });
  if (r.ok && r.data && r.data.lien && /^https?:\/\//.test(r.data.lien)) window.open(r.data.lien, '_blank', 'noopener');
}
async function chargerAnnonces() {
  const zone = vider($('bandeau-annonces'));
  const r = await api('/public/annonces', { silencieux: true });
  if (r.ok) r.data.slice(0, 2).forEach((a) => zone.append(h('div', { class: 'annonce' }, h('b', {}, a.titre + ' — '), a.contenu)));
}

// ======================================================================== Visiteur
async function afficherVisiteur() {
  const ap = vider($('avant-propos'));
  ap.append(h('h3', {}, 'INEXAPPS — ' + (state.profil === 'entreprise' ? t('entreprise') : t('particulier'))),
    h('p', {}, 'INEXAPPS est une plateforme d’identification, de mise en relation et d’opportunités commerciales. En visiteur, vous découvrez les services ; les actions réservées aux membres demandent un compte. L’IC est un indicateur d’informations examinées : ce n’est pas une garantie.'));
  const g = vider($('grille-publique'));
  ESPACES.forEach((e) => g.append(carteEspace(e, null)));
  const r = await api('/finance/tarifs?profile_type=' + state.profil, { silencieux: true });
  const z = vider($('tarifs-visiteur'));
  if (r.ok && r.data.length) {
    z.append(h('div', { class: 'defilant-x' }, h('table', { class: 'tableau' },
      h('thead', {}, h('tr', {}, ['Service', 'Libellé', 'USD', 'XAF'].map((x) => h('th', {}, x)))),
      h('tbody', {}, r.data.map((x) => h('tr', {}, h('td', {}, x.espace.toUpperCase()), h('td', {}, x.libelle), h('td', {}, x.prix_usd), h('td', {}, x.prix_xaf)))))));
  } else z.append(h('p', { class: 'petit' }, 'Tarifs communiqués prochainement. Aucun tarif n’est affiché tant qu’il n’est pas officiellement défini.'));
}

// ======================================================================== Authentification
function ouvrirAuth(onglet) {
  $('zone-auth').hidden = false; $('message-auth').textContent = '';
  $('auth-profil-info').textContent = (state.profil === 'entreprise' ? t('entreprise') : t('particulier'));
  basculerAuth(onglet || 'inscription');
}
function basculerAuth(o) {
  $('form-inscription').hidden = o !== 'inscription'; $('form-connexion').hidden = o !== 'connexion'; $('form-oubli').hidden = o !== 'oubli';
  $('tab-inscription').classList.toggle('onglet-actif', o === 'inscription'); $('tab-connexion').classList.toggle('onglet-actif', o === 'connexion');
}
async function apresConnexion(data) {
  store.set('inex_token', data.access_token);
  state.user = data.user;
  if (state.user.langue && !store.get('inex_lang')) { langue = state.user.langue; }
  await ouvrirMonEspace();
}
async function ouvrirMonEspace() {
  if (!state.user) {
    const r = await api('/auth/moi', { silencieux: true });
    if (!r.ok) { store.del('inex_token'); return false; }
    state.user = r.data;
  }
  const cfg = await api('/finance/config', { silencieux: true });
  state.paypal = !!(cfg.ok && cfg.data.paypal);
  montrer('vue-membre');
  appliquerLangue();
  await afficherGrilleEspaces();
  majAlerteEmail(); majNotifs();
  clearInterval(ouvrirMonEspace._n); ouvrirMonEspace._n = setInterval(majNotifs, 60000);
  retourPayPal();
  return true;
}
function deconnecter(silencieux) {
  store.del('inex_token'); state.user = null; clearInterval(ouvrirMonEspace._n);
  $('panneau-profil').hidden = true; $('panneau-notif').hidden = true;
  vider($('contenu-espace')); $('vue-espace').hidden = true;
  montrer('vue-accueil');
  if (!silencieux) toast('Déconnecté.');
}

// ======================================================================== Mon espace
async function afficherGrilleEspaces() {
  $('vue-espace').hidden = true; $('grille-espaces').hidden = false;
  const r = await api('/finance/mes-espaces', { silencieux: true });
  state.acces = {};
  if (r.ok) r.data.forEach((e) => { state.acces[e.espace] = e; });
  const g = vider($('grille-espaces'));
  ESPACES.forEach((e) => {
    const info = state.acces[e];
    const verrou = info && !info.acces ? h('div', { class: 'verrou' }, '🔒 Abonnement requis') : null;
    g.append(carteEspace(e, () => ouvrirEspace(e), verrou));
  });
  if (state.user && state.user.is_core_admin) g.append(carteEspace('core', () => ouvrirCore()));
}
function majAlerteEmail() {
  const z = vider($('alerte-email'));
  if (!state.user || state.user.email_verifie || state.user.is_core_admin) { z.hidden = true; return; }
  z.hidden = false;
  const input = h('input', { placeholder: 'Code à 6 chiffres', inputmode: 'numeric' });
  z.append(h('strong', {}, 'Vérifiez votre e-mail (' + state.user.email + ')'), h('p', { class: 'petit' }, 'Un code vous a été envoyé. La vérification renforce votre dossier TRUST.'),
    h('div', { class: 'rangee' }, input,
      h('button', { class: 'bouton-principal bouton-petit', onclick: async () => { const r = await api('/auth/verifier-email', { body: { code: input.value } }); if (await action(r)) { state.user.email_verifie = true; majAlerteEmail(); } } }, 'Valider'),
      h('button', { class: 'bouton-secondaire-sombre bouton-petit', onclick: async () => action(await api('/auth/renvoyer-code', { method: 'POST' })) }, 'Renvoyer')));
}
async function ouvrirEspace(cle) {
  $('grille-espaces').hidden = true; $('vue-espace').hidden = false; window.scrollTo(0, 0);
  $('titre-espace').textContent = t('e_' + cle);
  const ban = vider($('bandeau-acces')); const c = vider($('contenu-espace'));
  const info = state.acces[cle];
  if (info && !info.acces) { ban.append(bandeauPaiement(cle, info)); return; }
  try { await PANNEAUX[cle](c); } catch (e) { c.append(h('p', { class: 'msg-erreur' }, 'Erreur d’affichage.')); }
}
function bandeauPaiement(cle, info) {
  const bloc = h('div', { class: 'carte-action alerte' }, h('h3', {}, '🔒 Accès ' + cle.toUpperCase()),
    h('p', {}, 'Un abonnement est requis pour utiliser ce département. Payer un espace n’ouvre pas les autres.'));
  info.tarifs.forEach((tf) => bloc.append(h('div', { class: 'item' }, h('h4', {}, tf.libelle),
    h('div', { class: 'meta' }, usd(tf.prix_usd) + ' ≈ ' + tf.prix_xaf + ' XAF' + (tf.duree_jours ? ' · ' + tf.duree_jours + ' jours' : '')),
    h('button', { class: 'bouton-principal bouton-petit', onclick: () => acheter(tf) }, 'Souscrire'))));
  return bloc;
}
async function acheter(tf) {
  const r = await api('/finance/acheter', { body: { tarif_id: tf.id } });
  if (!(await action(r))) return;
  if (r.data.gratuit) return afficherGrilleEspaces();
  proposerPaiement(r.data.facture_id, r.data.montant_usd, r.data.montant_xaf);
}
function proposerPaiement(factureId, montantUsd, montantXaf) {
  const c = vider($('bandeau-acces'));
  const bloc = h('div', { class: 'carte-action alerte' }, h('h3', {}, 'Paiement'), h('p', {}, 'Montant : ' + usd(montantUsd) + ' (≈ ' + montantXaf + ' XAF au taux fixe INEX).'));
  if (state.paypal) bloc.append(h('button', { class: 'bouton-principal', onclick: async () => {
    const r = await api('/finance/paypal/creer', { body: { facture_id: factureId, retour: location.origin } });
    if (r.ok && r.data.approve_url) { store.set('inex_pp', r.data.order_id); location.href = r.data.approve_url; } else toast(erreur(r), true);
  } }, 'Payer avec PayPal'));
  bloc.append(h('p', { class: 'petit' }, 'Airtel Money / Moov Money / UBA : effectuez le paiement puis conservez votre référence. Vos droits s’activent dès que l’équipe INEX confirme la réception (une capture d’écran seule ne suffit pas).'));
  c.append(bloc);
}
async function retourPayPal() {
  const p = new URLSearchParams(location.search);
  if (p.get('paypal') !== 'ok') return;
  const order = p.get('token') || store.get('inex_pp');
  history.replaceState({}, '', location.pathname);
  if (!order) return;
  const r = await api('/finance/paypal/capturer', { body: { order_id: order } });
  store.del('inex_pp');
  await action(r); afficherGrilleEspaces();
}

// ======================================================================== Notifications & profil
async function majNotifs() {
  const r = await api('/profil/notifications', { silencieux: true });
  if (!r.ok) return;
  state.notifs = r.data;
  $('badge-notif').hidden = !r.data.non_lues; $('badge-notif').textContent = r.data.non_lues;
}
async function ouvrirNotifs() {
  const p = $('panneau-notif');
  if (!p.hidden) { p.hidden = true; return; }
  await majNotifs(); vider(p); p.hidden = false;
  const items = (state.notifs && state.notifs.items) || [];
  if (!items.length) p.append(h('p', { class: 'petit' }, 'Aucune notification.'));
  items.forEach((n) => p.append(h('div', { class: 'item' }, h('h4', {}, (n.lu ? '' : '● ') + n.titre), h('div', { class: 'meta' }, fmtDate(n.date)), h('p', {}, n.contenu))));
  api('/profil/notifications/lues', { method: 'POST', silencieux: true }).then(() => { $('badge-notif').hidden = true; });
}
async function ouvrirProfil() {
  const p = $('panneau-profil'); p.hidden = false;
  const c = vider($('contenu-profil')); const u = state.user;
  const act = await api('/profil/activite');
  const pubs = await api('/profil/mes-publications');
  const docs = await api('/profil/mes-documents');
  c.append(u.photo_url ? h('img', { class: 'avatar', src: u.photo_url, alt: '' }) : h('div', { class: 'avatar' }),
    h('p', { style: 'text-align:center' }, h('strong', {}, u.email), h('br'), h('span', { class: 'badge' }, u.profile_type), h('span', { class: 'badge ' + (u.statut_compte === 'utilisateur' ? 'ok' : 'att') }, u.statut_compte), u.email_verifie ? h('span', { class: 'badge ok' }, 'e-mail vérifié') : null));
  const photo = h('input', { type: 'file', accept: 'image/*' });
  c.append(h('h4', {}, 'Image de profil'), photo, h('button', { class: 'bouton-secondaire-sombre bouton-petit', onclick: async () => {
    if (!photo.files[0]) return;
    const f = new FormData(); f.append('fichier', photo.files[0]);
    const r = await api('/media/upload?kind=profil', { form: f });
    if (await action(r, 'Image mise à jour.')) { state.user.photo_url = r.data.url; ouvrirProfil(); }
  } }, 'Envoyer'));
  // Type de profil
  const just = h('input', { placeholder: 'Justification du changement' });
  const sel = h('select', {}, ['particulier', 'entreprise'].map((x) => h('option', { value: x, selected: x === u.profile_type }, x)));
  c.append(h('h4', {}, 'Type de profil'), sel, just, h('button', { class: 'bouton-secondaire-sombre bouton-petit', onclick: async () => {
    const r = await api('/profil/type', { method: 'PUT', body: { profile_type: sel.value, justification: just.value } });
    if (await action(r)) { state.user = r.data.user; afficherGrilleEspaces(); ouvrirProfil(); }
  } }, 'Changer'));
  // Statut visiteur / utilisateur
  const nouveau = u.statut_compte === 'utilisateur' ? 'visiteur' : 'utilisateur';
  c.append(h('h4', {}, 'Statut du compte'), h('button', { class: 'bouton-secondaire-sombre bouton-petit', onclick: async () => {
    const r = await api('/profil/statut', { method: 'PUT', body: { statut: nouveau } });
    if (await action(r)) { state.user = r.data.user; ouvrirProfil(); }
  } }, 'Passer en statut ' + nouveau));
  // Préférences
  const tel = h('input', { placeholder: 'Téléphone', value: u.telephone || '' });
  const notif = h('input', { type: 'checkbox', checked: u.pref_notifications, style: 'width:auto;margin-right:8px' });
  const vis = h('input', { type: 'checkbox', checked: u.profil_visible, style: 'width:auto;margin-right:8px' });
  c.append(h('h4', {}, 'Préférences'), tel, h('label', {}, notif, 'Notifications'), h('br'), h('label', {}, vis, 'Profil visible dans les répertoires'), h('br'),
    h('button', { class: 'bouton-secondaire-sombre bouton-petit', onclick: async () => {
      const r = await api('/profil/preferences', { method: 'PUT', body: { telephone: tel.value, pref_notifications: notif.checked, profil_visible: vis.checked, langue } });
      if (r.ok) { state.user = r.data.user; toast('Préférences enregistrées.'); } else toast(erreur(r), true);
    } }, 'Enregistrer'));
  // Mot de passe
  const a = h('input', { type: 'password', placeholder: 'Ancien mot de passe' }); const n = h('input', { type: 'password', placeholder: 'Nouveau (10 car. min)' });
  c.append(h('h4', {}, 'Sécurité'), a, n, h('button', { class: 'bouton-secondaire-sombre bouton-petit', onclick: async () => action(await api('/profil/mot-de-passe', { method: 'PUT', body: { ancien: a.value, nouveau: n.value } })) }, 'Changer le mot de passe'));
  // Documents / publications / activité
  c.append(h('h4', {}, 'Mes documents'));
  if (docs.ok && docs.data.authentification) c.append(h('button', { class: 'bouton-secondaire-sombre bouton-petit', onclick: () => ouvrirFiche('authentification') }, 'Fiche d’authentification'));
  if (docs.ok && docs.data.certification) c.append(' ', h('button', { class: 'bouton-secondaire-sombre bouton-petit', onclick: () => ouvrirFiche('certification') }, 'Fiche de certification'));
  c.append(h('h4', {}, 'Mes publications'));
  if (pubs.ok && pubs.data.length) pubs.data.forEach((x) => c.append(h('div', { class: 'item' }, h('strong', {}, x.titre), ' ', h('span', { class: 'badge' }, x.statut), h('div', { class: 'meta' }, x.impressions + ' vues · ' + x.clics + ' clics'))));
  else c.append(h('p', { class: 'petit' }, 'Aucune publicité.'));
  c.append(h('h4', {}, 'Activité & factures'));
  if (act.ok) {
    act.data.abonnements.forEach((x) => c.append(h('div', { class: 'meta' }, '✔ ' + x.espace.toUpperCase() + ' — ' + x.statut + (x.fin ? ' jusqu’au ' + fmtDate(x.fin) : ''))));
    act.data.factures.forEach((f) => c.append(h('div', { class: 'meta' }, f.reference + ' · ' + usd(f.montant) + ' · ' + f.statut)));
  }
}
async function ouvrirFiche(type) {            // récupère la fiche avec le jeton puis l'ouvre dans un nouvel onglet
  const res = await fetch(API + '/trust/fiche/' + type, { headers: { Authorization: 'Bearer ' + TOKEN() } });
  if (!res.ok) { toast('Fiche indisponible.', true); return; }
  const blob = new Blob([await res.text()], { type: 'text/html' });
  window.open(URL.createObjectURL(blob), '_blank', 'noopener');
}

// ======================================================================== Aides d'interface pour les départements
function inp(ph, o = {}) { return h(o.area ? 'textarea' : o.options ? 'select' : 'input', { placeholder: ph, type: o.type, value: o.val, min: o.min, step: o.step, required: o.req, maxlength: o.max, 'aria-label': ph }, o.options ? o.options.map((x) => h('option', { value: Array.isArray(x) ? x[0] : x, selected: (Array.isArray(x) ? x[0] : x) === o.val }, Array.isArray(x) ? x[1] : x)) : null); }
function carteBloc(titre, ...enfants) { return h('div', { class: 'carte-action' }, titre ? h('h3', {}, titre) : null, ...enfants); }
function btn(txt, fn, cls) { return h('button', { class: cls || 'bouton-principal bouton-petit', onclick: fn }, txt); }
function badge(txt, cls) { return h('span', { class: 'badge ' + (cls || '') }, txt); }
function btnSignaler(type, id) { return btn('Signaler', async () => { const m = prompt('Motif du signalement :'); if (m && m.trim().length > 2) action(await api('/community/signaler', { body: { cible_type: type, cible_id: id, motif: m } })); }, 'bouton-danger'); }
async function soumettre(e, fn) {            // verrouille le bouton pendant l'appel
  e.preventDefault();
  const b = e.submitter || e.target.querySelector('button[type=submit]');
  if (b) b.disabled = true;
  try { await fn(); } finally { if (b) b.disabled = false; }
}
function pixabayBloc(onChoix) {
  const q = inp('Ex : agriculture, business…'); const res = h('div', { class: 'pixabay-res' });
  return h('div', { class: 'item' }, h('div', { class: 'meta' }, '🔍 Image libre de droits (Pixabay) — ouvert à tous les utilisateurs'),
    h('div', { class: 'rangee' }, q, btn('Chercher', async () => {
      vider(res).append('Recherche…');
      const r = await api('/media/pixabay?q=' + encodeURIComponent(q.value));
      vider(res);
      if (r.ok && r.data.images.length) r.data.images.forEach((u) => res.append(h('img', { src: u, alt: '', onclick: () => { onChoix(u); toast('✅ Image sélectionnée'); } })));
      else res.append(h('span', { class: 'msg-erreur' }, r.ok ? 'Aucune image trouvée (clé Pixabay configurée ?).' : erreur(r)));
    })), res);
}
async function televerser(fichier, kind) {
  const f = new FormData(); f.append('fichier', fichier);
  return api('/media/upload?kind=' + kind, { form: f });
}
const rafraichir = (cle) => () => ouvrirEspace(cle);

// ======================================================================== INEX TRUST
async function panneauTrust(c) {
  const r = await api('/trust/mon-dossier', { silencieux: true });
  if (r.status === 404) {
    const f = { prenom: inp('Prénom', { req: true }), deux: inp('Deuxième nom (si votre état civil en comporte)'), fam: inp('Nom de famille', { req: true }), exact: inp('Exception : nom légal exact tel qu’écrit sur vos documents'), pays: inp('Pays') };
    c.append(carteBloc('Établir ma fiche d’identité IC', h('p', { class: 'petit' }, 'Indiquez votre nom légal tel qu’il figure sur vos documents. Si votre état civil ne comporte pas trois éléments, utilisez le champ « nom légal exact » : rien ne sera inventé.'),
      h('form', { onsubmit: (e) => soumettre(e, async () => { const r2 = await api('/trust/dossier', { body: { prenom: f.prenom.value, deuxieme_nom: f.deux.value || null, nom_famille: f.fam.value, nom_legal_exact: f.exact.value || null, pays: f.pays.value || null } }); if (await action(r2)) rafraichir('trust')(); }) },
        f.prenom, f.deux, f.fam, f.exact, f.pays, h('button', { class: 'bouton-principal', type: 'submit' }, 'Créer mon dossier'))));
    return;
  }
  const d = r.data;
  const cls = (e) => (e === 'verifie' ? 'ok' : ['refuse', 'incoherent', 'expire'].includes(e) ? 'ko' : 'att');
  c.append(carteBloc('Numéro INEX : ' + d.numero_inex, h('p', {}, h('strong', {}, d.nom_complet), ' ', badge('dossier : ' + d.statut), badge('certification : ' + d.statut_certification)),
    d.message_statut ? h('p', { class: 'msg-erreur' }, d.message_statut) : null,
    h('p', { class: 'petit' }, 'Score initial : ' + d.score_initial + '/100 (seuil d’admissibilité : ' + d.seuil + ')' + (d.score_final != null ? ' · Score global : ' + d.score_final + '/100' : '')),
    h('div', { class: 'barre-score' }, h('div', { style: 'width:' + Math.min(100, d.score_final != null ? d.score_final : d.score_initial) + '%' })),
    h('p', { class: 'petit' }, 'Le score est calculé automatiquement ; il reflète des éléments examinés à une date donnée et ne constitue pas une garantie.'),
    h('div', { class: 'rangee' },
      d.statut !== 'soumis' ? btn('Soumettre pour examen', async () => { if (await action(await api('/trust/soumettre', { method: 'POST' }))) rafraichir('trust')(); }) : badge('en cours d’examen (délai indicatif 36 h)', 'att'),
      d.reprise_possible ? btn('Reprise (unique)', async () => { if (await action(await api('/trust/reprise', { method: 'POST' }))) rafraichir('trust')(); }) : null,
      d.statut_certification === 'admissible' || d.statut_certification === 'non_certifie' ? btn('Demander la certification', async () => { if (await action(await api('/trust/demander-certification', { method: 'POST' }))) rafraichir('trust')(); }) : null,
      btn('Fiche d’authentification', () => ouvrirFiche('authentification'), 'bouton-secondaire-sombre bouton-petit'),
      ['demandee', 'certifie', 'non_certifie', 'suspendu', 'revoque'].includes(d.statut_certification) ? btn('Fiche de certification', () => ouvrirFiche('certification'), 'bouton-secondaire-sombre bouton-petit') : null,
      btn('Mon QR', async () => { const q = await api('/trust/mon-qr'); if (q.ok) { const z = $('zone-qr'); vider(z).append(h('img', { src: q.data.qr, alt: 'QR', width: 160 }), h('div', { class: 'petit' }, q.data.mention)); } }, 'bouton-secondaire-sombre bouton-petit')),
    h('div', { id: 'zone-qr', class: 'centre-texte' })));
  const liste = carteBloc('Critères et preuves');
  d.criteres.forEach((cr) => {
    const val = inp('Valeur / référence', { val: cr.valeur || '' }); const fichier = h('input', { type: 'file', accept: 'image/*,application/pdf' });
    const ferme = cr.etape === 'certification' && !['demandee', 'non_certifie'].includes(d.statut_certification);
    liste.append(h('div', { class: 'item' }, h('h4', {}, cr.libelle), h('div', { class: 'meta' }, badge(cr.etat.replace('_', ' '), cls(cr.etat)), badge(cr.etape), cr.commentaire ? ' ' + cr.commentaire : ''),
      cr.auto ? h('p', { class: 'petit' }, 'Renseigné automatiquement : ' + (cr.valeur || '—')) : ferme ? h('p', { class: 'petit' }, 'Disponible après demande de certification.') :
        h('div', {}, val, fichier, btn('Enregistrer', async () => {
          let preuve = null;
          if (fichier.files[0]) { const up = await televerser(fichier.files[0], 'preuve'); if (!up.ok) { toast(erreur(up), true); return; } preuve = up.data.url; }
          if (await action(await api('/trust/critere', { body: { code: cr.code, valeur: val.value, preuve_url: preuve } }))) rafraichir('trust')();
        }))));
  });
  c.append(liste);
}

// ======================================================================== INEX ADS
async function panneauAds(c) {
  const f = { titre: inp('Titre de la campagne', { req: true }), desc: inp('Description', { area: true }), url: inp('URL média (https://…)', { req: true }), lien: inp('Lien de destination (facultatif)'), zone: inp('Zone ciblée'), budget: inp('Budget USD', { type: 'number', min: 0, step: '0.01' }), duree: inp('Durée (jours)', { type: 'number', min: 1, val: '7' }) };
  const fich = h('input', { type: 'file', accept: 'image/*,video/mp4,video/webm' });
  let fichierId = null;
  c.append(carteBloc('Créer une campagne', pixabayBloc((u) => { f.url.value = u; }),
    h('div', { class: 'item' }, h('div', { class: 'meta' }, 'Ou importez votre fichier (image ou vidéo)'), fich, btn('Importer', async () => {
      if (!fich.files[0]) return; const r = await televerser(fich.files[0], 'pub');
      if (await action(r, 'Fichier importé.')) { f.url.value = r.data.url; fichierId = r.data.id; }
    })),
    h('form', { onsubmit: (e) => soumettre(e, async () => {
      const r = await api('/ads/campagnes', { body: { titre: f.titre.value, description: f.desc.value || null, media_url: f.url.value, fichier_id: fichierId, lien: f.lien.value || null, zone: f.zone.value || null, budget_usd: Number(f.budget.value) || 0, duree_jours: Number(f.duree.value) || 7 } });
      if (await action(r)) rafraichir('ads')();
    }) }, f.titre, f.desc, f.url, f.lien, f.zone, f.budget, f.duree, h('button', { class: 'bouton-principal', type: 'submit' }, 'Créer en brouillon'))));
  const r = await api('/ads/mes-campagnes');
  const l = carteBloc('Mes campagnes');
  (r.ok ? r.data : []).forEach((x) => l.append(h('div', { class: 'item' }, h('h4', {}, x.titre), h('div', { class: 'meta' }, badge(x.statut, x.statut === 'refusee' ? 'ko' : x.statut === 'approuvee' ? 'ok' : 'att'), x.impressions + ' vues · ' + x.clics + ' clics', x.motif_refus ? ' · ' + x.motif_refus : ''),
    h('div', { class: 'rangee' }, ['brouillon', 'refusee'].includes(x.statut) ? btn('Soumettre', async () => { if (await action(await api('/ads/campagnes/' + x.id + '/soumettre', { method: 'POST' }))) rafraichir('ads')(); }) : null,
      btn('Supprimer', async () => { if (confirm('Supprimer cette campagne ?') && await action(await api('/ads/campagnes/' + x.id, { method: 'DELETE' }))) rafraichir('ads')(); }, 'bouton-danger')))));
  if (!l.querySelector('.item')) l.append(h('p', { class: 'petit' }, 'Aucune campagne. La publication n’est jamais automatique : INEX CORE valide chaque campagne.'));
  c.append(l);
}

// ======================================================================== INEX BUSINESS
async function panneauBusiness(c) {
  const m = await api('/business/mon-profil'); const p = (m.ok && m.data) || {};
  const f = { nom: inp('Nom commercial', { req: true, val: p.nom_commercial || '' }), sect: inp('Secteur', { req: true, val: p.secteur || '' }), pays: inp('Pays', { val: p.pays || '' }), ville: inp('Ville', { val: p.ville || '' }),
    act: inp('Activité', { options: ['vendeur', 'acheteur', 'fournisseur', 'distributeur', 'prestataire', 'partenaire'], val: p.activite || 'vendeur' }), marche: inp('Marché', { options: [['local', 'Marché local'], ['international', 'Marché international'], ['les_deux', 'Les deux']], val: p.marche || 'local' }),
    prod: inp('Produits / services', { area: true, val: p.produits || '' }), desc: inp('Description', { area: true, val: p.description || '' }), mail: inp('E-mail de contact', { type: 'email', val: p.contact_email || '' }), web: inp('Site web', { val: p.site_web || '' }) };
  c.append(carteBloc(p.id ? 'Mon profil commercial' : 'Créer mon profil commercial', p.id ? h('p', {}, badge('statut IC : ' + p.statut_ic, p.statut_ic === 'valide' ? 'ok' : 'att')) : null,
    h('p', { class: 'petit' }, 'Figurer dans le répertoire ne vaut pas certification : le statut IC est affiché séparément.'),
    h('form', { onsubmit: (e) => soumettre(e, async () => { const r = await api('/business/profil', { body: { nom_commercial: f.nom.value, secteur: f.sect.value, pays: f.pays.value || null, ville: f.ville.value || null, activite: f.act.value, marche: f.marche.value, produits: f.prod.value || null, description: f.desc.value || null, contact_email: f.mail.value || null, site_web: f.web.value || null } }); if (await action(r)) rafraichir('business')(); }) },
      f.nom, f.sect, f.pays, f.ville, f.act, f.marche, f.prod, f.desc, f.mail, f.web, h('button', { class: 'bouton-principal', type: 'submit' }, 'Enregistrer'))));
  const q = inp('Rechercher (nom, produit…)'); const pays = inp('Pays'); const sect = inp('Secteur'); const mar = inp('Marché', { options: [['', 'Tous marchés'], ['local', 'Local'], ['international', 'International']] });
  const res = h('div');
  const chercher = async () => {
    vider(res); const r = await api('/business/repertoire?' + new URLSearchParams({ q: q.value, pays: pays.value, secteur: sect.value, marche: mar.value }));
    (r.ok ? r.data : []).forEach((b) => res.append(h('div', { class: 'item' }, h('h4', {}, b.nom_commercial), h('div', { class: 'meta' }, badge('IC : ' + b.statut_ic, b.statut_ic === 'valide' ? 'ok' : 'att'), b.secteur + ' · ' + (b.pays || '') + ' ' + (b.ville || '') + ' · ' + b.marche),
      h('p', {}, b.produits || b.description || ''), b.contact_email ? h('div', { class: 'petit' }, b.contact_email) : null,
      h('div', { class: 'rangee' }, btn('Contacter', async () => { const msg = prompt('Votre message :'); if (msg) action(await api('/business/' + b.id + '/contacter', { body: { contenu: msg } })); }), btnSignaler('business', b.id)))));
    if (!res.firstChild) res.append(h('p', { class: 'petit' }, 'Aucun résultat.'));
  };
  c.append(carteBloc('Répertoire commercial', h('div', { class: 'rangee' }, q, pays, sect, mar, btn('Chercher', chercher)), res));
  chercher();
}

// ======================================================================== INEX COMMUNITY
async function panneauCommunity(c) {
  const cat = inp('Catégorie / thème (facultatif)'); const txt = inp('Partagez une actualité…', { area: true, req: true });
  c.append(carteBloc('Publier', h('form', { onsubmit: (e) => soumettre(e, async () => { if (await action(await api('/community/publications', { body: { contenu: txt.value, categorie: cat.value || null } }))) rafraichir('community')(); }) }, txt, cat, h('button', { class: 'bouton-principal', type: 'submit' }, 'Publier'))));
  const dest = inp('E-mail du destinataire', { type: 'email' }); const msg = inp('Message privé…', { area: true });
  const boite = h('div');
  const charger = async () => { vider(boite); const r = await api('/community/messages'); (r.ok ? r.data : []).slice(0, 15).forEach((m) => boite.append(h('div', { class: 'item' }, h('div', { class: 'meta' }, (m.recu ? 'De ' : 'Envoyé — ') + m.de + ' · ' + fmtDate(m.date)), m.contenu))); if (!boite.firstChild) boite.append(h('p', { class: 'petit' }, 'Aucun message.')); };
  c.append(carteBloc('Messages privés', h('div', { class: 'rangee' }, dest), msg, btn('Envoyer', async () => { if (await action(await api('/community/messages', { body: { destinataire_email: dest.value, contenu: msg.value } }))) { msg.value = ''; charger(); } }), boite));
  charger();
  const r = await api('/community/publications'); const fil = carteBloc('Fil des membres');
  (r.ok ? r.data : []).forEach((p) => {
    const com = inp('Commenter…');
    fil.append(h('div', { class: 'item' }, h('h4', {}, p.auteur), h('div', { class: 'meta' }, fmtDate(p.date) + (p.categorie ? ' · #' + p.categorie : '')), h('p', {}, p.contenu),
      p.commentaires.map((x) => h('div', { class: 'meta' }, '↳ ' + x.auteur + ' : ' + x.contenu)),
      h('div', { class: 'rangee' }, com, btn('OK', async () => { if (com.value && await action(await api('/community/publications/' + p.id + '/commentaires', { body: { contenu: com.value } }))) rafraichir('community')(); })),
      h('div', { class: 'rangee' }, p.mienne ? btn('Supprimer', async () => { if (await action(await api('/community/publications/' + p.id, { method: 'DELETE' }))) rafraichir('community')(); }, 'bouton-danger') : btnSignaler('publication', p.id))));
  });
  c.append(fil);
}

// ======================================================================== INEX OPPORTUNITY
async function panneauOpportunity(c) {
  const f = { titre: inp('Titre', { req: true }), desc: inp('Description', { area: true, req: true }), type: inp('Type', { options: [['offre', 'Offre'], ['demande', 'Demande'], ['projet', 'Projet'], ['investissement', 'Investissement'], ['import_export', 'Import / Export']] }), pays: inp('Pays'), duree: inp('Durée (jours)', { type: 'number', min: 1, val: '30' }) };
  c.append(carteBloc('Publier une opportunité', h('form', { onsubmit: (e) => soumettre(e, async () => { if (await action(await api('/opportunity/opportunites', { body: { titre: f.titre.value, description: f.desc.value, type: f.type.value, pays: f.pays.value || null, duree_jours: Number(f.duree.value) || 30 } }))) rafraichir('opportunity')(); }) }, f.titre, f.desc, f.type, f.pays, f.duree, h('button', { class: 'bouton-principal', type: 'submit' }, 'Publier'))));
  const r = await api('/opportunity/opportunites'); const l = carteBloc('Opportunités ouvertes');
  (r.ok ? r.data : []).forEach((o) => l.append(h('div', { class: 'item' }, h('h4', {}, o.titre), h('div', { class: 'meta' }, badge(o.type), badge(o.statut), o.auteur + ' · ' + (o.pays || '') + ' · ' + o.interets + ' intérêt(s)'), h('p', {}, o.description),
    h('div', { class: 'rangee' }, o.mienne ? [
      btn('Intéressés', async () => { const x = await api('/opportunity/opportunites/' + o.id + '/interets'); alert((x.ok ? x.data : []).map((i) => i.auteur + ' <' + i.email + '> ' + (i.message || '')).join('\n') || 'Aucun intérêt pour le moment.'); }, 'bouton-secondaire-sombre bouton-petit'),
      btn('Clôturer', async () => { if (await action(await api('/opportunity/opportunites/' + o.id + '/statut', { method: 'PUT', body: { statut: 'cloture' } }))) rafraichir('opportunity')(); }, 'bouton-secondaire-sombre bouton-petit'),
      !o.transfere_vers ? btn('→ GROUP', async () => { if (await action(await api('/opportunity/opportunites/' + o.id + '/transferer', { body: { vers: 'group' } }))) rafraichir('opportunity')(); }, 'bouton-secondaire-sombre bouton-petit') : null,
      !o.transfere_vers ? btn('→ PARTNERSHIP', async () => { if (await action(await api('/opportunity/opportunites/' + o.id + '/transferer', { body: { vers: 'partnership' } }))) rafraichir('opportunity')(); }, 'bouton-secondaire-sombre bouton-petit') : null,
    ] : [btn('Je suis intéressé', async () => { const m = prompt('Message (facultatif) :') || ''; await action(await api('/opportunity/opportunites/' + o.id + '/interet', { body: { message: m } })); }), btnSignaler('opportunite', o.id)]))));
  if (!l.querySelector('.item')) l.append(h('p', { class: 'petit' }, 'Aucune opportunité ouverte.'));
  c.append(l);
}

// ======================================================================== INEX GROUP
async function panneauGroup(c) {
  const f = { titre: inp('Titre', { req: true }), desc: inp('Description', { area: true, req: true }), prix: inp('Prix unitaire USD', { type: 'number', min: 0, step: '0.01' }), unite: inp('Unité (kg, sac, pièce…)', { val: 'unité' }), cible: inp('Quantité cible', { type: 'number', min: 1 }), duree: inp('Durée (jours)', { type: 'number', min: 1, val: '30' }) };
  c.append(carteBloc('Créer une opération collective', h('form', { onsubmit: (e) => soumettre(e, async () => { if (await action(await api('/group/operations', { body: { titre: f.titre.value, description: f.desc.value, prix_unitaire: Number(f.prix.value) || 0, unite: f.unite.value || 'unité', quantite_cible: Number(f.cible.value) || null, duree_jours: Number(f.duree.value) || 30 } }))) rafraichir('group')(); }) }, f.titre, f.desc, f.prix, f.unite, f.cible, f.duree, h('button', { class: 'bouton-principal', type: 'submit' }, 'Créer'))));
  const r = await api('/group/operations'); const l = carteBloc('Opérations collectives');
  const suivant = { ouverte: ['en_negociation', 'Passer en négociation'], en_negociation: ['commandee', 'Marquer commandée'], commandee: ['cloturee', 'Clôturer'] };
  (r.ok ? r.data : []).forEach((o) => {
    const q = inp('Quantité', { type: 'number', min: 0, step: 'any' });
    const prog = o.quantite_cible ? Math.min(100, (o.quantite_engagee / o.quantite_cible) * 100) : 0;
    l.append(h('div', { class: 'item' }, h('h4', {}, o.titre), h('div', { class: 'meta' }, badge(o.statut), o.organisateur + ' · ' + usd(o.prix_unitaire) + ' / ' + o.unite + ' · commission INEX ' + o.commission_pourcentage + ' % · ' + o.participants + ' participant(s)'), h('p', {}, o.description),
      o.quantite_cible ? [h('div', { class: 'barre-score' }, h('div', { style: 'width:' + prog + '%' })), h('div', { class: 'petit' }, o.quantite_engagee + ' / ' + o.quantite_cible + ' ' + o.unite)] : null,
      h('div', { class: 'rangee' }, o.statut === 'ouverte' && !o.mienne ? [q, btn('Rejoindre', async () => { const x = await api('/group/operations/' + o.id + '/rejoindre', { body: { quantite: Number(q.value) } }); if (await action(x, 'Participation enregistrée')) { if (x.data.facture_id) proposerPaiement(x.data.facture_id, x.data.commission, x.data.commission_xaf); } })] : null,
        o.mienne && suivant[o.statut] ? btn(suivant[o.statut][1], async () => { if (await action(await api('/group/operations/' + o.id + '/statut', { method: 'PUT', body: { statut: suivant[o.statut][0] } }))) rafraichir('group')(); }) : null,
        o.mienne ? btn('Participants', async () => { const x = await api('/group/operations/' + o.id + '/participants'); alert((x.ok ? x.data : []).map((p) => p.participant + ' : ' + p.quantite).join('\n') || 'Aucun participant.'); }, 'bouton-secondaire-sombre bouton-petit') : btnSignaler('operation', o.id))));
  });
  if (!l.querySelector('.item')) l.append(h('p', { class: 'petit' }, 'Aucune opération.'));
  c.append(l);
}

// ======================================================================== INEX PARTNERSHIP
async function panneauPartnership(c) {
  const f = { titre: inp('Titre', { req: true }), desc: inp('Description', { area: true, req: true }), type: inp('Type de partenariat', { val: 'commercial' }), obj: inp('Objectifs', { area: true }), dest: inp('E-mail du destinataire (vide = proposition ouverte)', { type: 'email' }) };
  c.append(carteBloc('Proposer un partenariat', h('form', { onsubmit: (e) => soumettre(e, async () => { if (await action(await api('/partnership/propositions', { body: { titre: f.titre.value, description: f.desc.value, type_partenariat: f.type.value || 'commercial', objectifs: f.obj.value || null, destinataire_email: f.dest.value || null } }))) rafraichir('partnership')(); }) }, f.titre, f.desc, f.type, f.obj, f.dest, h('button', { class: 'bouton-principal', type: 'submit' }, 'Proposer'))));
  for (const [scope, titre] of [['mes', 'Mes partenariats'], ['ouvertes', 'Propositions ouvertes']]) {
    const r = await api('/partnership/propositions?scope=' + scope); const l = carteBloc(titre);
    (r.ok ? r.data : []).forEach((p) => l.append(h('div', { class: 'item' }, h('h4', {}, p.titre), h('div', { class: 'meta' }, badge(p.statut), badge(p.type_partenariat), p.createur), h('p', {}, p.description),
      h('div', { class: 'rangee' }, p.pour_moi && p.statut === 'proposee' ? [btn('Accepter', async () => { if (await action(await api('/partnership/propositions/' + p.id + '/statut', { method: 'PUT', body: { statut: 'acceptee' } }))) rafraichir('partnership')(); }), btn('Refuser', async () => { if (await action(await api('/partnership/propositions/' + p.id + '/statut', { method: 'PUT', body: { statut: 'refusee' } }))) rafraichir('partnership')(); }, 'bouton-danger')] : null,
        p.mienne && ['acceptee', 'en_cours'].includes(p.statut) ? btn(p.statut === 'acceptee' ? 'Démarrer' : 'Terminer', async () => { if (await action(await api('/partnership/propositions/' + p.id + '/statut', { method: 'PUT', body: { statut: p.statut === 'acceptee' ? 'en_cours' : 'terminee' } }))) rafraichir('partnership')(); }) : null,
        !p.mienne ? btnSignaler('partenariat', p.id) : null))));
    if (!l.querySelector('.item')) l.append(h('p', { class: 'petit' }, 'Rien à afficher.'));
    c.append(l);
  }
}

// ======================================================================== INEX MEDIATION
async function panneauMediation(c) {
  const f = { sujet: inp('Sujet', { req: true }), desc: inp('Description du différend', { area: true, req: true }), adv: inp('E-mail de l’autre partie (facultatif)', { type: 'email' }) };
  c.append(carteBloc('Demander une médiation', h('p', { class: 'petit' }, 'INEX MEDIATION facilite une solution amiable : aucune condamnation, aucun accord forcé ; ne remplace ni un tribunal ni un arbitre.'),
    h('form', { onsubmit: (e) => soumettre(e, async () => { if (await action(await api('/mediation/demandes', { body: { sujet: f.sujet.value, description_litige: f.desc.value, partie_adverse_email: f.adv.value || null } }))) rafraichir('mediation')(); }) }, f.sujet, f.desc, f.adv, h('button', { class: 'bouton-principal', type: 'submit' }, 'Demander'))));
  const r = await api('/mediation/mes-demandes'); const l = carteBloc('Mes demandes'); const det = h('div');
  (r.ok ? r.data : []).forEach((d) => l.append(h('div', { class: 'item' }, h('h4', {}, d.sujet), h('div', { class: 'meta' }, badge(d.statut), d.role + ' · ' + fmtDate(d.date)),
    btn('Ouvrir', async () => {
      const x = await api('/mediation/demandes/' + d.id); if (!x.ok) return toast(erreur(x), true);
      vider(det); const pos = inp('Votre position…', { area: true }); const acc = inp('Texte de l’accord (si accord)', { area: true });
      det.append(carteBloc('Dossier : ' + x.data.sujet, h('p', { class: 'petit' }, x.data.avis), x.data.positions.map((p) => h('div', { class: 'item' }, h('div', { class: 'meta' }, p.auteur + ' · ' + fmtDate(p.date)), p.texte)), x.data.accord ? h('p', {}, 'Accord : ' + x.data.accord) : null,
        ['accord', 'sans_accord', 'close'].includes(x.data.statut) ? null : [pos, btn('Ajouter ma position', async () => { if (await action(await api('/mediation/demandes/' + d.id + '/positions', { body: { texte: pos.value } }))) rafraichir('mediation')(); }), acc,
          h('div', { class: 'rangee' }, btn('Clore : accord', async () => { if (await action(await api('/mediation/demandes/' + d.id + '/cloture', { method: 'PUT', body: { statut: 'accord', accord: acc.value } }))) rafraichir('mediation')(); }), btn('Clore : sans accord', async () => { if (await action(await api('/mediation/demandes/' + d.id + '/cloture', { method: 'PUT', body: { statut: 'sans_accord' } }))) rafraichir('mediation')(); }, 'bouton-danger'))]));
    }, 'bouton-secondaire-sombre bouton-petit'))));
  if (!l.querySelector('.item')) l.append(h('p', { class: 'petit' }, 'Aucune demande.'));
  c.append(l, det);
}

const PANNEAUX = { trust: panneauTrust, ads: panneauAds, business: panneauBusiness, community: panneauCommunity, opportunity: panneauOpportunity, group: panneauGroup, partnership: panneauPartnership, mediation: panneauMediation };

// ======================================================================== INEX CORE (construit UNIQUEMENT pour le fondateur : Gemini n'existe pas dans le DOM des autres)
const core = { chart: null };
const CORE_ONGLETS = [['dash', 'Tableau de bord'], ['users', 'Utilisateurs'], ['finance', 'Finances'], ['trust', 'TRUST'], ['ads', 'ADS'], ['dep', 'Départements'], ['fichiers', 'Fichiers'], ['diffusion', 'Messages'], ['systeme', 'Système'], ['ai', 'Gemini']];
function tableau(cols, rows) {
  return h('div', { class: 'defilant-x' }, h('table', { class: 'tableau' }, h('thead', {}, h('tr', {}, cols.map((c) => h('th', {}, c[0])))),
    h('tbody', {}, rows.map((r) => h('tr', {}, cols.map((c) => h('td', {}, c[1](r))))))));
}
async function ouvrirCore() {
  if (!state.user || !state.user.is_core_admin) return;
  $('grille-espaces').hidden = true; $('vue-espace').hidden = false; $('titre-espace').textContent = 'INEX CORE'; window.scrollTo(0, 0);
  vider($('bandeau-acces'));
  const c = vider($('contenu-espace'));
  const nav = h('div', { class: 'onglets-core' }); const corps = h('div', { class: 'carte-action rouge' });
  CORE_ONGLETS.forEach(([k, nom]) => nav.append(h('button', { 'data-k': k, onclick: () => coreOnglet(k, corps, nav) }, nom)));
  c.append(nav, corps);
  coreOnglet(state.tab || 'dash', corps, nav);
}
async function coreOnglet(k, corps, nav) {
  state.tab = k; vider(corps);
  nav.querySelectorAll('button').forEach((b) => b.classList.toggle('actif', b.dataset.k === k));
  if (core.chart) { core.chart.destroy(); core.chart = null; }
  const fn = { dash: coreDash, users: coreUsers, finance: coreFinance, trust: coreTrust, ads: coreAds, dep: coreDep, fichiers: coreFichiers, diffusion: coreDiffusion, systeme: coreSysteme, ai: coreIA }[k];
  await fn(corps);
}
const rec = (corps, k) => () => ouvrirCore();

async function coreDash(z) {
  const [s, w, m] = await Promise.all([api('/core/stats'), api('/core/portefeuille'), api('/core/portefeuille/mensuel')]);
  if (!s.ok) return z.append(erreur(s));
  const d = s.data;
  const st = (titre, val) => h('div', { class: 'stat' }, h('h4', {}, titre), h('h2', {}, val));
  z.append(h('div', { class: 'stats-grille' }, st('Utilisateurs', d.users_count), st('Visiteurs', d.visiteurs), st('Dossiers TRUST', d.dossiers), st('Pubs à valider', d.pubs_a_valider), st('Signalements', d.signalements), st('Transactions en attente', d.transactions_en_attente)));
  z.append(h('h3', {}, '💰 Portefeuille INEX (fictif, alimenté par chaque transaction validée)'),
    h('div', { class: 'stats-grille' }, st('Solde USD', usd(w.data.solde_usd)), st('Solde XAF', w.data.solde_xaf.toLocaleString() + ' XAF'), ...Object.entries(w.data.par_type).map(([k2, v]) => st(k2, usd(v)))),
    h('p', { class: 'petit' }, 'Taux fixe : 1 USD = ' + w.data.taux + ' XAF'));
  z.append(h('h3', {}, 'Soldes par mois'), h('div', { style: 'position:relative;height:280px' }, h('canvas', { id: 'chartRevenus' })));
  if (window.Chart && m.ok) {
    const couleurs = ['#00b4d8', '#4ade80', '#d4af37', '#e63946', '#a78bfa', '#fb923c'];
    core.chart = new Chart($('chartRevenus'), {
      data: { labels: m.data.labels, datasets: [
        ...m.data.types.map((tp, i) => ({ type: 'bar', label: tp, data: m.data.series[tp], backgroundColor: couleurs[i % 6], stack: 's' })),
        { type: 'line', label: 'Cumul', data: m.data.cumul, borderColor: '#ffffff', backgroundColor: '#fff', tension: .3, yAxisID: 'y' }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, ticks: { color: '#a0b4c8' } }, y: { stacked: false, ticks: { color: '#a0b4c8' } } }, plugins: { legend: { labels: { color: '#fff' } } } },
    });
  }
  const tp = h('div'); z.append(h('h3', {}, 'Derniers mouvements'), tableau([['Date', (r) => fmtDate(r.date)], ['Type', (r) => r.type], ['Espace', (r) => r.espace || ''], ['Montant', (r) => usd(r.montant_usd)]], w.data.dernieres), tp);
}
async function coreUsers(z) {
  const r = await api('/core/utilisateurs'); if (!r.ok) return;
  z.append(tableau([['E-mail', (u) => u.email], ['Profil', (u) => u.profile], ['Statut', (u) => u.statut + (u.banni ? ' · BANNI' : '')], ['Solde', (u) => usd(u.solde)],
    ['', (u) => u.role === 'core_admin' ? 'CORE' : u.banni ? btn('Réactiver', async () => { if (await action(await api('/core/utilisateurs/' + u.id + '/debannir', { method: 'POST' }))) ouvrirCore(); }) : btn('Bannir', async () => { const m = prompt('Motif :') || ''; if (await action(await api('/core/utilisateurs/' + u.id + '/bannir?motif=' + encodeURIComponent(m), { method: 'POST' }))) ouvrirCore(); }, 'bouton-danger')]], r.data));
}
async function coreFinance(z) {
  const [tr, tf] = await Promise.all([api('/core/transactions'), api('/core/tarifs')]);
  const f = { esp: inp('Espace / service (ex: ads, certification)', { req: true }), pt: inp('Profil', { options: ['particulier', 'entreprise'] }), lib: inp('Libellé', { req: true }), prix: inp('Prix USD', { type: 'number', min: 0, step: '0.01', req: true }), jours: inp('Durée (jours)', { type: 'number', min: 1 }) };
  z.append(h('h3', {}, 'Tarifs (définis par vous — rien n’est inventé)'), h('form', { onsubmit: (e) => soumettre(e, async () => { if (await action(await api('/core/tarifs', { body: { espace: f.esp.value.toLowerCase(), profile_type: f.pt.value, libelle: f.lib.value, prix_usd: Number(f.prix.value), duree_jours: Number(f.jours.value) || null } }))) ouvrirCore(); }) },
    h('div', { class: 'rangee' }, f.esp, f.pt, f.lib, f.prix, f.jours, h('button', { class: 'bouton-principal bouton-petit', type: 'submit' }, 'Ajouter'))),
    tableau([['Espace', (t2) => t2.espace], ['Profil', (t2) => t2.profile_type], ['Libellé', (t2) => t2.libelle], ['USD', (t2) => t2.prix_usd], ['Actif', (t2) => (t2.actif ? 'oui' : 'non')],
      ['', (t2) => btn(t2.actif ? 'Désactiver' : 'Activer', async () => { if (await action(await api('/core/tarifs/' + t2.id, { method: 'PUT', body: { espace: t2.espace, profile_type: t2.profile_type, libelle: t2.libelle, prix_usd: t2.prix_usd, duree_jours: t2.duree_jours, actif: !t2.actif } }))) ouvrirCore(); }, 'bouton-secondaire-sombre bouton-petit')]], tf.ok ? tf.data : []));
  z.append(h('h3', { style: 'margin-top:18px' }, 'Transactions'), tableau([['Réf.', (x) => x.reference], ['Utilisateur', (x) => x.user], ['Type', (x) => x.type], ['USD', (x) => x.montant_usd], ['Opérateur', (x) => x.operateur], ['Statut', (x) => x.statut],
    ['', (x) => x.statut === 'en_attente' ? btn('Valider', async () => { const op = prompt('Opérateur (airtel, moov, uba, manuel) :', 'airtel') || 'manuel'; if (await action(await api('/core/transactions/' + x.id + '/valider?operateur=' + encodeURIComponent(op), { method: 'POST' }))) ouvrirCore(); }, 'bouton-vert') : '']], tr.ok ? tr.data : []));
}
async function coreTrust(z) {
  const r = await api('/core/trust/dossiers'); const det = h('div');
  z.append(h('p', { class: 'petit' }, 'Vous vérifiez les critères ; le score se recalcule automatiquement (jamais saisi à la main).'),
    tableau([['N° INEX', (d) => d.numero_inex], ['Nom', (d) => d.nom_complet], ['Dossier', (d) => d.statut], ['Certif.', (d) => d.statut_certification], ['Score', (d) => d.score_initial + ' / ' + (d.score_final ?? '—')],
      ['', (d) => btn('Examiner', () => coreDossier(d.id, det), 'bouton-secondaire-sombre bouton-petit')]], r.ok ? r.data : []), det);
}
async function coreDossier(id, zone) {
  vider(zone); const r = await api('/core/trust/dossiers/' + id); if (!r.ok) return;
  const d = r.data; const etats = ['verifie', 'en_attente', 'non_applicable', 'indisponible', 'expire', 'incoherent', 'refuse', 'non_verifiable'];
  const bloc = h('div', { class: 'item' }, h('h4', {}, d.numero_inex + ' — ' + d.nom_complet), h('div', { class: 'meta' }, 'Score initial ' + d.score_initial + ' · global ' + (d.score_final ?? '—')));
  d.criteres.forEach((c) => {
    const sel = inp('', { options: etats, val: c.etat }); const com = inp('Commentaire', { val: c.commentaire || '' });
    bloc.append(h('div', { class: 'item' }, h('strong', {}, c.libelle), h('div', { class: 'meta' }, 'Valeur : ' + (c.valeur || '—')), c.preuve_url ? h('a', { class: 'lien', href: c.preuve_url, target: '_blank', rel: 'noopener' }, 'Voir la preuve') : h('span', { class: 'petit' }, 'Aucune preuve'),
      h('div', { class: 'rangee' }, sel, com, btn('Appliquer', async () => { const x = await api('/core/trust/criteres/' + c.id + '/verifier', { body: { etat: sel.value, commentaire: com.value || null } }); if (await action(x)) coreDossier(id, zone); }))));
  });
  const motif = inp('Motif (obligatoire pour suspendre/révoquer)');
  const dec = (v, nom, cls) => btn(nom, async () => { if (await action(await api('/core/trust/dossiers/' + id + '/decision', { body: { decision: v, motif: motif.value || null } }))) coreDossier(id, zone); }, cls);
  bloc.append(motif, h('div', { class: 'rangee' }, dec('etablie', 'Fiche établie', 'bouton-vert'), dec('non_etablie', 'Non établie', 'bouton-danger'), dec('certifier', 'Certifier', 'bouton-vert'), dec('refuser_certification', 'Refuser certification', 'bouton-danger'), dec('suspendre', 'Suspendre', 'bouton-danger'), dec('revoquer', 'Révoquer', 'bouton-danger')));
  zone.append(bloc);
}
async function coreAds(z) {
  const r = await api('/core/ads'); const sig = await api('/core/signalements');
  z.append(h('h3', {}, 'Modération des publicités'), tableau([['#', (a) => a.id], ['Titre', (a) => a.titre], ['Média', (a) => h('a', { class: 'lien', href: a.media_url, target: '_blank', rel: 'noopener' }, 'voir')], ['Statut', (a) => a.statut], ['Vues/Clics', (a) => a.impressions + '/' + a.clics],
    ['', (a) => h('div', { class: 'rangee' }, ['approuvee', 'refusee', 'suspendue'].map((s) => btn(s, async () => { const m = s === 'approuvee' ? null : (prompt('Motif :') || null); if (await action(await api('/core/ads/' + a.id + '/moderer', { body: { statut: s, motif: m } }))) ouvrirCore(); }, s === 'approuvee' ? 'bouton-vert' : 'bouton-danger')))]], r.ok ? r.data : []));
  z.append(h('h3', { style: 'margin-top:18px' }, 'Signalements'), tableau([['Cible', (s) => s.cible], ['Motif', (s) => s.motif], ['Statut', (s) => s.statut], ['', (s) => s.statut === 'ouvert' ? btn('Traité', async () => { await api('/core/signalements/' + s.id + '/traiter', { method: 'POST' }); ouvrirCore(); }, 'bouton-secondaire-sombre bouton-petit') : '']], sig.ok ? sig.data : []));
}
async function coreDep(z) {
  const sel = inp('', { options: ESPACES }); const res = h('div');
  const charger = async () => { vider(res); const r = await api('/core/espace/' + sel.value); if (!r.ok) return; res.append(h('p', { class: 'petit' }, r.data.total + ' élément(s)'), tableau([['#', (i) => i.id], ['Contenu', (i) => i.libelle], ['', (i) => sel.value === 'trust' ? '🔒' : btn('Supprimer', async () => { if (confirm('Supprimer cet élément ?') && await action(await api('/core/espace/' + sel.value + '/' + i.id, { method: 'DELETE' }))) charger(); }, 'bouton-danger')]], r.data.items)); };
  sel.onchange = charger; z.append(h('h3', {}, 'Accès à tous les départements INEX'), sel, res); charger();
}
async function coreFichiers(z) {
  const r = await api('/core/fichiers');
  z.append(h('h3', {}, 'Fichiers importés de l’extérieur'), h('p', { class: 'petit' }, 'Supprimez ici n’importe quel fichier importé (publicités, images de profil, preuves…). La suppression est définitive.'),
    tableau([['#', (f) => f.id], ['Type', (f) => f.kind], ['Nom', (f) => f.nom], ['Aperçu', (f) => h('a', { class: 'lien', href: f.url, target: '_blank', rel: 'noopener' }, 'ouvrir')], ['Taille', (f) => Math.round(f.taille / 1024) + ' Ko'],
      ['', (f) => btn('Supprimer', async () => { if (confirm('Supprimer ' + f.nom + ' ?') && await action(await api('/core/fichiers/' + f.id, { method: 'DELETE' }))) ouvrirCore(); }, 'bouton-danger')]], r.ok ? r.data : []));
}
async function coreDiffusion(z) {
  const titre = inp('Titre', { req: true }); const txt = inp('Message', { area: true, req: true });
  const aud = inp('Audience', { options: [['tous', 'Tout le monde (annonce publique + notification)'], ['emails', 'Utilisateurs choisis'], ['profil', 'Un type de profil']] });
  const emails = inp('E-mails séparés par des virgules'); const pt = inp('Profil', { options: ['particulier', 'entreprise'] });
  z.append(h('h3', {}, 'Envoyer un message'), titre, txt, aud, emails, pt, btn('Envoyer', async () => { if (await action(await api('/core/diffuser', { body: { titre: titre.value, contenu: txt.value, audience: aud.value, emails: emails.value.split(',').map((x) => x.trim()).filter(Boolean), profile_type: pt.value } }))) { titre.value = ''; txt.value = ''; } }));
}
async function coreSysteme(z) {
  const [po, cs, au] = await Promise.all([api('/core/purge/options'), api('/core/cron/statut'), api('/core/audit')]);
  const coches = {}; const liste = h('div');
  if (po.ok) Object.entries(po.data.options).forEach(([k, lib]) => { const cb = h('input', { type: 'checkbox', checked: po.data.actives.includes(k), style: 'width:auto;margin-right:8px' }); coches[k] = cb; liste.append(h('label', { style: 'display:block;margin-bottom:6px' }, cb, lib)); });
  const choisies = () => Object.keys(coches).filter((k) => coches[k].checked);
  z.append(h('h3', {}, 'Purge hebdomadaire (CRONJOBORG — dimanche 03h00)'), h('p', { class: 'petit' }, 'Conservés : comptes, dossiers TRUST, finances, portefeuille, tarifs, journal d’audit. Cochez ce qui est effacé chaque semaine.'), liste,
    h('div', { class: 'rangee' }, btn('Enregistrer la sélection', async () => action(await api('/core/purge/cibles', { method: 'PUT', body: { cibles: choisies() } }))),
      btn('Purger MAINTENANT', async () => { if (confirm('Effacer définitivement : ' + choisies().join(', ') + ' ?')) { const r = await api('/core/purge', { body: { cibles: choisies() } }); await action(r); } }, 'bouton-danger')),
    po.ok && po.data.derniere ? h('p', { class: 'petit' }, 'Dernière purge : ' + fmtDate(po.data.derniere.date) + ' (' + po.data.derniere.origine + ')') : null);
  z.append(h('h3', { style: 'margin-top:18px' }, 'Tâches CRONJOBORG (réveil serveur + purge)'),
    h('p', { class: 'petit' }, cs.ok ? (cs.data.actif ? cs.data.taches.map((x) => x.titre + ' : ' + (x.actif ? 'actif' : 'inactif')).join(' · ') || 'Aucune tâche créée.' : cs.data.message) : ''),
    btn('Créer / mettre à jour les tâches', async () => { const r = await api('/core/cron/synchroniser', { method: 'POST' }); if (r.ok) toast(r.data.taches.map((x) => x.tache + ' : ' + x.action).join(' | ')); else toast(erreur(r), true); }));
  z.append(h('h3', { style: 'margin-top:18px' }, 'Journal d’audit'), tableau([['Date', (a) => fmtDate(a.date)], ['Action', (a) => a.action], ['Cible', (a) => a.cible || ''], ['Détail', (a) => a.detail || '']], au.ok ? au.data : []));
}

// ---------------------------------------------------------------- Gemini : agent assistant (avec accord du fondateur) + voix
const voix = { actif: false, rec: null, parle: false };
const LANGS_VOIX = { fr: 'fr-FR', en: 'en-US', ar: 'ar-SA', zh: 'zh-CN', es: 'es-ES' };
function parler(texte) {
  if (!voix.actif || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(texte.slice(0, 400)); u.lang = LANGS_VOIX[langue] || 'fr-FR';
  voix.parle = true; try { voix.rec && voix.rec.stop(); } catch (e) { /* ignore */ }
  u.onend = () => { voix.parle = false; ecouter(); };
  speechSynthesis.speak(u);
}
function ecouter() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!voix.actif || voix.parle || !SR) return;
  voix.rec = new SR(); voix.rec.lang = LANGS_VOIX[langue] || 'fr-FR'; voix.rec.interimResults = false;
  voix.rec.onresult = (e) => { const txt = e.results[0][0].transcript; envoyerIA(txt); };
  voix.rec.onend = () => { if (voix.actif && !voix.parle) setTimeout(ecouter, 400); };
  try { voix.rec.start(); } catch (e) { /* déjà démarré */ }
}
function ajoutMsg(cls, texte, actions) {
  const zone = $('ai-chat-zone'); if (!zone) return;
  const m = h('div', { class: cls }, texte); zone.append(m);
  (actions || []).forEach((a) => {
    const ligne = h('div', { class: 'rangee' }, h('span', { class: 'petit' }, '⏳ ' + a.resume),
      btn('Approuver', async () => { const r = await api('/core/ai/actions/' + a.id + '/approuver', { method: 'POST' }); ligne.replaceWith(h('div', { class: 'msg-bot' }, '✔ ' + (r.ok ? r.data.resultat : erreur(r)))); parler(r.ok ? r.data.resultat : ''); }, 'bouton-vert'),
      btn('Refuser', async () => { await api('/core/ai/actions/' + a.id + '/refuser', { method: 'POST' }); ligne.replaceWith(h('div', { class: 'msg-bot' }, '✖ Refusée : ' + a.resume)); }, 'bouton-danger'));
    zone.append(ligne);
  });
  zone.scrollTop = zone.scrollHeight;
}
async function envoyerIA(texte) {
  const input = $('ai-input'); const msg = (texte || (input && input.value) || '').trim(); if (!msg) return;
  if (input) input.value = '';
  ajoutMsg('msg-user', msg);
  const r = await api('/core/ai/chat', { body: { message: msg } });
  if (!r.ok) return ajoutMsg('msg-bot', erreur(r));
  ajoutMsg('msg-bot', r.data.texte, r.data.actions); parler(r.data.texte);
}
async function coreIA(z) {
  const entree = h('input', { id: 'ai-input', placeholder: 'Ex : Combien d’utilisateurs ? · Bannir x@y.com · Fixe le tarif ads entreprise à 20 $', onkeydown: (e) => { if (e.key === 'Enter') envoyerIA(); } });
  const bv = h('button', { class: 'bouton-secondaire-sombre', onclick: () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return toast('Reconnaissance vocale non disponible sur ce navigateur.', true);
    voix.actif = !voix.actif; bv.textContent = voix.actif ? '🎤 Mode vocal : ACTIVÉ' : '🎤 Mode vocal : désactivé';
    if (voix.actif) ecouter(); else { try { voix.rec && voix.rec.stop(); } catch (e) { /* ignore */ } window.speechSynthesis && window.speechSynthesis.cancel(); }
  } }, '🎤 Mode vocal : désactivé');
  z.append(h('h3', {}, '🤖 Gemini — assistant INEX CORE'), h('p', { class: 'petit' }, 'Gemini n’agit que sur votre ordre : il propose, vous approuvez (ou dites « oui »). Il fouille les archives et accède à tous les départements. Il ne peut ni modifier un score IC, ni certifier, ni effacer transactions et journaux.'),
    bv, h('div', { id: 'ai-chat-zone' }), h('div', { class: 'rangee' }, entree, btn('Envoyer', () => envoyerIA(), 'bouton-principal')));
  ajoutMsg('msg-bot', 'Bonjour. Dites-moi quoi faire : statistiques, recherche dans les archives, bannir, valider une pub, modifier un tarif, diffuser un message, purger…');
}

// ======================================================================== Vérification publique (QR) & initialisation
function ouvrirVerif(token) {
  montrer('vue-verif');
  $('form-verif').onsubmit = async (e) => {
    e.preventDefault(); const z = vider($('verif-resultat'));
    const r = await api('/trust/verifier', { body: { token, nom: $('verif-nom').value, numero: $('verif-numero').value }, silencieux: true });
    if (!r.ok) return z.append(h('p', { class: 'msg-erreur' }, erreur(r)));
    const libelles = { valide: '✔ Certification valide', expire: 'Certification expirée', suspendu: 'Certification suspendue', revoque: 'Certification révoquée', non_certifie: 'Dossier existant — non certifié' };
    z.append(h('div', { class: 'item' }, h('h4', {}, r.data.existe ? libelles[r.data.statut] || r.data.statut : '✖ Aucune correspondance'), h('p', { class: 'petit' }, r.data.message),
      r.data.existe ? h('p', { class: 'petit' }, 'La consultation du contenu détaillé est réservée aux membres connectés.') : null));
  };
}
function initialiser() {
  $('logo-accueil').onerror = function () { this.style.display = 'none'; };
  $('select-langue').addEventListener('change', (e) => { langue = e.target.value; store.set('inex_lang', langue); appliquerLangue(); });
  $('btn-visiteur').onclick = () => { state.mode = 'visiteur'; montrer('vue-pub'); demarrerCarrousel(); chargerAnnonces(); };
  $('btn-utilisateur').onclick = async () => {
    state.mode = 'utilisateur';
    if (TOKEN() && await ouvrirMonEspace()) return;
    montrer('vue-pub'); demarrerCarrousel(); chargerAnnonces();
  };
  $('btn-retour-pub').onclick = () => montrer('vue-accueil');
  document.querySelectorAll('.bouton-profil').forEach((b) => { b.onclick = () => {
    state.profil = b.dataset.profil;
    if (state.mode === 'visiteur') { montrer('vue-plateforme'); afficherVisiteur(); } else ouvrirAuth('inscription');
  }; });
  $('btn-retour-accueil').onclick = () => { montrer('vue-pub'); demarrerCarrousel(); };
  $('btn-vis-inscrire').onclick = () => { state.mode = 'utilisateur'; ouvrirAuth('inscription'); };
  $('btn-fermer-auth').onclick = () => { $('zone-auth').hidden = true; };
  $('tab-inscription').onclick = () => basculerAuth('inscription');
  $('tab-connexion').onclick = () => basculerAuth('connexion');
  $('lien-oubli').onclick = (e) => { e.preventDefault(); basculerAuth('oubli'); };
  $('form-inscription').onsubmit = (e) => soumettre(e, async () => {
    const r = await api('/auth/inscription', { body: { email: $('reg-email').value, mot_de_passe: $('reg-password').value, profile_type: state.profil } });
    if (r.ok) { toast(r.data.message); await apresConnexion(r.data); } else $('message-auth').textContent = erreur(r);
  });
  $('form-connexion').onsubmit = (e) => soumettre(e, async () => {
    const r = await api('/auth/connexion', { body: { email: $('log-email').value, mot_de_passe: $('log-password').value } });
    if (r.ok) await apresConnexion(r.data); else $('message-auth').textContent = erreur(r);
  });
  $('btn-oubli-code').onclick = async () => action(await api('/auth/mot-de-passe-oublie', { body: { email: $('oubli-email').value } }));
  $('form-oubli').onsubmit = (e) => soumettre(e, async () => {
    const r = await api('/auth/reinitialiser', { body: { email: $('oubli-email').value, code: $('oubli-code').value, nouveau_mot_de_passe: $('oubli-mdp').value } });
    if (await action(r)) basculerAuth('connexion');
  });
  $('btn-deconnexion').onclick = () => deconnecter(false);
  $('btn-retour-espaces').onclick = () => afficherGrilleEspaces();
  $('btn-notif').onclick = ouvrirNotifs;
  $('btn-profil').onclick = ouvrirProfil;
  $('btn-fermer-profil').onclick = () => { $('panneau-profil').hidden = true; };
  $('btn-verif-retour').onclick = () => { history.replaceState({}, '', location.pathname); montrer('vue-accueil'); };

  appliquerLangue();
  const token = new URLSearchParams(location.search).get('v');
  if (token) return ouvrirVerif(token);
  if (new URLSearchParams(location.search).get('paypal') && TOKEN()) ouvrirMonEspace();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('/sw.js').catch(() => {});
}
document.addEventListener('DOMContentLoaded', initialiser);
