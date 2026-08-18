const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const feedbackRule = `
    match /feedback/{feedbackId} {
      allow create: if isAuthenticated() && request.resource.data.uid == request.auth.uid;
      allow read: if isAdmin();
      allow update, delete: if isAdmin();
    }
`;

if (!rules.includes('/feedback/')) {
  rules = rules.replace('match /users/{userId} {', feedbackRule + '\n    match /users/{userId} {');
  fs.writeFileSync('firestore.rules', rules);
  console.log('Added feedback rules');
} else {
  console.log('Feedback rules already exist');
}
