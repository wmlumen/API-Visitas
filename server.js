const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// dotenv es opcional (falla silencioso si no hay .env)
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (e) {}

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar base de datos (async)
const database = require('./db/database');
let dbReady = false;

database.initDatabase().then(() => {
  dbReady = true;
  console.log('✅ Base de datos inicializada');
}).catch(e => {
  console.error('⚠️ Error en base de datos:', e.message);
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy para obtener IP real detrás de nginx/reverse proxy
app.set('trust proxy', 1);

// Archivos estáticos (dashboard)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/track', require('./api/track'));
app.use('/api/stats', require('./api/stats'));
app.use('/api/projects', require('./api/projects'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    port: PORT,
    node: process.version,
    timestamp: new Date().toISOString()
  });
});

// Ruta raíz con info (fallback si el estático no funciona)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) {
      res.json({
        nombre: 'API-Visitas',
        version: '1.0.0',
        docs: '/docs/USO.html',
        dashboard: 'Sirve index.html desde public/',
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

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 API-Visitas corriendo en puerto ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/`);
  console.log(`📍 Track: http://localhost:${PORT}/track?project=test`);
});
