/* ============================================================
   AGRINOVA AI — MASTER SCRIPT
   All pages, AI calls, weather API, charts, routing
============================================================ */

"use strict";

/* ── CONFIG ──────────────────────────────────────────────── */
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

/* ── APP STATE ──────────────────────────────────────────── */
const App = {
  page: "dashboard",
  username: "Farmer",
  theme: "green",
  farms: [
    { id:1, name:"Green Valley Farm", location:"Raipur, CG", area:5.5, soil:"Loamy", created:"12 Jan 2025" },
    { id:2, name:"Sunrise Fields",    location:"Durg, CG",   area:3.2, soil:"Black Cotton", created:"18 Mar 2025" },
  ],
  crops: [
    { id:1, farmId:1, name:"Rice",    season:"Kharif", status:"Growing",   production:1200, revenue:38400 },
    { id:2, farmId:1, name:"Wheat",   season:"Rabi",   status:"Harvested", production:800,  revenue:19600 },
    { id:3, farmId:2, name:"Soybean", season:"Kharif", status:"Growing",   production:500,  revenue:21000 },
  ],
  posts: [
    { id:1, user:"Ramesh Kumar", time:"2h ago", text:"Wheat crop doing great after recent rains in Raipur district. Anyone else seeing similar growth?", likes:14, tag:"Crop Update", liked:false },
    { id:2, user:"Priya Devi",   time:"5h ago", text:"The PM Kisan amount just came in my account! Make sure you have updated your Aadhaar-bank linkage.", likes:28, tag:"Finance", liked:false },
    { id:3, user:"Suresh Patel", time:"1d ago", text:"Soybean prices are excellent this week at Indore mandi. ₹4,800/quintal. Transport is worth it.", likes:21, tag:"Market", liked:false },
    { id:4, user:"Meena Bai",    time:"2d ago", text:"First time using drip irrigation on my chili crop. Water savings are unbelievable — 60% less!", likes:35, tag:"Technology", liked:false },
  ],
  cropRecos: [],      // infinitely loaded AI crops
  cropRecosPage: 0,   // page counter for infinite scroll
  cropRecosLoading: false,
  notifs: 3,
  weatherCache: {},   // city → data
};

/* ── CLAUDE API HELPER ──────────────────────────────────── */
async function askClaude(prompt, system = "") {
  const body = {
    model: CLAUDE_MODEL, max_tokens: 1500,
    messages: [{ role:"user", content: prompt }],
  };
  if (system) body.system = system;
  const res = await fetch(CLAUDE_URL, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}`);
  const data = await res.json();
  return data.content?.map(b => b.text||"").join("") || "";
}

async function askClaudeWithImage(prompt, b64, mtype) {
  const body = {
    model: CLAUDE_MODEL, max_tokens: 1000,
    messages: [{
      role:"user",
      content:[
        { type:"image", source:{ type:"base64", media_type:mtype, data:b64 } },
        { type:"text",  text:prompt },
      ],
    }],
  };
  const res = await fetch(CLAUDE_URL, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}`);
  const data = await res.json();
  return data.content?.map(b => b.text||"").join("") || "";
}

/* ── OPEN-METEO WEATHER API ─────────────────────────────── */
const WEATHER_CODES = {
  0:"Clear Sky",1:"Mainly Clear",2:"Partly Cloudy",3:"Overcast",
  45:"Foggy",48:"Icy Fog",51:"Light Drizzle",53:"Moderate Drizzle",
  55:"Dense Drizzle",61:"Slight Rain",63:"Moderate Rain",65:"Heavy Rain",
  71:"Light Snow",73:"Moderate Snow",75:"Heavy Snow",
  77:"Snow Grains",80:"Slight Showers",81:"Moderate Showers",82:"Violent Showers",
  85:"Slight Snow Showers",86:"Heavy Snow Showers",
  95:"Thunderstorm",96:"Thunderstorm w/ Hail",99:"Heavy Thunderstorm + Hail",
};
const WEATHER_ICONS = {
  0:"☀️",1:"🌤",2:"⛅",3:"☁️",45:"🌫",48:"🌫",
  51:"🌦",53:"🌧",55:"🌧",61:"🌦",63:"🌧",65:"⛈",
  71:"🌨",73:"❄️",75:"❄️",80:"🌦",81:"🌧",82:"⛈",
  95:"⛈",96:"⛈",99:"⛈",
};

async function fetchWeather(city) {
  // Check cache
  if (App.weatherCache[city.toLowerCase()]) {
    return App.weatherCache[city.toLowerCase()];
  }
  // Geocoding
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );
  const geoData = await geoRes.json();
  if (!geoData.results?.length) throw new Error(`City "${city}" not found`);
  const { latitude:lat, longitude:lon, name, country } = geoData.results[0];

  // Weather (current + hourly humidity + daily forecast)
  const wxRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current_weather=true` +
    `&hourly=relativehumidity_2m,precipitation_probability` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max` +
    `&forecast_days=7&timezone=auto`
  );
  const wxData = await wxRes.json();
  const cw = wxData.current_weather;

  const result = {
    city: name, country,
    temp: Math.round(cw.temperature),
    wind: Math.round(cw.windspeed),
    code: cw.weathercode,
    desc: WEATHER_CODES[cw.weathercode] || "Unknown",
    icon: WEATHER_ICONS[cw.weathercode] || "🌡",
    humidity: wxData.hourly.relativehumidity_2m?.[0] || 0,
    rainProb: wxData.hourly.precipitation_probability?.[0] || 0,
    daily: wxData.daily,
  };
  App.weatherCache[city.toLowerCase()] = result;
  return result;
}

/* ── TYPING ANIMATION ───────────────────────────────────── */
function typeText(el, text, speed = 14) {
  el.textContent = "";
  el.classList.add("ai-typing");
  let i = 0;
  const iv = setInterval(() => {
    el.textContent += text[i++];
    if (i >= text.length) { clearInterval(iv); el.classList.remove("ai-typing"); }
  }, speed);
}

/* ── AI RESULT LOADING STATE ────────────────────────────── */
function showAILoading(el) {
  el.innerHTML = `
    <div class="ai-result-label">◉ AI PROCESSING...</div>
    <div class="skeleton-line" style="width:90%"></div>
    <div class="skeleton-line" style="width:75%"></div>
    <div class="skeleton-line" style="width:82%"></div>
  `;
  el.style.display = "block";
}
function showAIResult(el, text) {
  el.innerHTML = `<div class="ai-result-label">◉ AI RESPONSE</div><div class="ai-text"></div>`;
  el.style.display = "block";
  typeText(el.querySelector(".ai-text"), text);
}
function hideAI(el) { el.style.display = "none"; el.innerHTML = ""; }

/* ── TOAST ──────────────────────────────────────────────── */
function toast(msg, type = "success") {
  const icons = { success:"✅", error:"❌", info:"ℹ️" };
  const tc = document.getElementById("toastContainer");
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]||"ℹ️"}</span> ${msg}`;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* ── THEME ──────────────────────────────────────────────── */
function setTheme(name) {
  App.theme = name;
  document.documentElement.setAttribute("data-theme", name === "green" ? "" : name);
  document.querySelectorAll(".theme-btn").forEach(b => b.classList.toggle("active", b.dataset.t === name));
  localStorage.setItem("agrinova_theme", name);
}
function loadTheme() {
  const saved = localStorage.getItem("agrinova_theme") || "green";
  setTheme(saved);
}

/* ── NAVIGATION ─────────────────────────────────────────── */
function navigate(pageId) {
  App.page = pageId;
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(l => {
    l.classList.toggle("active", l.dataset.page === pageId);
  });
  const el = document.getElementById(`page-${pageId}`);
  if (el) { el.classList.add("active"); el.scrollIntoView({ behavior:"instant", block:"start" }); }

  // Update topbar breadcrumb & title
  const titles = {
    dashboard:"Dashboard Overview", farms:"Farm Management",
    crops:"Crops & Disease Detection", weather:"Weather Intelligence",
    market:"Mandi Market Prices", schemes:"Government Schemes",
    community:"Farmer Community", profile:"My Profile",
  };
  document.getElementById("topbarBreadcrumb").textContent = `AGRINOVA / ${pageId.toUpperCase()}`;
  document.getElementById("topbarTitle").textContent = titles[pageId] || pageId;

  // Lazy init
  if (pageId === "dashboard") renderDashboard();
  if (pageId === "farms")     renderFarms();
  if (pageId === "crops")     renderCropTable();
  if (pageId === "community") renderCommunity();
  if (pageId === "market")    renderMarketCards();
  if (pageId === "profile")   renderProfile();
}

/* ── SIDEBAR MOBILE TOGGLE ──────────────────────────────── */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

/* ============================================================
   DASHBOARD PAGE
============================================================ */
function renderDashboard() {
  const totalRev = App.crops.reduce((s,c) => s + c.revenue, 0);
  document.getElementById("stat-farms").textContent   = App.farms.length;
  document.getElementById("stat-crops").textContent   = App.crops.length;
  document.getElementById("stat-rev").textContent     = `₹${(totalRev/1000).toFixed(1)}k`;
  renderBarChart();
  renderSparkline("dashSparkHealth", [72,78,82,88,85,92,95], "var(--green)");
}

function renderBarChart() {
  const data = [28,35,42,38,55,61,70,75,68,82,91,96];
  const labels = ["J","F","M","A","M","J","J","A","S","O","N","D"];
  const max = Math.max(...data);
  const container = document.getElementById("barChart");
  if (!container) return;
  container.innerHTML = data.map((v,i) => {
    const h = Math.max(6, (v/max)*150);
    const isLast = i === data.length-1;
    const bg = isLast
      ? "linear-gradient(180deg, var(--green), var(--green-dark))"
      : `rgba(52,211,120,${(0.12 + (v/max)*0.32).toFixed(2)})`;
    const shadow = isLast ? "box-shadow:0 0 14px var(--green-glow);" : "";
    return `
      <div class="bar-col">
        <span class="bar-val">${v}</span>
        <div class="bar-body" style="height:${h}px;background:${bg};${shadow}"></div>
        <span class="bar-lbl">${labels[i]}</span>
      </div>`;
  }).join("");
}

function renderSparkline(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width  = canvas.offsetWidth  || 300;
  const H = canvas.height = canvas.offsetHeight || 60;
  ctx.clearRect(0,0,W,H);
  const min = Math.min(...data), max = Math.max(...data), range = max-min||1;
  const pts = data.map((v,i) => [
    (i/(data.length-1))*W,
    H - ((v-min)/range)*(H-10) - 5,
  ]);
  // Fill
  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, color.replace("var(--green)", "#34d978") + "44");
  grad.addColorStop(1, "transparent");
  ctx.beginPath();
  pts.forEach(([x,y],i) => i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y));
  ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
  // Line
  ctx.beginPath();
  pts.forEach(([x,y],i) => i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y));
  ctx.strokeStyle = color.replace("var(--green)","#34d978");
  ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
  // Last dot
  const [lx,ly] = pts[pts.length-1];
  ctx.beginPath(); ctx.arc(lx,ly,4,0,Math.PI*2);
  ctx.fillStyle = color.replace("var(--green)","#34d978"); ctx.fill();
}

/* ============================================================
   FARMS PAGE
============================================================ */
function renderFarms() {
  const grid = document.getElementById("farmsGrid");
  if (!grid) return;
  if (!App.farms.length) {
    grid.innerHTML = `<div class="card span-3" style="text-align:center;padding:60px 20px">
      <div style="font-family:var(--mono);font-size:40px;margin-bottom:12px">⬡</div>
      <div style="font-size:18px;font-weight:700;color:var(--text-dim);margin-bottom:8px">No Farms Yet</div>
      <div style="font-size:13px;color:var(--text-muted)">Click "+ Add Farm" to get started.</div>
    </div>`; return;
  }
  grid.innerHTML = App.farms.map(farm => {
    const fCrops = App.crops.filter(c => c.farmId === farm.id);
    const rev = fCrops.reduce((s,c)=>s+c.revenue,0);
    return `
    <div class="card farm-card">
      <div class="farm-card-top" style="background:linear-gradient(90deg,var(--green),var(--accent1))"></div>
      <div class="farm-icon">⬡</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div class="farm-name">${farm.name}</div>
        <span class="tag tag-green">Active</span>
      </div>
      <div class="info-row"><span class="info-key">📍 Location</span><span class="info-val">${farm.location}</span></div>
      <div class="info-row"><span class="info-key">📏 Area</span><span class="info-val">${farm.area} Acres</span></div>
      <div class="info-row"><span class="info-key">🪨 Soil</span><span class="info-val">${farm.soil}</span></div>
      <div class="info-row"><span class="info-key">🌱 Crops</span><span class="info-val">${fCrops.length}</span></div>
      <div class="info-row"><span class="info-key">💰 Revenue</span><span class="info-val" style="color:var(--accent2)">₹${rev.toLocaleString()}</span></div>
      <div class="info-row"><span class="info-key">🗓 Added</span><span class="info-val">${farm.created}</span></div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn btn-ghost btn-sm" onclick="openEditFarm(${farm.id})" style="flex:1">✏ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteFarm(${farm.id})" style="flex:1">✕ Delete</button>
      </div>
    </div>`;
  }).join("");
}

function openAddFarm() {
  document.getElementById("farmModalTitle").textContent = "Add New Farm";
  document.getElementById("farmForm").reset();
  document.getElementById("farmEditId").value = "";
  openModal("farmModal");
}
function openEditFarm(id) {
  const f = App.farms.find(x => x.id===id);
  if (!f) return;
  document.getElementById("farmModalTitle").textContent = "Edit Farm";
  document.getElementById("farmEditId").value   = id;
  document.getElementById("farmName").value     = f.name;
  document.getElementById("farmLocation").value = f.location;
  document.getElementById("farmArea").value     = f.area;
  document.getElementById("farmSoil").value     = f.soil;
  openModal("farmModal");
}
function saveFarm() {
  const name = document.getElementById("farmName").value.trim();
  const loc  = document.getElementById("farmLocation").value.trim();
  const area = parseFloat(document.getElementById("farmArea").value) || 0;
  const soil = document.getElementById("farmSoil").value;
  if (!name || !loc) { toast("Fill all required fields", "error"); return; }
  const editId = parseInt(document.getElementById("farmEditId").value);
  if (editId) {
    const f = App.farms.find(x => x.id===editId);
    if (f) { f.name=name; f.location=loc; f.area=area; f.soil=soil; }
    toast("Farm updated!");
  } else {
    App.farms.push({ id:Date.now(), name, location:loc, area, soil,
      created:new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) });
    toast("Farm added!");
  }
  closeModal("farmModal");
  renderFarms(); renderDashboard();
}
function deleteFarm(id) {
  if (!confirm("Delete this farm?")) return;
  App.farms = App.farms.filter(f => f.id!==id);
  App.crops = App.crops.filter(c => c.farmId!==id);
  renderFarms(); renderDashboard();
  toast("Farm deleted", "info");
}

/* ============================================================
   CROPS PAGE — INFINITE AI RECOMMENDATIONS
============================================================ */
function renderCropTable() {
  const tbody = document.getElementById("cropTableBody");
  if (!tbody) return;
  if (!App.crops.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">No crops added yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = App.crops.map(c => {
    const farm = App.farms.find(f => f.id===c.farmId);
    const statusTag = {Growing:"tag-green",Harvested:"tag-teal",Sowing:"tag-amber",Failed:"tag-red"}[c.status]||"tag-blue";
    return `
    <tr>
      <td style="font-weight:700">🌱 ${c.name}</td>
      <td style="color:var(--text-dim)">${farm?.name||"—"}</td>
      <td><span class="tag ${c.season==="Kharif"?"tag-green":c.season==="Rabi"?"tag-blue":"tag-amber"}">${c.season}</span></td>
      <td style="font-family:var(--mono)">${c.production} kg</td>
      <td style="font-family:var(--mono);color:var(--accent2)">₹${c.revenue.toLocaleString()}</td>
      <td><span class="tag ${statusTag}">◉ ${c.status}</span></td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteCrop(${c.id})">✕</button>
      </td>
    </tr>`;
  }).join("");
}
function deleteCrop(id) {
  App.crops = App.crops.filter(c => c.id!==id);
  renderCropTable(); renderDashboard(); toast("Crop removed","info");
}

function populateFarmSelect(selId) {
  const sel = document.getElementById(selId);
  if (!sel) return;
  sel.innerHTML = `<option value="">Select Farm</option>` +
    App.farms.map(f => `<option value="${f.id}">${f.name}</option>`).join("");
}
function openAddCrop() {
  populateFarmSelect("cropFarmSel");
  document.getElementById("cropForm").reset();
  openModal("cropModal");
}
function saveCrop() {
  const farmId = parseInt(document.getElementById("cropFarmSel").value);
  const name   = document.getElementById("cropName").value.trim();
  const season = document.getElementById("cropSeason").value;
  const status = document.getElementById("cropStatus").value;
  const prod   = parseFloat(document.getElementById("cropProd").value) || 0;
  const rev    = parseFloat(document.getElementById("cropRev").value)  || 0;
  if (!farmId || !name) { toast("Select a farm and enter crop name","error"); return; }
  App.crops.push({ id:Date.now(), farmId, name, season, status, production:prod, revenue:rev });
  closeModal("cropModal"); renderCropTable(); renderDashboard();
  toast("Crop added!");
}

/* ── Infinite AI Crop Recommendations ──────────────────── */
async function loadMoreCropRecos() {
  if (App.cropRecosLoading) return;
  App.cropRecosLoading = true;
  const btn = document.getElementById("loadMoreCropsBtn");
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Loading...`; }

  App.cropRecosPage++;
  const seasons = ["Kharif","Rabi","Zaid"];
  const regions = ["Chhattisgarh","Punjab","Maharashtra","Uttar Pradesh","Karnataka","Gujarat","Rajasthan","Bihar","Andhra Pradesh","Telangana"];
  const soils   = ["loamy","black cotton","red laterite","alluvial","sandy","clay"];
  const rSeason = seasons[Math.floor(Math.random()*3)];
  const rRegion = regions[Math.floor(Math.random()*regions.length)];
  const rSoil   = soils[Math.floor(Math.random()*soils.length)];

  try {
    const text = await askClaude(
      `You are an expert agronomist for India. Give me 6 crop recommendations for ${rSeason} season in ${rRegion} on ${rSoil} soil.
For each crop return ONLY this JSON format (nothing else, no markdown):
[{"name":"CropName","season":"${rSeason}","region":"${rRegion}","soil":"${rSoil}","water":"Low/Medium/High","yield":"X-Y kg/acre","price":"₹X-Y/quintal","duration":"X-Y days","tip":"One key farming tip","tags":["tag1","tag2"]}]`,
      "You are a JSON-only responding agronomist. Return only valid JSON arrays."
    );

    // Parse JSON safely
    const cleaned = text.replace(/```json|```/g,"").trim();
    let items = [];
    try { items = JSON.parse(cleaned); } catch(e) {
      // fallback parse if partial
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) items = JSON.parse(match[0]);
    }

    App.cropRecos = [...App.cropRecos, ...items];
    renderCropRecos();
  } catch(e) {
    console.error(e);
    toast("Could not load recommendations — check AI connection","error");
  }
  App.cropRecosLoading = false;
  if (btn) { btn.disabled = false; btn.innerHTML = "⊕ Load More Crops"; }
}

function renderCropRecos() {
  const grid = document.getElementById("cropRecoGrid");
  if (!grid) return;
  grid.innerHTML = App.cropRecos.map(c => `
    <div class="crop-reco-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div class="crop-reco-name">🌱 ${c.name}</div>
        <span class="tag tag-${c.season==="Kharif"?"green":c.season==="Rabi"?"blue":"amber"}">${c.season}</span>
      </div>
      <div class="crop-reco-meta">
        <div>🌍 <b>Region:</b> ${c.region}</div>
        <div>🪨 <b>Soil:</b> ${c.soil}</div>
        <div>💧 <b>Water:</b> ${c.water}</div>
        <div>📊 <b>Yield:</b> ${c.yield}</div>
        <div>💰 <b>Price:</b> ${c.price}</div>
        <div>⏱ <b>Duration:</b> ${c.duration}</div>
        <div style="margin-top:6px;color:var(--green);font-size:12px">💡 ${c.tip}</div>
      </div>
      <div class="crop-reco-tags">
        ${(c.tags||[]).map(t=>`<span class="tag tag-teal" style="font-size:10px">${t}</span>`).join("")}
      </div>
    </div>
  `).join("");
}

/* ── Disease Detection ──────────────────────────────────── */
let diseaseImgB64 = null, diseaseImgType = "image/jpeg";
document.addEventListener("change", function(e) {
  if (e.target.id === "diseaseFile") {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById("diseaseFileName").textContent = file.name;
    const reader = new FileReader();
    reader.onload = ev => {
      diseaseImgB64 = ev.target.result.split(",")[1];
      diseaseImgType = file.type;
      // Show preview
      const prev = document.getElementById("diseasePreview");
      if (prev) { prev.src = ev.target.result; prev.style.display = "block"; }
    };
    reader.readAsDataURL(file);
  }
});

async function runDiseaseDetection() {
  const resultBox = document.getElementById("diseaseResult");
  showAILoading(resultBox);
  resultBox.className = "ai-result";
  const btn = document.getElementById("diseaseBtnScan");
  btn.disabled = true;
  try {
    let result;
    if (diseaseImgB64) {
      result = await askClaudeWithImage(
        "You are a plant pathologist. Analyze this crop image carefully.\n" +
        "Provide:\n1. Disease Name (or 'Healthy Crop')\n2. Confidence %\n3. Symptoms observed\n" +
        "4. Severity (Low/Medium/High)\n5. Two organic treatment methods\n6. Prevention tips\n" +
        "Be specific and practical. No markdown.",
        diseaseImgB64, diseaseImgType
      );
    } else {
      result = await askClaude(
        "You are a plant pathologist for Indian farms in the current Kharif season.\n" +
        "Describe the top 3 most common crop diseases right now.\n" +
        "For each: disease name, crops affected, key symptoms, severity, and 2 organic treatments.\n" +
        "Be specific and practical. No markdown."
      );
    }
    showAIResult(resultBox, result);
  } catch(e) {
    resultBox.innerHTML = `<div class="ai-result-label">◉ ERROR</div>Disease detection failed: ${e.message}`;
  }
  btn.disabled = false;
}

/* ── Crop Advisor ───────────────────────────────────────── */
async function runCropAdvisor() {
  const city   = document.getElementById("cropAdvisorCity").value.trim() || "Raipur";
  const soil   = document.getElementById("cropAdvisorSoil").value;
  const season = document.getElementById("cropAdvisorSeason").value;
  const resultBox = document.getElementById("cropAdvisorResult");
  showAILoading(resultBox);
  resultBox.className = "ai-result";
  const btn = document.getElementById("cropAdvisorBtn");
  btn.disabled = true;
  try {
    const result = await askClaude(
      `You are an expert agronomist. Give comprehensive crop recommendations for:\n` +
      `Location: ${city}, India\nSoil Type: ${soil}\nSeason: ${season}\n\n` +
      `Provide 5 crops with:\n- Crop name\n- Why it suits this location/season\n- Water requirements\n` +
      `- Expected yield per acre\n- Market price range\n- Key care tips\n- Pest/disease risks\n\n` +
      `Be detailed and practical. No markdown.`,
      "You are an expert agricultural advisor for Indian farming conditions."
    );
    showAIResult(resultBox, result);
  } catch(e) {
    resultBox.innerHTML = `<div class="ai-result-label">◉ ERROR</div>${e.message}`;
  }
  btn.disabled = false;
}

/* ============================================================
   WEATHER PAGE
============================================================ */
async function searchWeather() {
  const city = document.getElementById("weatherCityInput").value.trim();
  if (!city) { toast("Enter a city name","error"); return; }
  const btn = document.getElementById("weatherSearchBtn");
  btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Searching...`;
  const errorEl = document.getElementById("weatherError");
  errorEl.style.display = "none";
  document.getElementById("weatherMain").style.display = "none";

  try {
    const w = await fetchWeather(city);
    renderWeatherMain(w);
    // Get AI farming advice
    getWeatherFarmingAdvice(w);
  } catch(e) {
    errorEl.textContent = `⚠️ ${e.message}`;
    errorEl.style.display = "block";
  }
  btn.disabled = false; btn.innerHTML = "◎ Search Weather";
}

function renderWeatherMain(w) {
  const main = document.getElementById("weatherMain");
  main.style.display = "block";

  document.getElementById("wCity").textContent  = `${w.city}, ${w.country}`;
  document.getElementById("wIcon").textContent  = w.icon;
  document.getElementById("wTemp").textContent  = `${w.temp}°C`;
  document.getElementById("wDesc").textContent  = w.desc;
  document.getElementById("wWind").textContent  = `${w.wind} km/h`;
  document.getElementById("wHumid").textContent = `${w.humidity}%`;
  document.getElementById("wRain").textContent  = `${w.rainProb}%`;

  // 7-day forecast
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date();
  const forecastEl = document.getElementById("forecastRow");
  forecastEl.innerHTML = (w.daily?.time||[]).slice(0,7).map((date,i) => {
    const d = new Date(date);
    const dayName = i===0 ? "Today" : days[d.getDay()];
    const code = w.daily.weathercode[i];
    const hi   = Math.round(w.daily.temperature_2m_max[i]);
    const lo   = Math.round(w.daily.temperature_2m_min[i]);
    const icon = WEATHER_ICONS[code] || "🌡";
    return `
      <div class="forecast-day">
        <div class="forecast-day-name">${dayName}</div>
        <div class="forecast-day-icon">${icon}</div>
        <div class="forecast-day-hi">${hi}°</div>
        <div class="forecast-day-lo">${lo}°</div>
      </div>`;
  }).join("");

  // Render mini sparkline for temp
  const temps = (w.daily?.temperature_2m_max||[]).map(t=>Math.round(t));
  setTimeout(() => renderSparkline("weatherSparkline", temps, "#34d978"), 100);
}

async function getWeatherFarmingAdvice(w) {
  const box = document.getElementById("weatherAdviceBox");
  showAILoading(box);
  try {
    const result = await askClaude(
      `You are AgriNova's agricultural weather advisor.\n` +
      `Current conditions in ${w.city}, ${w.country}:\n` +
      `Temperature: ${w.temp}°C, Wind: ${w.wind} km/h, Humidity: ${w.humidity}%, Conditions: ${w.desc}\n\n` +
      `Provide:\n1. Farming impact assessment for today\n2. Irrigation recommendation\n` +
      `3. Crop protection advice\n4. Best activities to do today on farm\n5. Any weather warnings for farmers\n\n` +
      `Keep it practical and specific. No markdown.`,
      "You are an expert agricultural weather advisor for Indian farmers."
    );
    showAIResult(box, result);
  } catch(e) {
    box.innerHTML = `<div class="ai-result-label">◉ ERROR</div>${e.message}`;
  }
}

/* ── World Weather Quick Cities ─────────────────────────── */
const QUICK_CITIES = [
  "New Delhi","Mumbai","Raipur","Bengaluru","Kolkata",
  "London","New York","Tokyo","Dubai","Sydney",
  "Paris","Toronto","Singapore","Cape Town","São Paulo",
];
function renderQuickCities() {
  const el = document.getElementById("quickCities");
  if (!el) return;
  el.innerHTML = QUICK_CITIES.map(c =>
    `<button class="btn btn-ghost btn-sm" onclick="selectCity('${c}')">${c}</button>`
  ).join("");
}
function selectCity(c) {
  document.getElementById("weatherCityInput").value = c;
  searchWeather();
}

/* ── AI Extended Forecast ───────────────────────────────── */
async function getExtendedForecast() {
  const city = document.getElementById("weatherCityInput").value.trim() || "India";
  const box  = document.getElementById("extForecastBox");
  showAILoading(box);
  const btn = document.getElementById("extForecastBtn");
  btn.disabled = true;
  try {
    const result = await askClaude(
      `You are an agricultural weather forecaster.\n` +
      `Give a 14-day farming weather outlook for ${city}.\n` +
      `For each week: overall pattern, temperature trend, rainfall expectation, and 3 key farming actions.\n` +
      `Then give a seasonal outlook for the next month.\n` +
      `Be specific to local farming conditions. No markdown.`,
      "You are an expert agricultural weather forecaster."
    );
    showAIResult(box, result);
  } catch(e) {
    box.innerHTML = `<div class="ai-result-label">◉ ERROR</div>${e.message}`;
  }
  btn.disabled = false;
}

/* ============================================================
   MARKET PAGE
============================================================ */
const MARKET_DATA = [
  { crop:"🌾 Wheat",     price:2450, unit:"Quintal", change:2.1,  color:"var(--accent2)", trend:[42,45,43,48,46,51,52] },
  { crop:"🍚 Rice",      price:3200, unit:"Quintal", change:4.3,  color:"var(--green)",   trend:[58,62,60,65,68,72,75] },
  { crop:"🌽 Maize",     price:2100, unit:"Quintal", change:-1.2, color:"var(--accent4)", trend:[38,36,40,35,38,37,36] },
  { crop:"🫘 Soybean",   price:4200, unit:"Quintal", change:6.8,  color:"var(--accent1)", trend:[70,75,72,80,82,88,92] },
  { crop:"🌿 Cotton",    price:6500, unit:"Quintal", change:1.5,  color:"var(--accent3)", trend:[110,115,112,118,120,116,122] },
  { crop:"🎋 Sugarcane", price:350,  unit:"Quintal", change:0,    color:"var(--text-dim)",trend:[30,32,31,33,32,34,33] },
  { crop:"🥔 Potato",    price:1200, unit:"Quintal", change:-2.1, color:"var(--accent2)", trend:[22,20,21,18,19,17,18] },
  { crop:"🍅 Tomato",    price:2800, unit:"Quintal", change:8.5,  color:"var(--accent3)", trend:[40,42,48,55,60,65,72] },
  { crop:"🧅 Onion",     price:1800, unit:"Quintal", change:3.2,  color:"var(--accent1)", trend:[28,30,32,30,35,36,38] },
  { crop:"🫑 Chili",     price:9500, unit:"Quintal", change:5.1,  color:"var(--accent2)", trend:[85,88,90,92,95,98,102] },
  { crop:"🫙 Mustard",   price:5200, unit:"Quintal", change:1.8,  color:"var(--green)",   trend:[88,90,92,91,95,96,98] },
  { crop:"🌻 Sunflower", price:5800, unit:"Quintal", change:3.5,  color:"var(--accent2)", trend:[95,98,100,102,105,108,112] },
];

function renderMarketCards() {
  const grid = document.getElementById("marketGrid");
  if (!grid) return;
  grid.innerHTML = MARKET_DATA.map(m => {
    const up = m.change > 0;
    const tagClass = m.change > 0 ? "tag-green" : m.change < 0 ? "tag-red" : "tag-teal";
    const changeStr = m.change===0 ? "0.0%" : `${m.change>0?"+":""}${m.change}%`;
    return `
    <div class="card market-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div class="market-crop">${m.crop}</div>
        <span class="tag ${tagClass}">${changeStr}</span>
      </div>
      <div class="market-price" style="color:${m.color}">₹${m.price.toLocaleString()}</div>
      <div class="market-unit">PER ${m.unit.toUpperCase()}</div>
      <canvas id="mSpk_${m.crop.replace(/[^a-z]/gi,'')}" height="40" style="width:100%"></canvas>
    </div>`;
  }).join("");
  // Render sparklines
  setTimeout(() => {
    MARKET_DATA.forEach(m => {
      renderSparkline(`mSpk_${m.crop.replace(/[^a-z]/gi,"")}`, m.trend, m.color.replace("var(--green)","#34d978").replace("var(--accent2)","#fbbf24").replace("var(--accent1)","#2dd4bf").replace("var(--accent3)","#f87171").replace("var(--accent4)","#60a5fa").replace("var(--text-dim)","#7a9e8a"));
    });
  }, 100);
}

async function runMarketAnalysis() {
  const box = document.getElementById("marketAnalysisBox");
  showAILoading(box);
  const btn = document.getElementById("marketAnalysisBtn");
  btn.disabled = true;
  try {
    const result = await askClaude(
      `You are a mandi market analyst for Indian agriculture.\n` +
      `Current market snapshot: Wheat ₹2450, Rice ₹3200, Maize ₹2100, Soybean ₹4200, Cotton ₹6500.\n\n` +
      `Provide:\n1. Top 3 crops with best price momentum right now\n2. Why prices are moving (supply/demand/export)\n` +
      `3. Best selling strategy for Kharif farmers this month\n4. Storage recommendations for 3 months\n` +
      `5. Price outlook for next 30 days\n\nBe specific to Indian mandi market. No markdown.`,
      "You are an expert agricultural market analyst for Indian mandi prices."
    );
    showAIResult(box, result);
  } catch(e) {
    box.innerHTML = `<div class="ai-result-label">◉ ERROR</div>${e.message}`;
  }
  btn.disabled = false;
}

async function runSellStrategy() {
  const crop = document.getElementById("sellCropSel").value;
  const box  = document.getElementById("sellStrategyBox");
  showAILoading(box);
  const btn = document.getElementById("sellStrategyBtn");
  btn.disabled = true;
  try {
    const result = await askClaude(
      `You are an agricultural market advisor for Indian farmers.\n` +
      `Crop: ${crop}\n\nProvide a comprehensive selling strategy:\n` +
      `1. Current price analysis and 30-day outlook\n2. Best time to sell (hold or sell now?)\n` +
      `3. Storage tips if holding\n4. Best mandis in India for this crop\n` +
      `5. Export opportunity if any\n6. Value addition ideas to increase profit\n\nNo markdown. Be specific.`,
      "You are an expert agricultural market advisor."
    );
    showAIResult(box, result);
  } catch(e) {
    box.innerHTML = `<div class="ai-result-label">◉ ERROR</div>${e.message}`;
  }
  btn.disabled = false;
}

/* ============================================================
   SCHEMES PAGE
============================================================ */
const SCHEMES = [
  { name:"PM Kisan Samman Nidhi",    icon:"💰", tag:"Financial Aid", color:"amber",  benefit:"₹6,000/year direct bank transfer" },
  { name:"PM Fasal Bima Yojana",      icon:"🌾", tag:"Crop Insurance",color:"green",  benefit:"Crop loss insurance coverage" },
  { name:"Kisan Credit Card",          icon:"💳", tag:"Credit",        color:"blue",   benefit:"Low-interest farm loans" },
  { name:"PM Krishi Sinchai Yojana",   icon:"💧", tag:"Irrigation",    color:"teal",   benefit:"Drip & sprinkler subsidy" },
  { name:"Soil Health Card Scheme",     icon:"🧪", tag:"Soil Testing",  color:"red",    benefit:"Free soil analysis card" },
  { name:"eNAM Market Platform",       icon:"📈", tag:"Market Access", color:"amber",  benefit:"Pan-India online mandi" },
  { name:"PKVY Organic Mission",       icon:"🌿", tag:"Organic",       color:"green",  benefit:"₹50,000/ha for organic farming" },
  { name:"Kisan Drone Yojana",         icon:"🚁", tag:"Technology",    color:"blue",   benefit:"Subsidy on agricultural drones" },
  { name:"PM Kusum Yojana",            icon:"☀️", tag:"Solar",         color:"amber",  benefit:"Solar pump subsidy for farmers" },
  { name:"National Beekeeping Mission",icon:"🐝", tag:"Allied",        color:"teal",   benefit:"Training + equipment support" },
  { name:"National Horticulture Mission",icon:"🍎",tag:"Horticulture", color:"red",    benefit:"Subsidy for fruit/veg crops" },
  { name:"Rashtriya Krishi Vikas Yojana",icon:"🏛",tag:"Development",  color:"purple", benefit:"Infrastructure & tech support" },
];

function renderSchemes() {
  const grid = document.getElementById("schemesGrid");
  if (!grid) return;
  grid.innerHTML = SCHEMES.map((s,i) => `
    <div class="card scheme-card" onclick="loadSchemeDetail('${s.name.replace(/'/g,"\\'")}')">
      <div class="scheme-icon">${s.icon}</div>
      <span class="tag tag-${s.color}">${s.tag}</span>
      <div class="scheme-name">${s.name}</div>
      <div class="scheme-benefit">${s.benefit}</div>
      <div class="scheme-cta">▷ CLICK FOR AI DETAILS</div>
    </div>`).join("");
}

let lastScheme = "";
async function loadSchemeDetail(name) {
  if (lastScheme === name) return;
  lastScheme = name;
  const box   = document.getElementById("schemeDetailBox");
  const title = document.getElementById("schemeDetailTitle");
  title.textContent = name.toUpperCase();
  box.parentElement.style.display = "block";
  showAILoading(box);
  try {
    const result = await askClaude(
      `You are a government scheme expert for Indian farmers.\n` +
      `Explain the "${name}" scheme in full detail:\n` +
      `1. What is it? (2 lines)\n2. Eligibility criteria\n3. Documents required\n` +
      `4. How to apply (step by step)\n5. Benefit amount/details\n6. Application deadline or cycle\n` +
      `7. Official website or helpline\n8. Common mistakes to avoid\n\nNo markdown. Be comprehensive.`,
      "You are an expert government scheme advisor for Indian farmers."
    );
    showAIResult(box, result);
  } catch(e) {
    box.innerHTML = `<div class="ai-result-label">◉ ERROR</div>${e.message}`;
  }
}

/* ============================================================
   COMMUNITY PAGE
============================================================ */
function renderCommunity() {
  renderFeed();
}

function renderFeed() {
  const feed = document.getElementById("communityFeed");
  if (!feed) return;
  feed.innerHTML = App.posts.map(post => {
    const initial = post.user[0].toUpperCase();
    const tagClass = { "Crop Update":"tag-green", "Finance":"tag-amber", "Market":"tag-blue", "Technology":"tag-teal", "Weather":"tag-blue" }[post.tag] || "tag-green";
    return `
    <div class="card feed-card" id="post_${post.id}">
      <div class="feed-user-row">
        <div class="feed-avatar">${initial}</div>
        <div style="flex:1">
          <div class="feed-username">${post.user}</div>
          <div class="feed-time">${post.time}</div>
        </div>
        <span class="tag ${tagClass}">${post.tag}</span>
      </div>
      <div class="feed-caption">${post.text}</div>
      <div class="feed-actions">
        <button class="btn btn-ghost btn-sm" onclick="toggleLike(${post.id})" id="likeBtn_${post.id}">
          ${post.liked ? "❤️" : "♥"} <span id="likeCount_${post.id}">${post.likes}</span>
        </button>
        <button class="btn btn-ghost btn-sm" onclick="getAIReply(${post.id})" id="aiReplyBtn_${post.id}">
          ◉ AI Reply
        </button>
        <button class="btn btn-ghost btn-sm" onclick="toggleCommentBox(${post.id})">
          💬 Comment
        </button>
      </div>
      <div id="aiReply_${post.id}" class="ai-result" style="display:none;margin-top:10px"></div>
      <div id="commentBox_${post.id}" style="display:none;margin-top:10px">
        <div style="display:flex;gap:8px">
          <input class="input-field" id="commentInput_${post.id}" placeholder="Write a comment..." style="flex:1">
          <button class="btn btn-primary btn-sm" onclick="submitComment(${post.id})">Send</button>
        </div>
        <div id="commentsList_${post.id}" style="margin-top:8px"></div>
      </div>
    </div>`;
  }).join("");
}

function toggleLike(id) {
  const post = App.posts.find(p => p.id===id);
  if (!post) return;
  post.liked = !post.liked;
  post.likes += post.liked ? 1 : -1;
  document.getElementById(`likeBtn_${id}`).innerHTML =
    `${post.liked?"❤️":"♥"} <span id="likeCount_${id}">${post.likes}</span>`;
}

function toggleCommentBox(id) {
  const box = document.getElementById(`commentBox_${id}`);
  box.style.display = box.style.display === "none" ? "block" : "none";
}

const postComments = {};
function submitComment(id) {
  const input = document.getElementById(`commentInput_${id}`);
  const text  = input.value.trim();
  if (!text) return;
  if (!postComments[id]) postComments[id] = [];
  postComments[id].push({ user: App.username, text });
  input.value = "";
  const list = document.getElementById(`commentsList_${id}`);
  list.innerHTML = postComments[id].map(c => `
    <div style="padding:8px;border-radius:8px;background:var(--surface2);margin-bottom:6px;font-size:13px">
      <b style="color:var(--green)">${c.user}</b>: ${c.text}
    </div>`).join("");
  toast("Comment posted!");
}

async function getAIReply(id) {
  const post = App.posts.find(p => p.id===id);
  if (!post) return;
  const box = document.getElementById(`aiReply_${id}`);
  const btn = document.getElementById(`aiReplyBtn_${id}`);
  btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Thinking...`;
  showAILoading(box);
  try {
    const result = await askClaude(
      `You are an experienced Indian farmer and agricultural advisor.\n` +
      `A farmer posted: "${post.text}"\n\n` +
      `Reply with:\n1. Acknowledgment of their experience/observation\n2. Practical farming advice\n` +
      `3. A relevant tip or suggestion\n\nKeep it conversational, 3-4 sentences. No markdown.`,
      "You are a friendly and knowledgeable Indian farmer."
    );
    showAIResult(box, result);
  } catch(e) {
    box.innerHTML = `<div class="ai-result-label">◉ ERROR</div>${e.message}`;
  }
  btn.disabled = false; btn.innerHTML = "◉ AI Reply";
}

function submitPost() {
  const caption = document.getElementById("newPostCaption").value.trim();
  const tag     = document.getElementById("newPostTag").value;
  if (!caption) { toast("Write something first","error"); return; }
  App.posts.unshift({
    id: Date.now(), user: App.username,
    time:"Just now", text:caption, likes:0, tag, liked:false,
  });
  document.getElementById("newPostCaption").value = "";
  renderFeed();
  toast("Post shared with the community!");
}

/* ============================================================
   PROFILE PAGE
============================================================ */
let profileData = {
  username: "Farmer", phone:"", village:"", district:"Raipur", state:"Chhattisgarh", bio:"",
};
function renderProfile() {
  document.getElementById("profileUsername").textContent  = App.username;
  document.getElementById("profileAvatar").textContent    = App.username[0]?.toUpperCase();
  document.getElementById("profileAvatarSm").textContent  = App.username[0]?.toUpperCase();
  document.getElementById("profileFarms").textContent     = App.farms.length;
  document.getElementById("profileCrops").textContent     = App.crops.length;
  const totalRev = App.crops.reduce((s,c)=>s+c.revenue,0);
  document.getElementById("profileRevenue").textContent   = `₹${(totalRev/1000).toFixed(1)}k`;
}

async function generateAIBio() {
  const district = document.getElementById("editDistrict").value || profileData.district || "Raipur";
  const state    = document.getElementById("editState").value    || profileData.state    || "Chhattisgarh";
  const box      = document.getElementById("aiProfileBox");
  showAILoading(box);
  box.style.display = "block";
  const btn = document.getElementById("aiBioBtn");
  btn.disabled = true;
  try {
    const result = await askClaude(
      `Write a professional farmer profile bio for ${App.username} who farms in ${district}, ${state}, India.\n` +
      `Make it: warm, authentic, inspiring, 3-4 sentences.\n` +
      `Mention: smart farming with AI tools, commitment to sustainable agriculture, and community involvement.\n` +
      `No markdown.`
    );
    document.getElementById("editBio").value = result;
    showAIResult(box, result);
  } catch(e) {
    box.innerHTML = `<div class="ai-result-label">◉ ERROR</div>${e.message}`;
  }
  btn.disabled = false;
}

function saveProfile() {
  profileData.phone    = document.getElementById("editPhone").value.trim();
  profileData.village  = document.getElementById("editVillage").value.trim();
  profileData.district = document.getElementById("editDistrict").value.trim();
  profileData.state    = document.getElementById("editState").value.trim();
  profileData.bio      = document.getElementById("editBio").value.trim();
  toast("Profile saved successfully!");
}

/* ============================================================
   AUTH
============================================================ */
function showLogin() {
  document.getElementById("authPage").style.display = "flex";
  document.getElementById("app").style.display      = "none";
  document.getElementById("authTitle").textContent  = "Welcome Back";
  document.getElementById("authSub").textContent    = "India's Smart Farming AI Platform";
  document.getElementById("authMode").textContent   = "login";
  document.getElementById("confirmGroup").style.display = "none";
  document.getElementById("authError").style.display   = "none";
}
function showRegister() {
  document.getElementById("authTitle").textContent  = "Create Account";
  document.getElementById("authSub").textContent    = "Join India's Smart Farming Network";
  document.getElementById("authMode").textContent   = "register";
  document.getElementById("confirmGroup").style.display = "block";
  document.getElementById("authError").style.display   = "none";
}
function switchAuth() {
  const mode = document.getElementById("authMode").textContent;
  mode === "login" ? showRegister() : showLogin();
}
function handleAuth() {
  const mode     = document.getElementById("authMode").textContent;
  const username = document.getElementById("authUsername").value.trim();
  const password = document.getElementById("authPassword").value;
  const confirm  = document.getElementById("authConfirm").value;
  const errEl    = document.getElementById("authError");
  errEl.style.display = "none";

  if (!username || !password) { errEl.textContent="Fill all fields"; errEl.style.display="block"; return; }
  if (mode==="register") {
    if (password.length < 6) { errEl.textContent="Password must be 6+ characters"; errEl.style.display="block"; return; }
    if (password!==confirm)  { errEl.textContent="Passwords do not match"; errEl.style.display="block"; return; }
  }
  // Simulate login
  App.username = username;
  profileData.username = username;
  document.getElementById("sidebarUserName").textContent   = username;
  document.getElementById("topbarUsername").textContent    = username;
  document.getElementById("sidebarAvatarText").textContent = username[0]?.toUpperCase();
  document.getElementById("topbarAvatarText").textContent  = username[0]?.toUpperCase();
  document.getElementById("authPage").style.display = "none";
  document.getElementById("app").style.display      = "flex";
  navigate("dashboard");
  toast(`Welcome, ${username}! 🌾`);
}
function handleLogout() {
  showLogin();
  toast("Logged out successfully","info");
}

/* ============================================================
   MODAL HELPERS
============================================================ */
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}
// Close on overlay click
document.addEventListener("click", e => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("open");
  }
});

/* ============================================================
   INIT
============================================================ */
window.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  renderQuickCities();
  renderSchemes();
  // Default: show auth page
  showLogin();
  // Connect all nav links
  document.querySelectorAll("[data-page]").forEach(el => {
    el.addEventListener("click", () => navigate(el.dataset.page));
  });
  // Theme buttons
  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.addEventListener("click", () => setTheme(btn.dataset.t));
  });
  // Enter key for weather
  document.getElementById("weatherCityInput")?.addEventListener("keydown", e => {
    if (e.key==="Enter") searchWeather();
  });
  // Enter key for auth
  document.addEventListener("keydown", e => {
    if (e.key==="Enter") {
      if (document.getElementById("authPage").style.display!=="none") handleAuth();
    }
  });
});