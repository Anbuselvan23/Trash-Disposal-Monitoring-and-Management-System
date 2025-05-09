// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcVVBsgQMDqwB-F0B2hVkJiU6DpYjq_Qo",
  authDomain: "trashmonitoringsystem-85cb7.firebaseapp.com",
  databaseURL: "https://trashmonitoringsystem-85cb7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "trashmonitoringsystem-85cb7",
  storageBucket: "trashmonitoringsystem-85cb7.appspot.com",
  messagingSenderId: "1018741260116",
  appId: "1:1018741260116:web:720aa2d2e806cc881512c1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// DOM Elements
const fill = document.getElementById("fill");
const trashText = document.getElementById("trash-text");
const alertBox = document.getElementById("alert-box");
const cleanControls = document.getElementById("clean-controls");
const startCleanBtn = document.getElementById("start-clean");
const doneCleanBtn = document.getElementById("done-clean");

let isCleaning = false;
let alertVisibleUntil = 0;
let trashLevelSnapshot = 0;
let freezeDisplay = false;

// Start cleaning
startCleanBtn.addEventListener("click", () => {
  db.ref("isCleaning").set(true);
  showCleaningAlert();
});

// Finish cleaning
doneCleanBtn.addEventListener("click", () => {
  db.ref("isCleaning").set(false);
  db.ref("trashLevel").set(0);
  db.ref("lastSMSTime").set(0);
  db.ref("alertVisibleUntil").set(0);

  trashLevelSnapshot = 0;
  freezeDisplay = false;
  alertBox.style.display = "none";
  cleanControls.style.display = "none";
  updateDisplay(0);
});

// Listen for cleaning status
db.ref("isCleaning").on("value", (snapshot) => {
  isCleaning = snapshot.val();
  updateDisplay(trashLevelSnapshot);
});

// Listen for trash level updates
db.ref("trashLevel").on("value", (snapshot) => {
  const level = snapshot.val() ?? 0;

  if (level >= 70 && !freezeDisplay) {
    trashLevelSnapshot = level;
    freezeDisplay = true;
    const timeout = Date.now() + 10 * 60 * 1000; // 10 minutes freeze
    db.ref("alertVisibleUntil").set(timeout);
  }

  if (!freezeDisplay) {
    trashLevelSnapshot = level;
  }

  updateDisplay(trashLevelSnapshot);
});

// Track alert timeout
db.ref("alertVisibleUntil").on("value", (snapshot) => {
  alertVisibleUntil = snapshot.val() ?? 0;
  updateDisplay(trashLevelSnapshot);
});

// Update UI based on state
function updateDisplay(level) {
  const now = Date.now();

  if (isCleaning) {
    showCleaningAlert();
    return;
  }

  fill.style.height = `${level}%`;
  trashText.innerText = `Trash Level: ${level}%`;
  updateFillColor(level);

  if (level >= 70 || now < alertVisibleUntil) {
    showAlert("⚠️ Trash bin is almost full! Please empty it soon.");
    cleanControls.style.display = "block";
    startCleanBtn.style.display = "inline-block";
    doneCleanBtn.style.display = "none";
  } else {
    hideAlert();
    cleanControls.style.display = "none";
  }
}

// Fill color logic
function updateFillColor(level) {
  if (level <= 35) {
    fill.style.backgroundColor = "#4caf50"; // Green
  } else if (level <= 69) {
    fill.style.backgroundColor = "#ffeb3b"; // Yellow
  } else {
    fill.style.backgroundColor = "#f44336"; // Red
  }
}

// Show alert
function showAlert(message) {
  alertBox.style.display = "block";
  alertBox.innerHTML = `<p>${message}</p>`;
}

// Show cleaning alert
function showCleaningAlert() {
  alertBox.style.display = "block";
  alertBox.innerHTML = `<p>🧼 Bin is being cleaned...</p>`;
  cleanControls.style.display = "block";
  startCleanBtn.style.display = "none";
  doneCleanBtn.style.display = "inline-block";
}

// Hide everything
function hideAlert() {
  alertBox.style.display = "none";
  cleanControls.style.display = "none";
  freezeDisplay = false;
}

// Google Map Initialization
const binLocation = {
  lat: 12.875844926194231,
  lng: 80.08340140578846
};

window.initMap = function () {
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 16,
    center: binLocation,
    mapId: "DEMO_MAP_ID"
  });

  const marker = new google.maps.marker.AdvancedMarkerElement({
    map,
    position: binLocation,
    title: "Trash Bin"
  });
};
let logObject = {
  trashLevel: 0,
  alertTime: null,
  cleanStartTime: null,
  cleanEndTime: null
};

// When alert appears
function showAlert(message) {
  if (!logObject.alertTime) {
    logObject.trashLevel = trashLevelSnapshot;
    logObject.alertTime = Date.now();
  }

  alertBox.style.display = "block";
  alertBox.innerHTML = `<p>${message}</p>`;
}

// When cleaning starts
startCleanBtn.addEventListener("click", () => {
  db.ref("isCleaning").set(true);
  logObject.cleanStartTime = Date.now();
  showCleaningAlert();
});

// When cleaning ends
doneCleanBtn.addEventListener("click", () => {
  db.ref("isCleaning").set(false);
  db.ref("trashLevel").set(0);
  db.ref("lastSMSTime").set(0);
  db.ref("alertVisibleUntil").set(0);

  trashLevelSnapshot = 0;
  freezeDisplay = false;

  alertBox.style.display = "none";
  cleanControls.style.display = "none";
  updateDisplay(0);

  // Save log only if full data exists
  logObject.cleanEndTime = Date.now();
  if (logObject.alertTime && logObject.cleanStartTime && logObject.cleanEndTime) {
    const logId = db.ref().child("logs").push().key;
    db.ref("logs/" + logId).set(logObject);
  }

  // Reset log object
  logObject = {
    trashLevel: 0,
    alertTime: null,
    cleanStartTime: null,
    cleanEndTime: null
  };
});
