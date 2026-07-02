const { execSync } = require('child_process');
execSync('git checkout src/views/TrackerModalMockupView.tsx');
console.log('Restored!');
