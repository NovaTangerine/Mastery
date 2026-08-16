const fs = require('fs');
let code = fs.readFileSync('src/views/DashboardView.tsx', 'utf8');

code = code.replace(
  /const handleToggleBoxArt = async[^}]*dsCover\);[\s\S]*?}/m,
`const handleToggleBoxArt = async (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    setOpenMenuId(null);
    const dsCover = "https://images.igdb.com/igdb/image/upload/t_720p/cobksg.jpg";
    const isSwapped = game.coverUrl === dsCover;
    
    if (isSwapped) {
      const originalCover = localStorage.getItem(\`originalCover_\${game.id}\`);
      await handleUpdateGameDetails(game.id, game.title, originalCover || null);
    } else {
      if (game.coverUrl) { 
        localStorage.setItem(\`originalCover_\${game.id}\`, game.coverUrl);
      } else {
        localStorage.removeItem(\`originalCover_\${game.id}\`);
      }
      await handleUpdateGameDetails(game.id, game.title, dsCover);
    }
  };`
);

fs.writeFileSync('src/views/DashboardView.tsx', code);
