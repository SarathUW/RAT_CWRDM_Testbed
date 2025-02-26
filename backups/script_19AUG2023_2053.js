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

// Declaring global variables
var damGroup;
var offcanvastriggered = false
var inflowFilename = null;
var aecFilename = null;
var evapFilename = null;

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
      popupContent.innerHTML = damNameDiv.outerHTML + '<button class="btn btn-outline-success btn-sm" onclick="showPlots(\'' + 
      name.replace(/\s/g, '') + '\')"><p3>View Data</p3></button>';

      

      marker.bindPopup(popupContent);

      markerArray.push(marker);  
           

   }
   damGroup = L.layerGroup(markerArray).addTo(map)


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
    offcanvastriggered = false;
  });
 });


// Wrapper function for plotting
function showPlots(dam_name){

   //Displaying dam name at top of offcanvas pop-up
   document.getElementById('graphOffcanvasLabel').innerHTML = '' + dam_name;
   //Opening RAT output data for the dam  
   inflowFilename = './assets/RAT_results/inflow/' + dam_name.toLowerCase() +'.csv'
   aecFilename = './assets/RAT_results/aec/' + dam_name.toLowerCase() +'.csv'
   evapFilename = './assets/RAT_results/evaporation/' + dam_name.toLowerCase() + '.csv'   
   showInflow(inflowFilename);

   // Plot swtiching
   // Attach event listeners to the buttons
   document.getElementById('inflowRadio').addEventListener('click', function() {
      showInflow(inflowFilename);
   });
   document.getElementById('evapRadio').addEventListener('click', function() {

      showEvaporation(evapFilename);
   });
   document.getElementById('aecRadio').addEventListener('click', function() {

      showAEC(aecFilename);
   });  

}

// Function for inflow plotting
function showInflow(inflowFilename) {
   if(offcanvastriggered == false){
      var offcanvas = new bootstrap.Offcanvas(document.getElementById('graphOffcanvas'));
      offcanvas.show();
      offcanvastriggered = true

      //reset radio button group
      var radioButtons = document.querySelectorAll('[name="graphOptions"]');
      radioButtons.forEach(function(radioButton) {
      radioButton.checked = false;
      });
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
     var evapData = [];
     for (var i = 1; i < rows.length; i++) {
        var cols = rows[i].split(',');
        dates.push(cols[0]);
        evapData.push(parseFloat(cols[1]));
     }

     var data = [{
        x: dates,
        y: evapData,
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
     var aecData = [];
     for (var i = 1; i < rows.length; i++) {
        var cols = rows[i].split(',');
        dates.push(cols[0]);
        // Convert elevation from meters to feet
        var elevationMeters = parseFloat(cols[1]);
        var elevationFeet = elevationMeters * 3.28084; // 1 meter = 3.28084 feet
        aecData.push(elevationFeet);
     }

     var data = [{
        x: dates,
        y: aecData,
        type: 'scatter',
        mode: 'lines+markers'
     }];

     var layout = {
        title: 'Area-Elevation Curve',
        xaxis: {
           title: 'Elevation (ft)'
        },
        yaxis: {
           title: 'Surface Area (km<sup>2</sup>)'
        },
        hovermode: 'closest'
     };

     Plotly.newPlot('graphCanvas', data, layout);
  })
  .catch(error => console.error(error));
}


//Precipitation plotter
// Define a function to determine the marker opacity based on precipitation value
function getMarkerAlpha(precipitation, maxPrecipitation) {
   
   const normalizedValue = precipitation / maxPrecipitation;

   const minAlpha = 0; 
   const maxAlpha = 1;   
   const alpha = minAlpha - (normalizedValue * (minAlpha - maxAlpha));

   return alpha;
}
//function to adjust marker size based on precipitation
function getMarkerSize(precipitation, maxPrecip) {

   if(precipitation/maxPrecip > .8)
   {
      if(precipitation/maxPrecip > .9)
      {
         return(3)
      }
      else 
      {
         return(1.5)
      }
   }

   else
   {
      return 1;
   }   
}
//Function to generate color ramp
function getMarkerColor(precipitation, maxPrecipitation) {
   const normalizedValue = precipitation / maxPrecipitation;

   const minHue = 190; // Blue
   const maxHue = 240;   // Dark Blue
   const hue = minHue - (normalizedValue * (minHue - maxHue));

   return `hsl(${hue}, 100%, 50%)`;
}

// Load the shapefile (Kerala.geojson)
fetch('./assets/map_data/Kerala_shp.geojson')
    .then(response => response.json())
    .then(geojson => {
        // Load and parse the ASC file
        fetch('./assets/map_data/precipitation/2018-09-12_IMERG.asc')
            .then(response => response.text())
            .then(data => {
                const lines = data.split('\n');
                const header = lines.slice(0, 6);
                const values = lines.slice(6, lines.length - 1).map(line => line.split(/\s+/).map(parseFloat));

                // Parse header values...
                const ncols = parseInt(header[0].split(/\s+/)[1]);
                const nrows = parseInt(header[1].split(/\s+/)[1]);
                const xllcorner = parseFloat(header[2].split(/\s+/)[1]);
                const yllcorner = parseFloat(header[3].split(/\s+/)[1]);
                const cellSize = parseFloat(header[4].split(/\s+/)[1]);
                const noDataValue = parseFloat(header[5].split(/\s+/)[1]);

                //Computing maximum precipiation within Kerala
                var maxPrecip = 0
                for (let col = 1; col < ncols; col++) {
                  for (let row = 0; row < nrows; row++) {
                      const lon = xllcorner + col * cellSize;
                      const lat = yllcorner + (nrows - row - 1) * cellSize;
                      const precipitation = values[row][col];

                      if (precipitation !== noDataValue) {
                          const point = turf.point([lon, lat]);
                          const isInside = turf.booleanPointInPolygon(point, geojson.features[0]);
                          
                          if (isInside) {
                           
                           if(precipitation > maxPrecip){
                              maxPrecip = precipitation
                           }

                          }
                      }
                  }
              }
              console.log(maxPrecip)

                // Loop through the values and add markers to the map
                for (let col = 1; col < ncols; col++) {
                    for (let row = 0; row < nrows; row++) {
                        const lon = xllcorner + col * cellSize;
                        const lat = yllcorner + (nrows - row - 1) * cellSize;
                        const precipitation = values[row][col];

                        if (precipitation !== noDataValue) {
                            const point = turf.point([lon, lat]);
                            const isInside = turf.booleanPointInPolygon(point, geojson.features[0]);
                            
                            if (isInside) {
                              
                                L.circleMarker([lat, lon], {
                                    radius: 6,//*getMarkerSize(precipitation, maxPrecip),
                                    color: 'NONE',
                                    fillColor: getMarkerColor(precipitation, maxPrecip),
                                    fillOpacity: getMarkerAlpha(precipitation, maxPrecip)}                               

                                ).addTo(map);
                            }
                        }
                    }
                }
            })
            .catch(error => console.error('Error loading ASC file:', error));
    })
    .catch(error => console.error('Error loading shapefile:', error));




