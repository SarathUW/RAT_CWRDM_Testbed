// Initialize the map
var map = L.map('map').setView([10.2105, 75.9111], 8); // Kerala coordinates

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

fetch("./assets/map_data/Kerala_shp.geojson")
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




// Add the layer control and scale to the map
L.control.layers(baseMaps).addTo(map);
L.control.scale().addTo(map);

// Reading dam locations and adding map markers
// Load and parse the CSV data
fetch('./assets/map_data/dam_locations.csv')
.then(response => response.text())
.then(data => {
  var rows = data.split('\n');
  var header = rows[0].split(',');

  for (var i = 1; i < rows.length; i++) {
    var cols = rows[i].split(',');
    var lat = parseFloat(cols[0]);
    var lng = parseFloat(cols[1]);
    var name = cols[2];
    
    var damNameDiv = document.createElement('div');
    damNameDiv.style.textAlign = 'center';
    damNameDiv.style.fontSize = '14px'; 
    damNameDiv.style.padding = '4px';
    damNameDiv.style.fontWeight = 'bold';
    damNameDiv.style.color = 'black';   
    damNameDiv.innerText = name;

    var popupContent = document.createElement('div');
    popupContent.style.textAlign = 'center'; // Center the content
    popupContent.innerHTML = damNameDiv.outerHTML + '<button class="btn btn-outline-success btn-sm" onclick="showGraph()"><p3>View Data</p3></button>';

    L.marker([lat, lng]).addTo(map)
    .bindPopup(popupContent);
}
})
.catch(error => console.error(error));




// When a map marker is clicked, a bootstrap offcanvas screen is opened with the plots
function showGraph() {
  var offcanvas = new bootstrap.Offcanvas(document.getElementById('graphOffcanvas'));
  offcanvas.show();
  
  // Sample data
  var data = [{
    x: ['January', 'February', 'March', 'April', 'May'],
    y: [12, 19, 3, 5, 2],
    type: 'scatter',
    mode: 'lines+markers'
  }];

  // Chart layout with zoom and hovermode options
  var layout = {
    title: 'Interactive Line Chart',
    xaxis: {
      title: 'Months'
    },
    yaxis: {
      title: 'Values'
    },
    hovermode: 'closest'
  };

  // Create the Plotly chart
  Plotly.newPlot('graphCanvas', data, layout);
}


 