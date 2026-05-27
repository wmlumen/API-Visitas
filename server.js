const express = require('express');
const cors = require('cors');
const path = require('path');

try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (e) {}

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar DB (JSON file)
const { initDatabase } = require('./db/database');
initDatabase();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

// Dashboard estático
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/track', require('./api/track'));
app.use('/api/stats', require('./api/stats'));
app.use('/api/projects', require('./api/projects'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), node: process.version, timestamp: new Date().toISOString() });
});

// Fallback root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) {
      res.json({
        nombre: 'API-Visitas',
        version: '1.0.0',
        endpoints: {
          track: '/track?project=nombre&page=url',
          overview: '/api/stats/overview?project=nombre',
          timeline: '/api/stats/timeline?project=nombre',
          devices: '/api/stats/devices?project=nombre',
          locations: '/api/stats/locations?project=nombre',
          recent: '/api/stats/recent?project=nombre',
          projects: '/api/projects',
          health: '/api/health'
        }
      });
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API-Visitas running on port ${PORT}`);
});
