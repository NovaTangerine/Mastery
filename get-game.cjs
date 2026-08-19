const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
admin.initializeApp({ projectId: config.projectId });
const db = getFirestore(config.firestoreDatabaseId);

db.collection('games').where('title', '==', 'Zero Parades: For Dead Spies').get().then(snap => {
  if (snap.empty) {
    console.log("No game found.");
  } else {
    snap.docs.forEach(doc => {
      console.log(doc.id, "=>", doc.data());
    });
  }
}).catch(err => console.error(err));
