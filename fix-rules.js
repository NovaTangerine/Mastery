const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  "['gameId', 'uid', 'startTime', 'endTime', 'progressMarker', 'name', 'chapter', 'hoursPlayed', 'groupId', 'trackers', 'metrics']",
  "['gameId', 'uid', 'startTime', 'endTime', 'progressMarker', 'name', 'chapter', 'hoursPlayed', 'groupId', 'trackers', 'metrics', 'tags']"
);

rules = rules.replace(
  "(!('metrics' in data) || data.metrics == null || (data.metrics is list && data.metrics.size() <= 50));",
  "(!('metrics' in data) || data.metrics == null || (data.metrics is list && data.metrics.size() <= 50)) &&\n             (!('tags' in data) || data.tags == null || (data.tags is list && data.tags.size() <= 20));"
);

fs.writeFileSync('firestore.rules', rules);
