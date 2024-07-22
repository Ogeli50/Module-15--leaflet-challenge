// static/js/logic.js

// Define the URL for the earthquake data
const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

// Create the map object with center and zoom level
const map = L.map('map').setView([37.7749, -122.4194], 5);

// Add a tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Function to determine the color based on depth
function getColor(depth) {
  return depth > 90 ? '#d73027' :
         depth > 70 ? '#fc8d59' :
         depth > 50 ? '#fee08b' :
         depth > 30 ? '#d9ef8b' :
         depth > 10 ? '#91cf60' :
                      '#1a9850';
}

// Function to create a popup for each feature
function addPopup(feature, layer) {
  layer.bindPopup(
    `<div style="font-size: 14px;">
      <h3>${feature.properties.place}</h3>
      <hr>
      <p><strong>Magnitude:</strong> ${feature.properties.mag}</p>
      <p><strong>Depth:</strong> ${feature.geometry.coordinates[2]} km</p>
      <p><strong>Time:</strong> ${new Date(feature.properties.time)}</p>
      <p><strong>Location:</strong> [${feature.geometry.coordinates[1]}, ${feature.geometry.coordinates[0]}]</p>
    </div>`
  );
}

// Function to create a circle marker
function createMarker(feature, latlng) {
  return L.circleMarker(latlng, {
    radius: feature.properties.mag * 2,
    fillColor: getColor(feature.geometry.coordinates[2]),
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  });
}

// Function to filter the earthquake data based on magnitude
function filterEarthquakes(data, minMagnitude) {
  return data.features.filter(feature => feature.properties.mag >= minMagnitude);
}

// Function to add earthquakes to the map
function addEarthquakesToMap(data) {
  if (typeof earthquakes !== 'undefined') {
    map.removeLayer(earthquakes);
  }

  earthquakes = L.geoJSON(data, {
    pointToLayer: createMarker,
    onEachFeature: addPopup
  }).addTo(map);
}

// Fetch the earthquake data
d3.json(url).then(data => {
  let earthquakes;

  // Add GeoJSON layer to the map
  addEarthquakesToMap(data);

  // Create a legend
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = function() {
    const div = L.DomUtil.create('div', 'info legend');
    const depths = [-10, 10, 30, 50, 70, 90];
    const colors = ['#1a9850', '#91cf60', '#d9ef8b', '#fee08b', '#fc8d59', '#d73027'];
    // Loop through depths and generate a label with a colored square for each interval
    for (let i = 0; i < depths.length; i++) {
      div.innerHTML +=
        `<i style="background:${colors[i]}"></i> ${depths[i]}${(depths[i + 1] ? '&ndash;' + depths[i + 1] : '+')} km<br>`;
    }
    return div;
  };
  legend.addTo(map);

  // Add a control to toggle the earthquake markers
  const overlayMaps = {
    "Earthquakes": earthquakes
  };
  L.control.layers(null, overlayMaps, {
    collapsed: false
  }).addTo(map);

  // Event listener for the filter
  document.getElementById('magnitude-filter').addEventListener('change', (event) => {
    const minMagnitude = event.target.value === 'all' ? 0 : parseFloat(event.target.value);
    const filteredData = filterEarthquakes(data, minMagnitude);
    addEarthquakesToMap({ type: 'FeatureCollection', features: filteredData });
  });
});