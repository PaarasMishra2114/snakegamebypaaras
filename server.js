const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later.' }
});

const scoreLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit score submissions to 10 per minute per IP
  message: { success: false, error: 'Too many score submissions, please try again later.' }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve only specific static files (not the entire directory)
const allowedFiles = [
  'paaras-index.html',
  'paaras-style.css', 
  'paaras.js',
  'paaras-fruit.svg',
  'bg.jpg',
  'paaras-track-1.mp3',
  'paaras-track-2.mp3',
  'paaras-track-3.mp3',
  'paaras-track-4.mp3'
];

// Custom static file middleware with whitelist
app.use((req, res, next) => {
  // Skip this check for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  const filename = path.basename(req.path);
  
  // Block dotfiles and non-whitelisted files
  if (filename.startsWith('.') || (filename && !allowedFiles.includes(filename) && req.path !== '/')) {
    return res.status(404).send('Not Found');
  }
  
  next();
});

app.use(express.static(__dirname, {
  index: false,
  dotfiles: 'deny'
}));

// Initialize SQLite database
const db = new Database('snakegame.db');

// Create leaderboard table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// API Routes

// Get top scores
app.get('/api/scores', apiLimiter, (req, res) => {
  try {
    const requestedLimit = parseInt(req.query.limit) || 10;
    // Validate and cap the limit to prevent excessive database queries
    const limit = Math.min(Math.max(1, requestedLimit), 100);
    const scores = db.prepare(`
      SELECT player_name, score, created_at 
      FROM leaderboard 
      ORDER BY score DESC, created_at ASC 
      LIMIT ?
    `).all(limit);
    
    res.json({ success: true, scores });
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch scores' });
  }
});

// Submit a new score
app.post('/api/scores', scoreLimiter, (req, res) => {
  try {
    const { player_name, score } = req.body;
    
    // Validation
    if (!player_name || typeof player_name !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid player name is required' });
    }
    
    // Validate score is a positive integer with a reasonable maximum
    if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 10000) {
      return res.status(400).json({ success: false, error: 'Valid score is required (0-10000)' });
    }
    
    // Sanitize player name
    const sanitizedName = player_name.trim().substring(0, 50);
    
    if (sanitizedName.length === 0) {
      return res.status(400).json({ success: false, error: 'Player name cannot be empty' });
    }
    
    // Insert score using parameterized query (prevents SQL injection)
    const stmt = db.prepare('INSERT INTO leaderboard (player_name, score) VALUES (?, ?)');
    const result = stmt.run(sanitizedName, score);
    
    res.json({ 
      success: true, 
      message: 'Score submitted successfully',
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ success: false, error: 'Failed to submit score' });
  }
});

// Get player's high score
app.get('/api/scores/player/:name', apiLimiter, (req, res) => {
  try {
    const playerName = req.params.name;
    
    // Validate and sanitize player name
    if (!playerName || typeof playerName !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid player name is required' });
    }
    
    const sanitizedName = playerName.trim().substring(0, 50);
    
    if (sanitizedName.length === 0) {
      return res.status(400).json({ success: false, error: 'Player name cannot be empty' });
    }
    
    // Use parameterized query to prevent SQL injection
    const score = db.prepare(`
      SELECT MAX(score) as high_score 
      FROM leaderboard 
      WHERE player_name = ?
    `).get(sanitizedName);
    
    res.json({ 
      success: true, 
      high_score: score.high_score || 0 
    });
  } catch (error) {
    console.error('Error fetching player score:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch player score' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy' });
});

// Serve the game
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'paaras-index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Snake Game server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  console.log('\nDatabase connection closed.');
  process.exit(0);
});
