const fs = require('fs');
let code = fs.readFileSync('src/components/EditMetricModal.tsx', 'utf8');
code = code.replace(
  "onClose: () => void;",
  "onClose: (saved?: boolean) => void;"
);
code = code.replace(
  "onUpdate(metric.id, updates);\n    onClose();",
  "onUpdate(metric.id, updates);\n    onClose(true);"
);
code = code.replace(
  "onClick={onClose}",
  "onClick={() => onClose(false)}"
);
code = code.replace(
  "onClick={onClose}", // there are two instances
  "onClick={() => onClose(false)}"
);
fs.writeFileSync('src/components/EditMetricModal.tsx', code);
