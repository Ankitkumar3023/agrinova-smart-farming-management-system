let currentLang = "en";

// 🌐 LANGUAGE DATA
const langData = {
  en: {
    weather: "🌦 Live Weather",
    weatherBtn: "Get Weather",
    crop: "🌱 Crop Suggestion",
    cropBtn: "Suggest Crop",
    disease: "🦠 Disease Detection",
    diseaseBtn: "Detect",
    chart: "📊 Growth Chart",
    voice: "🎤 Voice AI",
    voiceBtn: "Start Voice",
    video: "🎥 Guide",
    videoBtn: "Load",
    placeholder: "Enter city"
  },
  hi: {
    weather: "🌦 मौसम जानकारी",
    weatherBtn: "मौसम देखें",
    crop: "🌱 फसल सुझाव",
    cropBtn: "फसल बताओ",
    disease: "🦠 बीमारी पहचान",
    diseaseBtn: "पहचानें",
    chart: "📊 विकास चार्ट",
    voice: "🎤 वॉइस AI",
    voiceBtn: "बोलना शुरू करें",
    video: "🎥 वीडियो गाइड",
    videoBtn: "लोड करें",
    placeholder: "शहर का नाम डालें"
  }
};

// 🌐 LANGUAGE SWITCH
function setLang(lang) {
  currentLang = lang;

  document.getElementById("weatherTitle").innerText = langData[lang].weather;
  document.getElementById("weatherBtn").innerText = langData[lang].weatherBtn;

  document.getElementById("cropTitle").innerText = langData[lang].crop;
  document.getElementById("cropBtn").innerText = langData[lang].cropBtn;

  document.getElementById("diseaseTitle").innerText = langData[lang].disease;
  document.getElementById("diseaseBtn").innerText = langData[lang].diseaseBtn;

  document.getElementById("chartTitle").innerText = langData[lang].chart;

  document.getElementById("voiceTitle").innerText = langData[lang].voice;
  document.getElementById("voiceBtn").innerText = langData[lang].voiceBtn;

  document.getElementById("videoTitle").innerText = langData[lang].video;
  document.getElementById("videoBtn").innerText = langData[lang].videoBtn;

  document.getElementById("city").placeholder = langData[lang].placeholder;
}


// 🌦 WEATHER
function getWeather() {
  let city = document.getElementById("city").value;

  fetch(`/weather/?city=${city}`)
  .then(res => res.json())
  .then(data => {

    let text = `Temp: ${data.temp}°C | Wind: ${data.wind}`;
    let hindi = `तापमान: ${data.temp}°C | हवा: ${data.wind}`;

    document.getElementById("weather").innerHTML =
      currentLang === "hi" ? hindi : text;
  });
}


// 🌱 CROP
function getCrop() {
  fetch(`/crop/`)
  .then(res => res.json())
  .then(data => {

    let en = "Best Crop: " + data.crop;
    let hi = "सबसे अच्छी फसल: " + data.crop;

    document.getElementById("crop").innerHTML =
      currentLang === "hi" ? hi : en;
  });
}


// 🦠 DISEASE (DEMO)
function detectDisease() {
  document.getElementById("disease").innerHTML =
    currentLang === "hi" ? "पौधा स्वस्थ है 🌱" : "Plant is Healthy 🌱";
}


// 🎤 VOICE AI (BEST PART 🔥)
function startVoice() {
  let speech = new webkitSpeechRecognition();
  speech.lang = "en-IN";
  speech.start();

  speech.onresult = function(e) {
    let text = e.results[0][0].transcript.toLowerCase();

    let city = text.replace("weather", "").trim();

    fetch(`/weather/?city=${city}`)
    .then(res => res.json())
    .then(data => {

      let en = `Temperature in ${city} is ${data.temp} degree celsius`;
      let hi = `${city} का तापमान ${data.temp} डिग्री है`;

      document.getElementById("voice").innerHTML =
        en + "<br>" + hi;

      let speak1 = new SpeechSynthesisUtterance(en);
      speak1.lang = "en-US";

      let speak2 = new SpeechSynthesisUtterance(hi);
      speak2.lang = "hi-IN";

      speechSynthesis.speak(speak1);
      speechSynthesis.speak(speak2);
    });
  }
}


// 📊 CHART
new Chart(document.getElementById("chart"), {
  type: "bar",
  data: {
    labels: ["Jan","Feb","Mar","Apr"],
    datasets: [{
      label: "Growth",
      data: [10,20,30,40]
    }]
  }
});


// 🎥 VIDEO
function loadVideo() {
  fetch(`/video/`)
  .then(res => res.json())
  .then(data => {
    document.getElementById("video").src = data.video;
  });
}