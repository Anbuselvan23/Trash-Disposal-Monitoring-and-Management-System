const express = require('express');
const admin = require('firebase-admin');
const parser = require('./serialReader');
const sendSMS = require('./smsAlert');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = 3000;

// Firebase init
const serviceAccount = require('../firebase/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://trashmonitoringsystem-85cb7-default-rtdb.asia-southeast1.firebasedatabase.app/',
});
const db = admin.database();

let lastSMSTime = 0;

// Listen for serial data
parser.on('data', async (data) => {
  console.log(`Received from Arduino: ${data}`);
  const match = data.match(/(\d+)/);
  const trashLevel = match ? parseInt(match[1]) : null;

  const isCleaningSnap = await db.ref('isCleaning').once('value');
  const isCleaning = isCleaningSnap.val();

  if (trashLevel !== null && !isCleaning) {
    await db.ref('trashLevel').set(trashLevel);

    const now = Date.now();
    const smsTimeSnap = await db.ref('lastSMSTime').once('value');
    lastSMSTime = smsTimeSnap.val() ?? 0;

    if (trashLevel >= 70 && now - lastSMSTime > 5 * 60 * 1000) {
      sendSMS(trashLevel);
      lastSMSTime = now;
      db.ref('lastSMSTime').set(now);
      db.ref('alertVisibleUntil').set(now + 5 * 60 * 1000); // 5 minutes
    }
  }
});

app.use(express.static(path.join(__dirname, '../public')));

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
function updateTrashLevel(level) {
  const fill = document.getElementById("fill");
  const trashText = document.getElementById("trash-text");
  const alertBox = document.getElementById("alert-box");

  // Update fill height
  fill.style.height = `${level}%`;
  trashText.textContent = `Trash Level: ${level}%`;

  // Change color based on threshold
  if (level < 35) {
    fill.style.background = "#43a047"; // Green
    alertBox.style.display = "none";
  } else if (level < 70) {
    fill.style.background = "#fdd835"; // Yellow
    alertBox.style.display = "none";
  } else {
    fill.style.background = "#e53935"; // Red
    alertBox.style.display = "block";
  }
}
