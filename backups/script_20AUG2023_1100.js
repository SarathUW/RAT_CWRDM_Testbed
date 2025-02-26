// Initialize the map
var map = L.map('map').setView([10.4105, 76.6111], 8); // Kerala coordinates

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

var cartoDBPositron = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",{
   attribution: "©CartoDB",
   maxZoom: 19,   
});


// Create a baseMaps object to store the layers for the layer control
var baseMaps = {
  "Topo Map (Esri)": esriTopoLayer,
  "Satellite View": satelliteLayer,
  "Map View": osmLayer,
  "Terrain Map (Stamen)": stamenTerrainLayer,  
  "Toner Map (Stamen)": stamenTonerLayer,
  "Light (CartoDB)": cartoDBPositron  
};
var geoJSONLayer
fetch("./assets/map_data/Kerala_shp.geojson")
  .then(response => response.json())
  .then(data => {
    // Create a GeoJSON layer with custom style and add it to the map
      geoJSONLayer = L.geoJSON(data, {
      style: function (feature) {
        return {
          fillColor: 'rgba(0, 123, 0, 0.5)',  // Set initial fill color to transparent green
          color: 'black',       // Set outline color to black
          weight: 1,            // Outline weight
          opacity: 1            // Outline opacity
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

//Adding precipitation toggle
var PrecipitationToggle = L.Control.extend({
   onAdd: function (map) {
     var container = L.DomUtil.create("div", "toggle-container");
     container.innerHTML = `
       <div class="toggle-box bg-dark px-2 py-0 rounded ">
         <div class="form-check py-0 my-0">
           <input class="form-check-input mt-2 mb-1" type="checkbox" id="precipitationToggle">
           <label class="form-check-label pt-1 mb-1" for="precipitationToggle"><h6><strong><span class="text-white">Precipitation</span></strong></h6></label>
         </div>
       </div>
     `;
     return container;
   },
 });

 new PrecipitationToggle({ position: "topright" }).addTo(map);
//  L.control.zoom().addTo(map);






// Declaring global variables
var precipON = false;
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
         if(precipON == false){
            damGroup.addTo(map); 
         }
                  
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
// Function to generate color ramp
// function getMarkerColor(precipitation, maxPrecipitation) {
//    const normalizedValue = precipitation / maxPrecipitation;

//    const minHue = 190; 
//    const maxHue = 240;   
//    const hue = minHue - (normalizedValue * (minHue - maxHue));

//    return `hsl(${hue}, 100%, 50%)`;
// }

// function getMarkerColor(precipitation, maxPrecipitation) {
//    if (precipitation > 100){
//       return `hsl(282, 100%, 50%)`;
//    }
//    else{
//       const normalizedValue = precipitation / maxPrecipitation;

//       const minHue = 190; // Blue
//       const maxHue = 240;   // Dark Blue
//       const hue = minHue - (normalizedValue * (minHue - maxHue));
   
//       return `hsl(${hue}, 100%, 50%)`;
//    }
   
// }


//Precipiation plotting
//Elements:- Precipitaion Toggle, ColorBar Legend, DatePicker, Plot

var precipitationToggle = document.getElementById("precipitationToggle");
var precipitationMarkers = [];
var ColorBarLegend;
precipitationToggle.addEventListener("change", function () {
   if (precipitationToggle.checked) {
      precipON = true;
      cartoDBPositron.addTo(map);
      map.removeLayer(damGroup)
     // When the toggle is checked, plot precipitation markers
     plotPrecipitation();
       
     geoJSONLayer.setStyle({
      fillColor: 'none',
      color: 'grey',
      weight: 1,
      opacity: 0.6
    });   
    
   } else {
      precipON = false;
      geoJSONLayer.setStyle({
         fillColor: 'rgba(0, 123, 0, 0.5)',
         color: 'black',
         weight: 1,
         opacity: 1
       });
      map.removeLayer(cartoDBPositron);
      if (ColorBarLegend) {
         // ColorBarLegend.removeFrom(map);
      }
      damGroup.addTo(map)
     // When the toggle is unchecked, remove the precipitation markers
     for (var i = 0; i < precipitationMarkers.length; i++) {
       map.removeLayer(precipitationMarkers[i]);
     }
     precipitationMarkers = []; // Clear the markers array
     
     
   }
 });


function plotPrecipitation(){
// Load the shapefile (Kerala.geojson) to ensure that only those values of precipitaion that lie insdie the region is considered. 
   fetch('./assets/map_data/Kerala_shp.geojson')
      .then(response => response.json())
      .then(geojson => {
         // Load and parse the ASC file
         fetch('./assets/map_data/precipitation/2018-08-15_IMERG.asc')
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
                  var maxPrecip = 0;
                  var minPrecip = 200;
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
                              if (precipitation < minPrecip){
                                 minPrecip = precipitation
                              }

                           }
                        }
                     }
               }
               

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
                                 
                                 const markerSize = 0.9375; // Adjust the size as needed

                                 const marker = L.rectangle([
                                 [lat - (markerSize / 30), lon - (markerSize / 30)], // Top-left corner
                                 [lat + (markerSize / 30), lon + (markerSize / 30)]  // Bottom-right corner
                                 ], {
                                 color: 'NONE',
                                 fillColor: 'purple',
                                 // fillColor: getMarkerColor(precipitation, maxPrecip),
                                 fillOpacity: getMarkerAlpha(precipitation, maxPrecip)
                                 });
                                 // const marker = L.circleMarker([lat, lon], {
                                 //    radius: 5, // *getMarkerSize(precipitation, maxPrecip),
                                 //    color: "NONE",
                                 //    // fillColor: 'purple',
                                 //    fillColor: getMarkerColor(precipitation, maxPrecip),
                                 //    fillOpacity: getMarkerAlpha(precipitation, maxPrecip),
                                 //  });
                        
                                  marker.addTo(map); // Add marker to the map
                                  precipitationMarkers.push(marker);
                              }
                           }
                     }
                  }

                  // Adding legend as a colorbar
                  ColorBarLegend = L.Control.extend({
                     onAdd: function (map) {
                       var container = L.DomUtil.create("div", "color-bar-legend");
                       container.innerHTML = `
                        <div class="legend-container">
                           <div class="legend-labels">
                              <span class="legend-max">${maxPrecip}</span>                             
                           </div>
                           <div class="legend-color-bar"></div>
                           <div class="legend-labels">
                              <span class="legend-min">${minPrecip}</span>
                           </div>
                           
                        </div>
                       `;
                       return container;
                     },
                   });
                   // Create the color bar legend control and add it to the map
                   new ColorBarLegend({ position: "topleft" }).addTo(map);               
                   
               })
               .catch(error => console.error('Error loading ASC file:', error));
      })
      .catch(error => console.error('Error loading shapefile:', error));

   }


