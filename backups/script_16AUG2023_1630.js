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

// Declaring some global variables
var damGroup;
var offcanvastriggered = false
var inflowFilename
var aecFilename
var evapFilename
// Reading dam locations and adding map markers
// Load and parse the CSV data
fetch('./assets/map_data/dam_locations.csv')
.then(response => response.text())
.then(data => {
   var rows = data.split('\n');
   var header = rows[0].split(',');

   var markerArray = []

   for (var i = 1; i < rows.length-1; i++) {
      var cols = rows[i].split(',');
      var lat = parseFloat(cols[0]);
      var lng = parseFloat(cols[1]);
      var name = cols[2];

      // var inflowFilename = `./assets/RAT_results/inflow/${name.toLowerCase().replace(/\s/g, '')}.csv`;
      inflowFilename = './assets/RAT_results/inflow/' + name.toLowerCase().replace(/\s/g, '') +'.csv'
      aecFilename = './assets/RAT_results/aec/' + name.toLowerCase().replace(/\s/g, '') +'.csv'
      evapFilename = './assets/RAT_results/evaporation/' + name.toLowerCase().replace(/\s/g, '') +'.csv'

      // var aecFilename = `./assets/RAT_results/aec/${name.toLowerCase().replace(/\s/g, '')}.csv`;
      // var evapFilename = `./assets/RAT_results/evaporation/${name.toLowerCase().replace(/\s/g, '')}.csv`;

      var marker = L.marker([lat, lng]);

      var damNameDiv = document.createElement('div');
      damNameDiv.style.textAlign = 'center';
      damNameDiv.style.fontSize = '14px'; 
      damNameDiv.style.padding = '4px';
      damNameDiv.style.fontWeight = 'bold';
      damNameDiv.style.color = 'black';   
      damNameDiv.innerText = name;

      var popupContent = document.createElement('div');
      popupContent.style.textAlign = 'center'; // Center the content
      popupContent.innerHTML = damNameDiv.outerHTML + `<button class="btn btn-outline-success btn-sm" onclick="showInflow('${inflowFilename}')"><p3>View Data</p3></button>`;

      

      marker.bindPopup(popupContent);

      markerArray.push(marker);  
           

   }
   damGroup = L.layerGroup(markerArray).addTo(map)
   console.log(damGroup)

   // Plot swtiching
   // Attach event listeners to the buttons
   document.getElementById('inflowRadio').addEventListener('click', function() {
      console.log(inflowFilename)
      showInflow(inflowFilename);
   });
   document.getElementById('evapRadio').addEventListener('click', function() {
      console.log(evapFilename)

      showEvaporation(evapFilename);
   });
   document.getElementById('aecRadio').addEventListener('click', function() {
      console.log(aecFilename)

      showAEC(aecFilename);
   });
   
   // document.getElementById('inflowRadio').addEventListener('click',
   //   showInflow(inflowFilename));
   // document.getElementById('evapRadio').addEventListener('click', 
   //   showEvaporation(evapFilename));
   // document.getElementById('aecRadio').addEventListener('click',
   //   showAEC(aecFilename));


   // Check if zoom level is low, if so remove the markers and add a single marker to avoid crowding
   var keralaCenterMarker;   
   var keralaMarkerPresent = false
   map.on('zoomend', function() {      
      var zoomLevel = map.getZoom();     
      
      if (zoomLevel < 7) {
         map.removeLayer(damGroup);
         if(!keralaMarkerPresent){
            keralaCenterMarker = L.marker([10.2105, 76.5111]).bindPopup("Kerala");         
            keralaCenterMarker.addTo(map);
            keralaCenterMarker.openPopup();
            keralaMarkerPresent = true
         }        
         
      }      
      if(zoomLevel >= 7){    
         if(keralaMarkerPresent){
            map.removeLayer(keralaCenterMarker);
            keralaMarkerPresent = false
         }                    
         map.removeLayer(damGroup); 
         damGroup.addTo(map);          
      }
                              
      
   });

})
.catch(error => console.error(error));




// Checking if offcanvas is closed. If so, save state so that offcanvas is not loaded multiple times
document.addEventListener('DOMContentLoaded', function() {
   var offcanvas = document.getElementById('graphOffcanvas');

  // Listen for the hidden.bs.offcanvas event
  offcanvas.addEventListener('hidden.bs.offcanvas', function() {
    console.log('closed')
    offcanvastriggered = false;
  });
 });

// Function for inflow plotting
function showInflow(inflowFilename) {
   console.log(offcanvastriggered)
   if(offcanvastriggered == false){
      var offcanvas = new bootstrap.Offcanvas(document.getElementById('graphOffcanvas'));
      offcanvas.show();
      offcanvastriggered = true
   }
   

   // Load inflow data based on the filename
   fetch(inflowFilename)
   .then(response => response.text())
   .then(data => {
      // Parse the CSV data and create the Plotly chart
      var rows = data.split('\n');
      var dates = [];
      var inflowData = [];
      for (var i = 1; i < rows.length; i++) {
         var cols = rows[i].split(',');
         dates.push(cols[0]);
         inflowData.push(parseFloat(cols[1]));
      }

      var data = [{
         x: dates,
         y: inflowData,
         type: 'scatter',
         mode: 'lines+markers'
      }];

      var layout = {
         title: 'Inflow Data',
         xaxis: {
            title: 'Date'
         },
         yaxis: {
            title: 'Inflow (cumecs)'
         },
         hovermode: 'closest'
      };

      Plotly.newPlot('graphCanvas', data, layout);
   })
   .catch(error => console.error(error));
}

// Function for evaporation plotting
function showEvaporation(evapFilename) {
   if(offcanvastriggered == false){
      var offcanvas = new bootstrap.Offcanvas(document.getElementById('graphOffcanvas'));
      offcanvas.show();
      offcanvastriggered = true
   }
  

  // Load evap data based on the filename
  fetch(evapFilename)
  .then(response => response.text())
  .then(data => {
     // Parse the CSV data and create the Plotly chart
     var rows = data.split('\n');
     var dates = [];
     var inflowData = [];
     for (var i = 1; i < rows.length; i++) {
        var cols = rows[i].split(',');
        dates.push(cols[0]);
        inflowData.push(parseFloat(cols[1]));
     }

     var data = [{
        x: dates,
        y: inflowData,
        type: 'scatter',
        mode: 'lines+markers'
     }];

     var layout = {
        title: 'Evaporation Data',
        xaxis: {
           title: 'Date'
        },
        yaxis: {
           title: 'Evaporation (mm)'
        },
        hovermode: 'closest'
     };

     Plotly.newPlot('graphCanvas', data, layout);
  })
  .catch(error => console.error(error));
}

// Function for aec plotting
function showAEC(aecFilename) {

   if(offcanvastriggered == false){
      var offcanvas = new bootstrap.Offcanvas(document.getElementById('graphOffcanvas'));
      offcanvas.show();
      offcanvastriggered = true
   }
  

  // Load aec data based on the filename
  fetch(aecFilename)
  .then(response => response.text())
  .then(data => {
     // Parse the CSV data and create the Plotly chart
     var rows = data.split('\n');
     var dates = [];
     var inflowData = [];
     for (var i = 1; i < rows.length; i++) {
        var cols = rows[i].split(',');
        dates.push(cols[0]);
        inflowData.push(parseFloat(cols[1]));
     }

     var data = [{
        x: dates,
        y: inflowData,
        type: 'scatter',
        mode: 'lines+markers'
     }];

     var layout = {
        title: 'Area-Elevation Curve',
        xaxis: {
           title: 'Elevation (ft)'
        },
        yaxis: {
           title: 'Surface Area (km^2)'
        },
        hovermode: 'closest'
     };

     Plotly.newPlot('graphCanvas', data, layout);
  })
  .catch(error => console.error(error));
}



