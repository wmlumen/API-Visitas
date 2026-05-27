const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.set('trust proxy', 1);

// Ruta de prueba MÍNIMA (sin DB, sin archivos, sin nada)
app.get('*', (req, res) => {
  res.json({
    status: 'ok',
    path: req.path,
    uptime: process.uptime(),
    node: process.version,
    port: PORT,
    time: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
