# Snake Game by Paaras (Minor Project)

A small browser-based Snake game implemented with HTML, CSS and Canvas-based JavaScript. This version uses a logical grid for game rules and an interpolated, curvy canvas renderer for smooth movement and personality (bigger head, eyes, blinking). The food has been replaced with a fruit SVG.

Features
- Curvy, interpolated snake rendering on `<canvas>`
- Bigger head with eyes and blinking
- Fruit SVG as food
- Continuous movement with grid-based logic (separation of logic & render)
- Keyboard controls (arrow keys) and touch swipe controls for mobile
- Persistent HiScore via `localStorage`
- **Backend server with leaderboard functionality**
- **RESTful API for score management**
- **SQLite database for persistent score storage**

Files
- `paaras-index.html` — page entry and canvas placeholder
- `paaras-style.css` — styles for the page and responsive score display
- `paaras.js` — game logic + canvas renderer (curvy snake, eyes, blink, touch controls)
- `server.js` — Express backend server with API endpoints
- `paaras-fruit.svg` — fruit sprite
- `paaras-track-*.mp3` — audio assets referenced by the game (optional)

## Backend API Endpoints
- `GET /api/scores` - Get top scores (query param: `limit`)
- `POST /api/scores` - Submit a new score (body: `{player_name, score}`)
- `GET /api/scores/player/:name` - Get player's high score
- `GET /api/health` - Health check endpoint

How to run

## Backend Integration (Recommended)
The game now includes a backend server with leaderboard functionality:

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Development Mode
For development with auto-restart:
```bash
npm run dev
```

## Static Mode (Legacy)
1. Open `paaras-index.html` directly in your browser (works for most browsers):

   - On Windows PowerShell:

```powershell
Start-Process 'c:\Users\mishr\OneDrive\Desktop\snakegame\SnakeGame\paaras-index.html'
```

2. Alternatively, serve the folder with a simple static server:

```bash
# from the project root
npx http-server -p 8080
# then open http://localhost:8080
```

Controls
- Arrow keys: move the snake (first arrow starts movement)
- Mobile: swipe left/right/up/down on the canvas to change direction

Development notes
- Grid size: `GRID = 18` in `js/index.js` controls the logical playfield.
- Logical speed: adjust `logicalSpeed` in `js/index.js` to make the game faster/slower.
- Visual tweaks: change colors, head size, glow, and body thickness in `js/index.js` and `css/style.css`.

License
- This project includes an optional `LICENSE` file (MIT). Modify as you prefer.

Want help publishing?
- I can help you prepare a GitHub repository, include CI pages, or build a small demo page to share.
