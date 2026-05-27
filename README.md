# API-Visitas 📊

API de estadísticas de visitas web con geolocalización IP, mapa mundial interactivo, detección de dispositivo/navegador, filtro de bots y dashboard en tiempo real.

Ideal para saber **quién**, **desde dónde** y **cómo** usan tus aplicaciones web.

---

## ✨ Características

- **Tracking por IP** — Registra cada visita con país, ciudad, coordenadas geográficas e ISP
- **JSONP support** — Se integra como `<script>` en cualquier sitio estático
- **Dashboard en vivo** — Mapa mundial (Leaflet) + cards de estadísticas + gráficos (Chart.js)
- **Detección de dispositivo** — Navegador, SO, tipo de dispositivo (mobile/desktop/tablet)
- **Filtro de bots** — Detecta crawlers (Googlebot, GPTBot, etc.) y tráfico de datacenters
- **Agrupación por proyecto** — Un solo servidor para múltiples aplicaciones
- **SQLite** — Sin dependencias externas de base de datos, portátil

## 🚀 Inicio rápido

```bash
git clone https://github.com/wmlumen/API-Visitas.git
cd API-Visitas
npm install
cp .env.example .env
npm start
```

Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

## 📡 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/track?project=NOMBRE&page=URL` | Registrar visita. Soporta JSONP (`&callback=func`) |
| `GET` | `/api/stats/overview?project=NOMBRE` | Total visitas, únicos, hoy, semana, top páginas |
| `GET` | `/api/stats/timeline?project=NOMBRE&days=30` | Visitas por día |
| `GET` | `/api/stats/devices?project=NOMBRE` | Navegador, SO, dispositivo |
| `GET` | `/api/stats/locations?project=NOMBRE` | Países + ciudades con coordenadas (para mapa) |
| `GET` | `/api/stats/recent?project=NOMBRE&limit=20` | Últimas visitas |
| `GET` | `/api/projects` | Todos los proyectos registrados |
| `GET` | `/api/health` | Health check |
| `GET` | `/` | Dashboard web |

## 🔌 Integración

### Sitio estático (HTML)

```html
<script src="https://tu-servidor.com/track?project=mi-app&page=inicio" async></script>
```

### API REST (fetch)

```js
fetch('https://tu-servidor.com/track?project=mi-app&page=home')
  .then(r => r.json())
  .then(data => {
    console.log('Visitante:', data.visitor.country, data.visitor.city);
    console.log('Navegador:', data.visitor.browser);
  });
```

### JSONP

```html
<script>
function visitCallback(data) {
  console.log('Visitante desde:', data.visitor.country);
}
</script>
<script src="https://tu-servidor.com/track?project=mi-app&callback=visitCallback" async></script>
```

## 📊 Dashboard

El dashboard incluye:

- Mapa mundial con marcadores por ciudad
- Cards de estadísticas (totales, únicos, hoy, semana)
- Timeline de visitas (30 días)
- Gráfico de navegadores
- Top páginas más visitadas
- Tabla de últimas visitas
- Selector de proyectos
- Auto-refresh cada 30 segundos

## 🛡️ Filtro de bots

Detecta y excluye automáticamente:

- Crawlers de buscadores (Googlebot, Bingbot, Yandex, etc.)
- Crawlers de IA (GPTBot, Claude, Perplexity, etc.)
- Herramientas (curl, wget, python-requests, etc.)
- Headless browsers (Puppeteer, Playwright, Selenium)
- Tráfico de datacenters (AWS, GCP, Azure, DigitalOcean, OVH, Hetzner, etc.)

## ⚙️ Configuración

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3000` | Puerto del servidor |
| `DB_PATH` | `./db/visits.db` | Ruta de la base de datos SQLite |

## ☁️ Deploy

### Render (recomendado)

El repositorio incluye `render.yaml` para deploy automático:

1. Conectá el repo en [render.com](https://render.com)
2. Render detecta la configuración automáticamente
3. Usa **Free plan** con 1GB de disco persistente

### Vercel / Railway

El proyecto usa SQLite, por lo que requiere almacenamiento persistente. En serverless (Vercel) no funciona porque el filesystem es efímero.

## 📁 Estructura

```
API-Visitas/
├── server.js              # Express server
├── package.json
├── render.yaml            # Config deploy Render
├── .env.example           # Variables de entorno
├── db/
│   └── database.js        # Esquema SQLite + conexión
├── api/
│   ├── track.js           # GET /track → registro + geolocalización
│   ├── stats.js           # GET /api/stats/* → 5 endpoints
│   └── projects.js        # GET /api/projects
├── public/
│   ├── index.html         # Dashboard
│   ├── map.js             # Mapa Leaflet
│   └── stats.js           # Gráficos Chart.js
├── middlewares/
│   └── botFilter.js       # Detección de bots
└── docs/
    └── USO.html           # Documentación de integración
```

## 🧰 Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express |
| Base de datos | SQLite (better-sqlite3) |
| Geolocalización | ip-api.com (gratuito, sin key) |
| User-Agent | ua-parser-js |
| Dashboard | Leaflet + Chart.js |
| Deploy | Render (Node) |

## 📄 Licencia

MIT
