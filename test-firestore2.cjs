const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
admin.initializeApp({ projectId: config.projectId });
const db = getFirestore(config.firestoreDatabaseId);

db.collection('system_config').doc('twitch_token').get().then(doc => {
  console.log("Got doc:", doc.exists);
}).catch(err => {
  console.error("Error:", err.message);
});
