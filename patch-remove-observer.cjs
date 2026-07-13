const fs = require('fs');
let code = fs.readFileSync('src/views/SessionView.tsx', 'utf8');
code = code.replace(
  /  useEffect\(\(\) => \{\n    if \(window\.innerWidth >= 1024\) return;\n    const observer = new IntersectionObserver\([\s\S]*?return \(\) => observer\.disconnect\(\);\n  \}, \[\]\);\n/,
  ""
);
fs.writeFileSync('src/views/SessionView.tsx', code);
