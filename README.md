# Snake Game by Paaras (Minor Project)

A small browser-based Snake game implemented with HTML, CSS and Canvas-based JavaScript. This version uses a logical grid for game rules and an interpolated, curvy canvas renderer for smooth movement and personality (bigger head, eyes, blinking). The food has been replaced with a fruit SVG.

Features
- Curvy, interpolated snake rendering on `<canvas>`
- Bigger head with eyes and blinking
- Fruit SVG as food
- Continuous movement with grid-based logic (separation of logic & render)
- Keyboard controls (arrow keys) and touch swipe controls for mobile
- Persistent HiScore via `localStorage`

Files
- `index.html` — page entry and canvas placeholder
- `css/style.css` — styles for the page and responsive score display
- `js/index.js` — game logic + canvas renderer (curvy snake, eyes, blink, touch controls)
- `img/fruit.svg` — fruit sprite
- `music/` — audio assets referenced by the game (optional)

How to run
1. Open `index.html` directly in your browser (works for most browsers):

   - On Windows PowerShell:

```powershell
Start-Process 'c:\Users\mishr\OneDrive\Desktop\snakegame\SnakeGame\index.html'
```

2. Alternatively, serve the folder with a simple static server (recommended to avoid some browser restrictions):

```powershell
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
