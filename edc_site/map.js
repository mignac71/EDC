// Initialize Leaflet map when a map container is present
// Reusable across pages (homepage section and dedicated map page)
document.addEventListener('DOMContentLoaded', () => {
  const mapContainer = document.getElementById('map');
  if (!mapContainer || typeof L === 'undefined') return;

  // Europe bounds approx
  const europeBounds = [
    [30, -30], // Southwest
    [75, 50]   // Northeast
  ];

  const map = L.map(mapContainer, {
    maxBounds: europeBounds,
    maxBoundsViscosity: 1.0,
    minZoom: 3
  }).setView([54, 15], 4);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    bounds: europeBounds
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
            const content = `
              <div class="dealer-popup-content">
                <strong>${info.country}</strong>
                <div class="dealer-row">
                  <span><img src="images/logo_audi.svg" alt="Audi" class="dealer-logo"></span>
                  <span class="dealer-count">${info.audi}</span>
                </div>
                <div class="dealer-row">
                  <span><img src="images/logo_vw.svg" alt="VW" class="dealer-logo"></span>
                  <span class="dealer-count">${info.vw}</span>
                </div>
              </div>
            `;
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
