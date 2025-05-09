const admin = require("firebase-admin");
const serviceAccount = require("../firebase/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://trashmonitoringsystem-85cb7-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();
module.exports = db;

