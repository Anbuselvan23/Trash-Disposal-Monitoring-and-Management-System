// Firebase config
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

const fill = document.getElementById("fill");
const trashText = document.getElementById("trash-text");
const alertBox = document.getElementById("alert-box");

let alertShown = false;

db.ref("trashLevel").on("value", (snapshot) => {
  const level = snapshot.val();
  fill.style.height = `${level}%`;
  trashText.innerText = `Trash Level: ${level}%`;

  if (level >= 70 && !alertShown) {
    alertBox.style.display = "block";
    alertShown = true;
  }

  if (level < 70) {
    alertBox.style.display = "none";
    alertShown = false;
  }
});

// Google Map
window.initMap = function () {
  const binLocation = {
    lat: 12.875844926194231,
    lng: 80.08340140578846
  };

  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 16,
    center: binLocation,
  });

  const marker = new google.maps.Marker({
    position: binLocation,
    map: map,
    title: "Bin Location"
  });
};
