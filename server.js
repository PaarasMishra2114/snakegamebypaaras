const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

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
app.get('/api/scores', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
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
app.post('/api/scores', (req, res) => {
  try {
    const { player_name, score } = req.body;
    
    // Validation
    if (!player_name || typeof player_name !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid player name is required' });
    }
    
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ success: false, error: 'Valid score is required' });
    }
    
    // Sanitize player name
    const sanitizedName = player_name.trim().substring(0, 50);
    
    // Insert score
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
app.get('/api/scores/player/:name', (req, res) => {
  try {
    const playerName = req.params.name;
    const score = db.prepare(`
      SELECT MAX(score) as high_score 
      FROM leaderboard 
      WHERE player_name = ?
    `).get(playerName);
    
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
