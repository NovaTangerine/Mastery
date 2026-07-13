const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  "allow update: if isDocOwner() && isValidSession(request.resource.data) && uidNotModified() && areImmutableFieldsUnchanged(['uid', 'gameId', 'startTime']);",
  `
      allow update: if isDocOwner(); // Test 1
  `
);
fs.writeFileSync('firestore.rules', rules);
