// static/js/logic.js

// Define the URLs for the earthquake and tectonic plates data
const earthquakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
const tectonicPlatesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// Create the map object with center and zoom level
const map = L.map('map').setView([37.7749, -122.4194], 5);

// Define base layers
const darkMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
});

const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

const topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  maxZoom: 17,
  attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
});

const satelliteMap = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=YOUR_MAPBOX_ACCESS_TOKEN', {
  maxZoom: 17,
  attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
});

const grayscaleMap = L.tileLayer('https://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="https://stamen.com/">Stamen Design</a> contributors'
});

const outdoorsMap = L.tileLayer('https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>'
});

// Add dark map as default base layer
darkMap.addTo(map);

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

// Fetch the earthquake data
d3.json(earthquakeUrl).then(data => {
  // Add GeoJSON layer to the map
  const earthquakes = L.geoJSON(data, {
    pointToLayer: createMarker,
    onEachFeature: addPopup
  }).addTo(map);

  // Fetch the tectonic plates data
  d3.json(tectonicPlatesUrl).then(plateData => {
    const tectonicPlates = L.geoJSON(plateData, {
      style: {
        color: 'orange',
        weight: 2
      }
    }).addTo(map);

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

    // Create a legend for tectonic plates
    const tectonicPlatesLegend = L.control({ position: 'bottomright' });
    tectonicPlatesLegend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend');
      div.innerHTML = '<i style="background: orange"></i> Tectonic Plates<br>';
      return div;
    };
    tectonicPlatesLegend.addTo(map);

    // Add a control to toggle the earthquake markers
    const baseMaps = {
      "Dark Map": darkMap,
      "Street Map": streetMap,
      "Topographic Map": topoMap,
      "Satellite Map": satelliteMap,
      "Grayscale Map": grayscaleMap,
      "Outdoors Map": outdoorsMap
    };

    const overlayMaps = {
      "Earthquakes": earthquakes,
      "Tectonic Plates": tectonicPlates
    };

    L.control.layers(baseMaps, overlayMaps, {
      collapsed: false
    }).addTo(map);
  });
});