const fs = require('fs');
let code = fs.readFileSync('src/views/SessionView.tsx', 'utf8');

const startStr = "  useEffect(() => {\n    if (window.innerWidth >= 1024) return;\n    const observer = new IntersectionObserver(";
const endStr = "    return () => observer.disconnect();\n  }, []);\n";

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr) + endStr.length;

if (startIdx !== -1 && endIdx !== -1) {
  code = code.slice(0, startIdx) + code.slice(endIdx);
  fs.writeFileSync('src/views/SessionView.tsx', code);
  console.log("Removed observer");
} else {
  console.log("Not found");
}
