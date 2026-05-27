/**
 * Mapa Leaflet con marcadores de visitas por ciudad
 */
let map;
let markersLayer;

document.addEventListener('DOMContentLoaded', () => {
  try {
    const container = document.getElementById('map');
    container.classList.remove('loading');
    container.innerHTML = '';

    map = L.map('map', {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 12,
      worldCopyJump: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 18
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
  } catch (e) {
    document.getElementById('map').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;">Error al cargar el mapa</div>';
  }
});

function loadLocations(project) {
  if (!map || !markersLayer) return;

  markersLayer.clearLayers();

  fetch(`/api/stats/locations?project=${encodeURIComponent(project)}`)
    .then(r => r.json())
    .then(data => {
      if (!data.cities || !data.cities.length) return;

      const bounds = [];
      data.cities.forEach(city => {
        if (!city.lat || !city.lon) return;
        const lat = parseFloat(city.lat);
        const lon = parseFloat(city.lon);
        if (isNaN(lat) || isNaN(lon)) return;

        const size = Math.min(30, Math.max(8, Math.sqrt(city.count) * 3));
        const color = city.count > 10 ? '#ef4444' : city.count > 5 ? '#f59e0b' : '#38bdf8';

        const marker = L.circleMarker([lat, lon], {
          radius: size,
          fillColor: color,
          color: '#fff',
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.6
        });

        marker.bindTooltip(`${city.city}, ${city.country}<br>${city.count} visita${city.count !== 1 ? 's' : ''}`, { direction: 'top' });
        marker.bindPopup(`<strong>${city.city}</strong><br>${city.region ? city.region + ', ' : ''}${city.country}<br><b>${city.count}</b> visita${city.count !== 1 ? 's' : ''}`);

        markersLayer.addLayer(marker);
        bounds.push([lat, lon]);
      });

      if (bounds.length > 0) {
        try {
          map.fitBounds(bounds, { padding: [20, 20], maxZoom: 8 });
        } catch (e) {}
      }
    })
    .catch(err => {
      console.error('Error loading locations:', err);
    });
}
