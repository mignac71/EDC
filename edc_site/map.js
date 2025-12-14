// Initialize Leaflet map when a map container is present
// Reusable across pages (homepage section and dedicated map page)
document.addEventListener('DOMContentLoaded', () => {
  const mapContainer = document.getElementById('map');
  if (!mapContainer || typeof L === 'undefined') return;

  const map = L.map(mapContainer).setView([54, 15], 4);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  Promise.all([
    fetch('json/europe.geojson').then((response) => response.json()),
    fetch('api/cms-save.php').then(r => r.json())
      .then(data => data.dealers || fetch('json/dealers.json').then(r => r.json()))
      .catch(() => fetch('json/dealers.json').then(r => r.json()))
  ])
    .then(([geoData, dealers]) => {
      L.geoJSON(geoData, {
        pointToLayer(feature, latlng) {
          return L.circleMarker(latlng, {
            radius: 5,
            color: '#007BFF',
            fillColor: '#007BFF',
            fillOpacity: 0.8
          });
        },
        onEachFeature(feature, layer) {
          const iso = feature.properties.iso_a2;
          const info = dealers[iso];
          if (info) {
            const content = `<strong>${info.country}</strong><br>Audi: ${info.audi}<br>VW: ${info.vw}`;
            layer.bindPopup(content, { className: 'dealer-popup', maxWidth: 400 });
            layer.on('mouseover', function handleMouseOver() {
              this.openPopup();
            });
            layer.on('mouseout', function handleMouseOut() {
              this.closePopup();
            });
          }
        }
      }).addTo(map);
    })
    .catch((error) => {
      console.error('Failed to load dealer map data', error);
      const status = document.getElementById('map-status');
      if (status) {
        status.textContent = 'We were unable to load the dealer map data. Please try again later.';
      }
    });
});
