// Initialize the map
var map = L.map('map').setView([10.8505, 76.2711], 7); // Kerala coordinates

// Add tile layers from different providers
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
})

var satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  maxZoom: 20,
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  attribution: '© Google'
});

var terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  maxZoom: 17,
  attribution: '© OpenTopoMap contributors'
});

var cartoDarkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '© CARTO'
});

var stamenTonerLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '© Stamen Design'
});

var stamenTerrainLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
  maxZoom: 18,
  attribution: '© Stamen Design'
});

var esriTopoLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19,
  attribution: '© Esri'
}).addTo(map);

// Create a baseMaps object to store the layers for the layer control
var baseMaps = {
  "Topo Map (Esri)": esriTopoLayer,
  "Satellite View": satelliteLayer,
  "Map View": osmLayer,
  "Terrain Map (Stamen)": stamenTerrainLayer,  
  "Toner Map (Stamen)": stamenTonerLayer  
};

// // Add a marker at the center of Kerala
// L.marker([10.8505, 76.2711]).addTo(map)
//   .bindPopup('Welcome to Kerala!')
//   .openPopup();

// Load the Kerala shapefile using leaflet-omnivore
// omnivore.shapefile("./assets/Kerala_shp.geojson").addTo(map);

// Add a marker for Idukki Dam
var idukkiMarker = L.marker([9.842583, 76.975314]).addTo(map)
  .bindPopup('<h6>Idukki Dam</h6><div id="chart-container"><canvas id="line-chart"></canvas></div>')
  .on('popupopen', function () {
    // Sample data for the line chart
    var chartData = {
      labels: ['January', 'February', 'March', 'April', 'May'],
      datasets: [{
        label: 'Random Data',
        data: [12, 19, 3, 5, 2],
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false
      }]
    };

    // Create and display the line chart
    var ctx = document.getElementById('line-chart').getContext('2d');
    var lineChart = new Chart(ctx, {
      type: 'line',
      data: chartData,
    });
  });

// Add the layer control and scale to the map
L.control.layers(baseMaps).addTo(map);
L.control.scale().addTo(map);

fetch("./assets/Kerala_shp.geojson")
  .then(response => response.json())
  .then(data => {
    // Create a GeoJSON layer with custom style and add it to the map
    L.geoJSON(data, {
      style: function (feature) {
        return {
          fillColor: 'rgba(0, 123, 0, 0.5)',  // Set fill color to none (transparent)
          color: 'black',       // Set outline color to red
          weight: 1,          // Outline weight
          opacity: 1          // Outline opacity
        };
      }
    }).addTo(map);
  })
  .catch(error => {
    console.error("Error loading GeoJSON data:", error);
  });
