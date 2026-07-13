const fs = require('fs');
let code = fs.readFileSync('src/views/SessionView.tsx', 'utf8');

const importIdx = code.indexOf("export default function SessionView() {");

const newHooks = `  const prevHoursPlayed = React.useMemo(() => {
    if (!activeSession) return 0;
    const currentIndex = sessions.findIndex(s => s.id === activeSession.id);
    if (currentIndex >= 0 && currentIndex < sessions.length - 1) {
      for (let i = currentIndex + 1; i < sessions.length; i++) {
        if (sessions[i].hoursPlayed !== undefined && sessions[i].hoursPlayed !== null) {
          return sessions[i].hoursPlayed as number;
        }
      }
    }
    return 0;
  }, [sessions, activeSession]);

  const [totalHoursInput, setTotalHoursInput] = useState('');
`;

code = code.replace(
  "  const [sessionHoursInput, setSessionHoursInput] = useState('');",
  "  const [sessionHoursInput, setSessionHoursInput] = useState('');\n" + newHooks
);

fs.writeFileSync('src/views/SessionView.tsx', code);
