"use strict";

/* ── BASE SYSTEM DATA INSTANCES ── */
const App = {
  page: "dashboard",
  username: "Kisan_SaaS",
  theme: "green",
  farms: [
    { id:1, name:"Green Valley Cluster 01", location:"Raipur, CG", area:5.5, soil:"Loamy", created:"12 Jan 2026" },
    { id:2, name:"Sunrise Grid Alpha",    location:"Durg, CG",   area:3.2, soil:"Black Cotton", created:"18 Mar 2026" },
  ],
  crops: [
    { id:1, farmId:1, name:"Rice Core",   season:"Kharif", status:"Growing",   production:1200, revenue:38400 },
    { id:2, farmId:1, name:"Wheat Node",  season:"Rabi",   status:"Harvested", production:800,  revenue:19600 },
    { id:3, farmId:2, name:"Soybean Max", season:"Kharif", status:"Growing",   production:500,  revenue:21000 },
  ],
  posts: [
    { id:1, user:"Ramesh Kumar", time:"2h ago", text:"Rice crop biomass showing optimal expansion arrays following monsoon calibration vectors in Raipur region. Anyone experiencing visual variations?", likes:14, tag:"Crop Update", liked:false },
    { id:2, user:"Priya Devi",   time:"5h ago", text:"Verified central funding allocations have routed successfully into linked agricultural wallets. Confirm your structural verification status.", likes:28, tag:"Finance", liked:false },
  ],
  cropRecos: [],
  weatherCache: {},
};

/* ── SYSTEM UI NOTIFICATION EMULATOR ── */
function toast(msg, type = "success") {
  const icons = { success:"✅", error:"❌", info:"⚡" };
  const tc = document.getElementById("toastContainer");
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]||"⚡"}</span> ${msg}`;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* ── CLUSTER APPEARANCE CONTROLLER ── */
function setTheme(name) {
  App.theme = name;
  document.documentElement.setAttribute("data-theme", name === "green" ? "" : name);
  document.querySelectorAll(".theme-btn").forEach(b => b.classList.toggle("active", b.dataset.t === name));
}

/* ── CLIENT SYSTEM SPA NAVIGATION MATRIX ── */
function navigate(pageId) {
  App.page = pageId;
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(l => l.classList.toggle("active", l.dataset.page === pageId));
  
  const el = document.getElementById(`page-${pageId}`);
  if (el) el.classList.add("active");

  document.getElementById("topbarBreadcrumb").textContent = `AGRINOVA / ${pageId.toUpperCase()}`;
  
  if (pageId === "dashboard") renderDashboard();
  if (pageId === "farms")     renderFarms();
  if (pageId === "crops")     renderCropTable();
  if (pageId === "community") renderCommunity();
  if (pageId === "market")    renderMarketCards();
  if (pageId === "profile")   renderProfile();
  
  // Close sidebar mobile view on navigating
  document.getElementById("sidebar").classList.remove("open");
}

function toggleSidebar() { document.getElementById("sidebar").classList.toggle("open"); }

/* ============================================================
   DASHBOARD COMPONENT SUBROUTINES
============================================================ */
function renderDashboard() {
  const totalRev = App.crops.reduce((s,c) => s + c.revenue, 0);
  document.getElementById("stat-farms").textContent = App.farms.length;
  document.getElementById("stat-crops").textContent = App.crops.length;
  document.getElementById("stat-rev").textContent   = `₹${(totalRev/1000).toFixed(1)}k`;
  renderBarChart();
  renderSparkline("dashSparkHealth", [88, 90, 89, 93, 91, 94, 95], "var(--green)");
}

function renderBarChart() {
  const data = [42, 48, 55, 61, 70, 75, 68, 82, 91, 96];
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  const max = Math.max(...data);
  const container = document.getElementById("barChart");
  if (!container) return;
  container.innerHTML = data.map((v, i) => {
    const h = Math.max(10, (v / max) * 140);
    const isLast = i === data.length - 1;
    const bg = isLast ? "linear-gradient(180deg, var(--green), var(--green-dark))" : "rgba(52,211,120,0.15)";
    return `
      <div class="bar-col">
        <span class="bar-val">${v}</span>
        <div class="bar-body" style="height:${h}px;background:${bg};"></div>
        <span class="bar-lbl">${labels[i]}</span>
      </div>`;
  }).join("");
}

function renderSparkline(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width = 120;
  const H = canvas.height = 30;
  ctx.clearRect(0,0,W,H);
  const min = Math.min(...data), max = Math.max(...data), range = (max-min)||1;
  const pts = data.map((v,i) => [(i/(data.length-1))*W, H - ((v-min)/range)*(H-6) - 3]);
  ctx.beginPath();
  pts.forEach(([x,y],i) => i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y));
  ctx.strokeStyle = color.includes("var(--green)") ? "#34d978" : color;
  ctx.lineWidth = 2; ctx.stroke();
}

/* ============================================================
   FARM NODES MANAGEMENT AGGREGATORS
============================================================ */
function renderFarms() {
  const grid = document.getElementById("farmsGrid");
  if (!grid) return;
  grid.innerHTML = App.farms.map(farm => {
    const fCrops = App.crops.filter(c => c.farmId === farm.id);
    const rev = fCrops.reduce((s,c)=>s+c.revenue,0);
    return `
    <div class="card">
      <div style="font-size:24px;margin-bottom:8px;">⬡</div>
      <h3 class="section-title">${farm.name}</h3>
      <div class="info-row"><span class="info-key">Location Vector</span><span class="info-val">${farm.location}</span></div>
      <div class="info-row"><span class="info-key">Total Boundary</span><span class="info-val">${farm.area} Acres</span></div>
      <div class="info-row"><span class="info-key">Substrate Matrix</span><span class="info-val">${farm.soil}</span></div>
      <div class="info-row"><span class="info-key">Monitored Loops</span><span class="info-val">${fCrops.length} Yields</span></div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn btn-ghost btn-sm btn-full" onclick="deleteFarm(${farm.id})">Decommission Node</button>
      </div>
    </div>`;
  }).join("");
}

function openAddFarm() { openModal("farmModal"); }
function saveFarm() {
  const name = document.getElementById("farmName").value.trim();
  const loc = document.getElementById("farmLocation").value.trim();
  const area = parseFloat(document.getElementById("farmArea").value) || 0;
  const soil = document.getElementById("farmSoil").value;
  if (!name || !loc) { toast("Invalid telemetry initialization fields","error"); return; }
  App.farms.push({ id: Date.now(), name, location: loc, area, soil, created: "June 2026" });
  closeModal("farmModal"); renderFarms(); renderDashboard();
  toast("Registered system database pipeline node");
}
function deleteFarm(id) {
  App.farms = App.farms.filter(f => f.id !== id);
  renderFarms(); renderDashboard();
  toast("Decommissioned infrastructure array matrix node", "info");
}

/* ============================================================
   CROP ENGINE MATRIX LAYER SUB SYSTEMS
============================================================ */
function switchCropTab(tabId) {
  document.querySelectorAll("#page-crops .tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll("#page-crops .tab-panel").forEach(p => p.classList.remove("active"));
  if(tabId === 'crops') { document.getElementById("tabBtnCrops").classList.add("active"); document.getElementById("panelCrops").classList.add("active"); }
  if(tabId === 'ai') { document.getElementById("tabBtnAI").classList.add("active"); document.getElementById("panelAI").classList.add("active"); }
  if(tabId === 'disease') { document.getElementById("tabBtnDisease").classList.add("active"); document.getElementById("panelDisease").classList.add("active"); }
}

function renderCropTable() {
  const tbody = document.getElementById("cropTableBody");
  if (!tbody) return;
  tbody.innerHTML = App.crops.map(c => {
    const farm = App.farms.find(f => f.id===c.farmId);
    return `
    <tr>
      <td style="font-weight:700">🌱 ${c.name}</td>
      <td>${farm?.name||"Global Matrix Shared Stack"}</td>
      <td><span class="tag tag-blue">${c.season}</span></td>
      <td style="font-family:var(--mono)">${c.production} kg</td>
      <td style="font-family:var(--mono);color:var(--green)">₹${c.revenue.toLocaleString()}</td>
      <td><span class="tag tag-green">● ${c.status}</span></td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteCrop(${c.id})">✕</button></td>
    </tr>`;
  }).join("");
}

function openAddCrop() {
  const sel = document.getElementById("cropFarmSel");
  sel.innerHTML = App.farms.map(f => `<option value="${f.id}">${f.name}</option>`).join("");
  openModal("cropModal");
}
function saveCrop() {
  const farmId = parseInt(document.getElementById("cropFarmSel").value);
  const name = document.getElementById("cropName").value.trim();
  const season = document.getElementById("cropSeason").value;
  const status = document.getElementById("cropStatus").value;
  const prod = parseFloat(document.getElementById("cropProd").value) || 0;
  const rev = parseFloat(document.getElementById("cropRev").value) || 0;
  if(!name) { toast("Missing parameters","error"); return; }
  App.crops.push({ id: Date.now(), farmId, name, season, status, production: prod, revenue: rev });
  closeModal("cropModal"); renderCropTable(); renderDashboard();
  toast("Injected cultivation index model entry points");
}
function deleteCrop(id) {
  App.crops = App.crops.filter(c => c.id !== id);
  renderCropTable(); renderDashboard(); toast("Purged target data vector index", "info");
}

/* ── MOCK AI PIPELINE FULFILLMENT MATRIX CONTROLLERS ── */
function loadMoreCropRecos() {
  const grid = document.getElementById("cropRecoGrid");
  const btn = document.getElementById("loadMoreCropsBtn");
  btn.innerHTML = `<span class="spinner"></span> Parsing Matrix Clusters...`;
  btn.disabled = true;

  setTimeout(() => {
    const soil = document.getElementById("cropAdvisorSoil").value;
    const season = document.getElementById("cropAdvisorSeason").value;
    const mockData = [
      { name: "Premium Basmati Hybrid", water: "High Target Flow", yield: "24-28 Q/Acre", price: "₹4,500/Q", tip: "Execute constant matrix loop hydration monitoring system parameters during early phase states." },
      { name: "Black Matpe Pulse Loop", water: "Low Target Array", yield: "8-12 Q/Acre", price: "₹7,200/Q", tip: "Maintain optimal nitrogen cluster aeration vectors to mitigate moisture rot mutations." },
      { name: "Golden Mustard Bio Node", water: "Medium Vector", yield: "15-18 Q/Acre", price: "₹5,450/Q", tip: "Calibrate localized thermal telemetry arrays to suppress early stage micro-pathogen formations." }
    ];

    grid.innerHTML = mockData.map(c => `
      <div class="crop-reco-card">
        <div class="crop-reco-name">⚡ ${c.name}</div>
        <div class="crop-reco-meta">
          <div>🧬 <b>Substrate Context:</b> Specified ${soil} Array</div>
          <div>🌦 <b>Temporal Timeline:</b> ${season} Loop Array</div>
          <div>💧 <b>Hydration Flux:</b> ${c.water}</div>
          <div>📊 <b>Output Density:</b> ${c.yield}</div>
          <div>💰 <b>Target Asset Value:</b> ${c.price}</div>
          <div style="margin-top:8px;color:var(--green)">💡 <b>Agronomy Directive:</b> ${c.tip}</div>
        </div>
      </div>
    `).join("");

    btn.innerHTML = `⊕ Execute Matrix Search`;
    btn.disabled = false;
    toast("Synchronized optimized system agronomy blueprints");
  }, 1200);
}

function runDiseaseDetection() {
  const box = document.getElementById("diseaseResult");
  const btn = document.getElementById("diseaseBtnScan");
  btn.innerHTML = `<span class="spinner"></span> Running Telemetry Tensors...`;
  btn.disabled = true;
  box.innerHTML = `
    <div class="ai-result-label">◉ PROCESSING RECOGNITION MODELS</div>
    <div class="skeleton-line" style="width:90%"></div>
    <div class="skeleton-line" style="width:75%"></div>
  `;
  box.style.display = "block";

  setTimeout(() => {
    box.innerHTML = `
      <div class="ai-result-label">◉ VISION MODEL BALANCED OUTPUT</div>
      <div style="font-weight:700;color:var(--accent3);font-size:15px;margin-bottom:6px;">Target Result Isolation: Cercospora Structural Pathogen Blight</div>
      <div style="font-size:13px;color:var(--text-dim);">
        • Isolation Confidence Match Coefficient: 94.82% Tensor Range<br>
        • System Severity Matrix Threshold: Moderate Micro Scale Vector<br>
        • Remediation Action Loop: Inject organic copper vector formulations immediately. Halt systemic high nitrogen payload distribution algorithms across sector infrastructure grid.
      </div>
    `;
    btn.innerHTML = `Run Real-time Diagnostic Sequence`;
    btn.disabled = false;
    toast("Vision analytics telemetry pass validated");
  }, 1500);
}

/* ============================================================
   REAL TIME OPEN METEO METRIC WEATHER PIPELINE
============================================================ */
async function fetchWeatherPayload(city) {
  const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&format=json`);
  const geoData = await geoRes.json();
  if (!geoData.results?.length) throw new Error("Target cluster terminal geo array coordinates unmapped.");
  const { latitude: lat, longitude: lon, name } = geoData.results[0];

  const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`);
  const wxData = await wxRes.json();
  return { city: name, temp: Math.round(wxData.current_weather.temperature), wind: Math.round(wxData.current_weather.windspeed), code: wxData.current_weather.weathercode, daily: wxData.daily };
}

async function searchWeather() {
  const city = document.getElementById("weatherCityInput").value.trim();
  if(!city) return;
  const btn = document.getElementById("weatherSearchBtn");
  btn.innerHTML = `<span class="spinner"></span> Accessing Nodes...`;
  btn.disabled = true;
  document.getElementById("weatherError").style.display = "none";

  try {
    const data = await fetchWeatherPayload(city);
    document.getElementById("weatherMain").style.display = "block";
    document.getElementById("wCity").textContent = `${data.city}, IN`;
    document.getElementById("wTemp").textContent = `${data.temp}°C`;
    document.getElementById("wWind").textContent = `${data.wind} km/h`;
    
    // Emulate daily forecast blocks mapping
    const fRow = document.getElementById("forecastRow");
    fRow.innerHTML = data.daily.time.map((t, i) => `
      <div class="forecast-day">
        <div class="forecast-day-name">${t.substring(5)}</div>
        <div class="forecast-day-icon">🌤</div>
        <div class="forecast-day-hi">${Math.round(data.daily.temperature_2m_max[i])}°</div>
      </div>
    `).join("");

    document.getElementById("weatherAdviceBox").innerHTML = `
      <div class="ai-result-label">◉ STRATEGY ANALYSIS DIRECTIVE ARRAY</div>
      <div style="font-size:13px;color:var(--text-dim)">
        Current parameters at vector checkpoint ${data.city} remain ideal for crop maintenance cycles. Irrigation delivery channels should balance system pressure loops to save resource allocation metrics.
      </div>
    `;
    
    renderSparkline("weatherSparkline", data.daily.temperature_2m_max, "var(--green)");
    toast("Synchronized atmospheric vector frameworks");
  } catch (err) {
    document.getElementById("weatherError").textContent = `⚠️ Infrastructure Fault Error: ${err.message}`;
    document.getElementById("weatherError").style.display = "block";
  } finally {
    btn.innerHTML = `◎ Query Array Network`;
    btn.disabled = false;
  }
}

function selectCity(c) { document.getElementById("weatherCityInput").value = c; searchWeather(); }

/* ============================================================
   MANDI SYSTEM MARKET PIPELINES ARCHITECTURE
============================================================ */
const STACK_MANDI = [
  { crop: "🌾 Wholesale Wheat Futures", price: 2450, unit: "Q", change: "+2.1%" },
  { crop: "🍚 Raw Paddy Grain Loop", price: 3200, unit: "Q", change: "+4.3%" },
  { crop: "🌽 Yellow Maize Feed Stock", price: 2100, unit: "Q", change: "-1.2%" },
  { crop: "🫘 Organic Soy Protein Node", price: 4200, unit: "Q", change: "+6.8%" }
];

function renderMarketCards() {
  const grid = document.getElementById("marketGrid");
  if (!grid) return;
  grid.innerHTML = STACK_MANDI.map(m => {
    const isUp = m.change.startsWith("+");
    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;">
          <span class="market-crop">${m.crop}</span>
          <span class="tag ${isUp ? 'tag-green':'tag-red'}">${m.change}</span>
        </div>
        <div class="market-price" style="margin:10px 0 4px;color:var(--accent2)">₹${m.price.toLocaleString()}</div>
        <div class="market-unit">PER CENTRAL STANDARD UNIT (${m.unit})</div>
      </div>
    `;
  }).join("");
}

function runMarketAnalysis() {
  const box = document.getElementById("marketAnalysisBox");
  box.innerHTML = `
    <div class="ai-result-label">◉ STRATEGY INSIGHT DELIVERABLE FEED</div>
    <p style="font-size:13px;">Macro supply chains indicate high demand index thresholds for Soy and Paddy vectors inside central sector warehousing grids. Recommendation logic dictates holding wheat assets for an expected 14-day pipeline upward compression wave loop anomaly.</p>
  `;
  box.style.display = "block";
  toast("Market optimization sequence completed");
}

/* ============================================================
   STATE SCHEMES SUBSIDIES SUBSYSTEM ARCHITECTURES
============================================================ */
const MATRIX_SCHEMES = [
  { name: "PM Kisan Samman Deployment Nidhi", benefit: "Direct digital capital infrastructure injection of ₹6,000 yearly intervals." },
  { name: "PM Fasal Bima Insurance Protocol", benefit: "Risk decentralization loops offering systemic validation against yield failures." },
  { name: "Kisan Credit Low-Interest Leverage", benefit: "Fluid micro financing capital access routes sitting at 4% flat base parameter bounds." }
];

function renderSchemes() {
  const grid = document.getElementById("schemesGrid");
  if(!grid) return;
  grid.innerHTML = MATRIX_SCHEMES.map(s => `
    <div class="card scheme-card" onclick="loadSchemeDetail('${s.name}')">
      <div class="scheme-icon">🏛</div>
      <div class="scheme-name">${s.name}</div>
      <div class="scheme-benefit">${s.benefit}</div>
      <div style="font-family:var(--mono);font-size:9px;color:var(--green)">▷ PARSE SUITE AI MATRIX LOGIC</div>
    </div>
  `).join("");
}

function loadSchemeDetail(name) {
  const box = document.getElementById("schemeDetailBox");
  document.getElementById("schemeDetailTitle").textContent = name;
  box.innerHTML = `
    <div class="ai-result-label">◉ AI SCHEME VERIFICATION DIRECTIVE VALIDATED</div>
    <p style="font-size:13px;color:var(--text-dim)">
      • Structural Eligibility Matrix: Verified operational farm node footprints.<br>
      • Required Identification Substrates: Localized bank routing codes and biometric verification data arrays.<br>
      • Operational Workflow Path: Access the official deployment terminal node, authenticate user passkey parameters, pass data schemas into registration modules, and track processing arrays.
    </p>
  `;
  toast("Parsed state regulatory operational ledger rules");
}

/* ============================================================
   DECENTRALIZED P2P NETWORK SOCIAL MODULE SYSTEM
============================================================ */
function renderCommunity() {
  const feed = document.getElementById("communityFeed");
  if (!feed) return;
  feed.innerHTML = App.posts.map(p => `
    <div class="card feed-card">
      <div class="feed-user-row">
        <div class="feed-avatar">${p.user[0]}</div>
        <div>
          <div class="feed-username">${p.user}</div>
          <div class="feed-time">${p.time}</div>
        </div>
        <span class="tag tag-teal" style="margin-left:auto;">${p.tag}</span>
      </div>
      <div class="feed-caption">${p.text}</div>
      <div class="feed-actions">
        <button class="btn btn-ghost btn-sm" onclick="toast('Message payload vector tracking verified')">❤️ Endorse Message Packet</button>
      </div>
    </div>
  `).join("");
}

function submitPost() {
  const txt = document.getElementById("newPostCaption").value.trim();
  const tag = document.getElementById("newPostTag").value;
  if(!txt) return;
  App.posts.unshift({ id: Date.now(), user: App.username, time: "Just Now", text: txt, tag: tag });
  document.getElementById("newPostCaption").value = "";
  renderCommunity();
  toast("Broadcast social telemetry array packet globally across the network loop");
}

/* ============================================================
   USER PARAMETERS CONFIGURATION ARCHITECTURE ENGINE
============================================================ */
function renderProfile() {
  document.getElementById("profileUsername").textContent = App.username;
  document.getElementById("profileAvatar").textContent = App.username[0].toUpperCase();
}
function generateAIBio() {
  const box = document.getElementById("aiProfileBox");
  box.innerHTML = `<span class="spinner"></span> Syncing Node Bio Configurations...`;
  box.style.display = "block";
  setTimeout(() => {
    const text = `Enterprise operational node configured to optimize decentralized agricultural processes inside the Raipur sector infrastructure grid arrays. Committed to modern SaaS deployments, neural diagnosis matrices, and algorithmic asset tracking.`;
    document.getElementById("editBio").value = text;
    box.innerHTML = `<div class="ai-result-label">◉ STRUCT PROFILE GENERATED</div>${text}`;
    toast("Profile text models calculated cleanly");
  }, 800);
}
function saveProfile() {
  const name = App.username;
  toast("Committed static execution variable updates into profile register layer");
}

/* ============================================================
   AUTHENTICATION LAYER EMULATORS VALIDATORS
============================================================ */
function switchAuth() {
  const mode = document.getElementById("authMode").textContent;
  if (mode === "login") {
    document.getElementById("authMode").textContent = "register";
    document.getElementById("authTitle").textContent = "Register Infrastructure Node";
    document.getElementById("confirmGroup").style.display = "block";
    document.getElementById("authSwitchText").textContent = "Node already registered?";
    document.getElementById("authSwitchBtn").textContent = "Connect Existing Identity";
  } else {
    document.getElementById("authMode").textContent = "login";
    document.getElementById("authTitle").textContent = "Welcome Back";
    document.getElementById("confirmGroup").style.display = "none";
    document.getElementById("authSwitchText").textContent = "New Node in Platform?";
    document.getElementById("authSwitchBtn").textContent = "Register Node";
  }
}

function handleAuth() {
  const user = document.getElementById("authUsername").value.trim();
  if(!user) {
    const err = document.getElementById("authError");
    err.textContent = "Identifier validation anomaly: Provide valid operational identification tags.";
    err.style.display = "block";
    return;
  }
  App.username = user;
  document.getElementById("sidebarUserName").textContent = user;
  document.getElementById("topbarUsername").textContent = user;
  document.getElementById("sidebarAvatarText").textContent = user[0].toUpperCase();
  document.getElementById("topbarAvatarText").textContent = user[0].toUpperCase();

  document.getElementById("authPage").style.display = "none";
  document.getElementById("app").style.display = "block";
  
  // Initialize layout systems
  setTheme("green");
  navigate("dashboard");
  toast(`Secure node handshake authenticated. welcome online, ${user}.`);
}

function handleLogout() {
  document.getElementById("app").style.display = "none";
  document.getElementById("authPage").style.display = "flex";
  toast("Node sequence disconnected safely from infrastructure.", "info");
}

/* ── BASE HELPER UTILS INTERACTION STRUCTS ── */
function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

/* ── APPLICATION INITIALIZATION TRIGGER HOOKS ── */
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", () => navigate(link.dataset.page));
  });
  document.querySelectorAll(".theme-btn").forEach(b => {
    b.addEventListener("click", () => setTheme(b.dataset.t));
  });
  renderSchemes();
});

const ctx = document.getElementById('yieldChart');

new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan','Feb','Mar','Apr','May'],
        datasets: [{
            label: 'Crop Yield',
            data: [10,20,30,25,40]
        }]
    }
});