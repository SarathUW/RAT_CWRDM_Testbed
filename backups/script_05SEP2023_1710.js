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

var OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});
var Esri_OceanBasemap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
	maxZoom: 13
});

// Create a baseMaps object to store the layers for the layer control
var baseMaps = {
  "Esri Topo Map": esriTopoLayer,
  "Satellite View": satelliteLayer,
  "Topographical": OpenTopoMap,
  "Rivers (ESRI)":Esri_OceanBasemap,  
  "Map View": osmLayer,
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
      var mrbid = cols[3];   

     
      var marker = L.marker([lat, lng]);

      var damNameDiv = document.createElement('div');
      damNameDiv.style.textAlign = 'center';
      damNameDiv.style.fontSize = '14px'; 
      damNameDiv.style.padding = '4px';
      damNameDiv.style.fontWeight = 'bold';
      damNameDiv.style.color = 'black';   
      damNameDiv.innerText = name;

      var popupContent = document.createElement('div');
      popupContent.style.textAlign = 'center'; 
      popupContent.innerHTML = damNameDiv.outerHTML + '<button class="btn btn-outline-success btn-sm" onclick="showPlots(\'' + 
      name.replace(/\s/g, '') + '\', \'' + mrbid.trim() + '\')"><p3>View Data</p3></button>';      

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
function showPlots(dam_name, mrbID){

   //Displaying dam name at top of offcanvas pop-up
   document.getElementById('graphOffcanvasLabel').innerHTML = '' + dam_name;
   //Opening RAT output data for the dam  
   inflowFilename = './assets/RAT_results/inflow/' + dam_name.toLowerCase() +'.csv';
   
   aecFilename = './assets/RAT_results/aec/' + dam_name.toLowerCase() +'.csv';
   
   evapFilename = './assets/RAT_results/evaporation/' + dam_name.toLowerCase() + '.csv'  ;
   
   SA_MNDWIFilename =  './assets/RAT_results/sarea_tmsos/' + dam_name.toLowerCase() + '_MNDWI.csv';
   SA_NDWIFilename =  './assets/RAT_results/sarea_tmsos/' + dam_name.toLowerCase() + '_NDWI.csv';
   sa_Filename = './assets/RAT_results/sarea_tmsos/' + dam_name.toLowerCase() + '.csv';

   outflow_MNDWIFilename =  './assets/RAT_results/outflow/' + dam_name.toLowerCase() + '_MNDWI.csv';
   outflow_NDWIFilename =  './assets/RAT_results/outflow/' + dam_name.toLowerCase() + '_NDWI.csv';
   outflow_Filename = './assets/RAT_results/outflow/' + dam_name.toLowerCase() + '.csv';

   delS_Filename = './assets/RAT_results/dels/' + dam_name.toLowerCase() + '.csv';

   temp_Filename = './assets/WQ/temperature/' + mrbID + '_' + dam_name + '_RES.csv';

   ssc_Filename = './assets/WQ/ssc/' + mrbID + '_' + dam_name + '_RES.csv';
   
   //edge cases due to file naming structure of ssc and temp scripts
   if(dam_name == 'Pazhassi'){
      ssc_Filename = './assets/WQ/ssc/' + mrbID + '_pazhassi_RES.csv';
      temp_Filename = './assets/WQ/temperature/' + mrbID + '_pazhassi_RES.csv';
   }
   if(dam_name == 'Chimmini'){
      ssc_Filename = './assets/WQ/ssc/' + mrbID + '_Chimoni_RES.csv';
      temp_Filename = './assets/WQ/temperature/' + mrbID + '_Chimoni_RES.csv';
   }

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

      showAEC(aecFilename,dam_name);
   });  
   // document.getElementById('areaRadio').addEventListener('click', function() {

   //    showSA(SA_MNDWIFilename,SA_NDWIFilename);
   // });
   document.getElementById('areaRadio').addEventListener('click', function() {

      showSA(sa_Filename);
   });
   // document.getElementById('outflowRadio').addEventListener('click', function() {

   //    showOutflow(outflow_MNDWIFilename,outflow_NDWIFilename);
   // });
   document.getElementById('outflowRadio').addEventListener('click', function() {

      showOutflow(outflow_Filename);
   });
   document.getElementById('delSRadio').addEventListener('click', function() {

      showdelS(delS_Filename);
   });
   document.getElementById('temperatureRadio').addEventListener('click', function() {

      showtemp(temp_Filename);
   });
   document.getElementById('sscRadio').addEventListener('click', function() {

      showSSC(ssc_Filename);
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
         mode: 'lines+markers',
         marker: {
            color: 'blue',
            size: '4'

         },
         line: {
            color: 'blue' // Customize the line color here
         }
      }];

      var layout = {
         title: 'Inflow Data',
         xaxis: {
            title: 'Date'
         },
         yaxis: {
            title: 'Inflow (m<sup>3</sup>/s)'
         },
         hovermode: 'closest'
      };

      Plotly.newPlot('graphCanvas', data, layout);
   })
   .catch(error => console.error(error));
}

// Function for outflow plotting
function showOutflow(outflow_Filename) {
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
   

   // Load outflow data based on the filename
   fetch(outflow_Filename)
   .then(response => response.text())
   .then(data => {
      // Parse the CSV data and create the Plotly chart
      var rows = data.split('\n');
      var dates = [];
      var outflowData = [];
      for (var i = 1; i < rows.length; i++) {
         var cols = rows[i].split(',');
         dates.push(cols[0]);
         outflowData.push(parseFloat(cols[1]));
      }

      var data = [{
         x: dates,
         y: outflowData.map(value => value / 86400),
         type: 'scatter',
         mode: 'lines+markers',
         marker: {
            color: 'red',
            size: '4'

         },
         line: {
            color: 'red' // Customize the line color here
         }
      }];

      var layout = {
         title: 'Outflow Data',
         xaxis: {
            title: 'Date'
         },
         yaxis: {
            title: 'Outflow (m<sup>3</sup>/s)'
         },
         hovermode: 'closest'
      };

      Plotly.newPlot('graphCanvas', data, layout);
   })
   .catch(error => console.error(error));
}

// //Function to plot Surface Area
// function showSA(sa_MNDWI, sa_NDWI) {
//    if (offcanvastriggered == false) {
//       var offcanvas = new bootstrap.Offcanvas(document.getElementById('graphOffcanvas'));
//       offcanvas.show();
//       offcanvastriggered = true;

//       // Reset radio button group
//       var radioButtons = document.querySelectorAll('[name="graphOptions"]');
//       radioButtons.forEach(function(radioButton) {
//          radioButton.checked = false;
//       });
//    }

//    // Load sa_MNDWI data
//    fetch(sa_MNDWI)
//    .then(response => response.text())
//    .then(dataMNDWI => {
//       // Parse the CSV data
//       var rowsMNDWI = dataMNDWI.split('\n');
//       var dates = [];
//       var saMNDWI = [];
//       for (var i = 1; i < rowsMNDWI.length; i++) {
//          var cols = rowsMNDWI[i].split(',');
//          dates.push(cols[0]);
//          saMNDWI.push(parseFloat(cols[1]));
//       }

//       // Load sa_NDWI data
//       fetch(sa_NDWI)
//       .then(response => response.text())
//       .then(dataNDWI => {
//          // Parse the CSV data
//          var rowsNDWI = dataNDWI.split('\n');
//          var saNDWI = [];
//          for (var i = 1; i < rowsNDWI.length; i++) {
//             var cols = rowsNDWI[i].split(',');
//             saNDWI.push(parseFloat(cols[1]));
//          }

//          // Compute the mean of saMNDWI and saNDWI
//          var meanSA = saMNDWI.map((value, index) => (value + saNDWI[index]) / 2);

//          // Create the Plotly chart
//          var data = [
//             {
//                x: dates,
//                y: saMNDWI,
//                type: 'scatter',
//                mode: 'lines',
//                name: 'SA MNDWI',
//                showlegend: false,
//                line: {
//                   color: 'rgba(255, 213, 0,0.3)' // Customize the line color here
//                }
//             },
//             {
//                x: dates,
//                y: saNDWI,
//                type: 'scatter',
//                mode: 'lines',
//                name: 'SA NDWI',
//                showlegend: false,
//                line: {
//                   color: 'rgba(255, 213, 0,0.3)' // Customize the line color here
//                }
//             },
            
//             {
//                x: dates,
//                y: saMNDWI,
//                fill: 'tonexty',
//                type: 'scatter',
//                showlegend: false,
//                // stackgroup: 'one',
//                mode: 'none',
//                fillcolor: 'rgba(255, 213, 0,0.05)',
//             },
//             {
//                x: dates,
//                y: saNDWI,
//                fill: 'tonexty',
//                type: 'scatter',
//                showlegend: true,
//                // stackgroup: 'one',
//                mode: 'none',
//                fillcolor: 'rgba(255, 213, 0,0.3)',
//                name: 'Optical Uncertainty'
//             },
//             {
//                x: dates,
//                y: meanSA,
//                type: 'scatter',
//                mode: 'lines+markers',
//                name: 'SAR corrected Optical SA',
//                marker: {
//                   color: 'blue',
//                   size: '5'

//                },
//                line: {
//                   color: 'blue' // Customize the line color here
//                }
//             }
//          ];

//          var layout = {
//             title: 'Surface Area Data',
//             xaxis: {
//                title: 'Date'
//             },
//             yaxis: {
//                title: 'Surface Area(km<sup>2</sup>)'
//             },
//             hovermode: 'closest'
//          };

//          Plotly.newPlot('graphCanvas', data, layout);
//       })
//       .catch(error => console.error(error));
//    })
//    .catch(error => console.error(error));
// }

// Function for outflow plotting
function showSA(sa_Filename) {
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
   

   // Load sa data based on the filename
   fetch(sa_Filename)
   .then(response => response.text())
   .then(data => {
      // Parse the CSV data and create the Plotly chart
      var rows = data.split('\n');
      var dates = [];
      var saData = [];
      for (var i = 1; i < rows.length; i++) {
         var cols = rows[i].split(',');
         dates.push(cols[0]);
         saData.push(parseFloat(cols[1]));
      }

      var data = [{
         x: dates,
         y: saData,
         type: 'scatter',
         mode: 'lines+markers',
         marker: {
            color: 'darkblue',
            size: '4'

         },
         line: {
            color: 'darkblue' // Customize the line color here
         }
      }];

      var layout = {
         title: 'Surface Area Data',
         xaxis: {
            title: 'Date'
         },
         yaxis: {
            title: 'Area (km<sup>2</sup>)'
         },
         hovermode: 'closest'
      };

      Plotly.newPlot('graphCanvas', data, layout);
   })
   .catch(error => console.error(error));
}

//Function to plot Outflow
// function showOutflow(sa_MNDWI, sa_NDWI) {
//    if (offcanvastriggered == false) {
//       var offcanvas = new bootstrap.Offcanvas(document.getElementById('graphOffcanvas'));
//       offcanvas.show();
//       offcanvastriggered = true;

//       // Reset radio button group
//       var radioButtons = document.querySelectorAll('[name="graphOptions"]');
//       radioButtons.forEach(function(radioButton) {
//          radioButton.checked = false;
//       });
//    }

//    // Load sa_MNDWI data
//    fetch(sa_MNDWI)
//    .then(response => response.text())
//    .then(dataMNDWI => {
//       // Parse the CSV data
//       var rowsMNDWI = dataMNDWI.split('\n');
//       var dates = [];
//       var saMNDWI = [];
//       for (var i = 1; i < rowsMNDWI.length; i++) {
//          var cols = rowsMNDWI[i].split(',');
//          dates.push(cols[0]);
//          saMNDWI.push(parseFloat(cols[1]));
//       }

//       // Load sa_NDWI data
//       fetch(sa_NDWI)
//       .then(response => response.text())
//       .then(dataNDWI => {
//          // Parse the CSV data
//          var rowsNDWI = dataNDWI.split('\n');
//          var saNDWI = [];
//          for (var i = 1; i < rowsNDWI.length; i++) {
//             var cols = rowsNDWI[i].split(',');
//             saNDWI.push(parseFloat(cols[1]));
//          }

//          // Compute the mean of saMNDWI and saNDWI
//          var meanSA = saMNDWI.map((value, index) => (value + saNDWI[index]) / 2);

//          // Create the Plotly chart
//          var data = [
//             {
//                x: dates,
//                y: saMNDWI.map(value => value / 86400),
//                type: 'scatter',
//                mode: 'lines',
//                name: 'SA MNDWI',
//                showlegend: false,
//                line: {
//                   color: 'rgba(255, 150, 0,0.3)' // Customize the line color here
//                }
//             },
//             {
//                x: dates,
//                y: saNDWI.map(value => value / 86400),
//                type: 'scatter',
//                mode: 'lines',
//                name: 'SA NDWI',
//                showlegend: false,
//                line: {
//                   color: 'rgba(255, 150, 0,0.3)' // Customize the line color here
//                }
//             },
            
//             {
//                x: dates,
//                y: saMNDWI.map(value => value / 86400),
//                fill: 'tonexty',
//                type: 'scatter',
//                showlegend: false,
//                // stackgroup: 'one',
//                mode: 'none',
//                fillcolor: 'rgba(255, 150, 0,0.05)',
//             },
//             {
//                x: dates,
//                y: saNDWI.map(value => value / 86400),
//                fill: 'tonexty',
//                type: 'scatter',
//                showlegend: true,
//                // stackgroup: 'one',
//                mode: 'none',
//                fillcolor: 'rgba(255, 150, 0,0.3)',
//                name: 'Outflow  Uncertainty'
//             },
//             {
//                x: dates,
//                y: meanSA.map(value => value / 86400),
//                type: 'scatter',
//                mode: 'lines+markers',
//                name: 'RAT Outflow',
//                marker: {
//                   color: 'red',
//                   size: '5'

//                },
//                line: {
//                   color: 'red' // Customize the line color here
//                }
//             }
//          ];

//          var layout = {
//             title: 'Outflow Data',
//             xaxis: {
//                title: 'Date'
//             },
//             yaxis: {
//                title: 'Outflow(m<sup>3</sup>/s)'
//             },
//             hovermode: 'closest'
//          };

//          Plotly.newPlot('graphCanvas', data, layout);
//       })
//       .catch(error => console.error(error));
//    })
//    .catch(error => console.error(error));
// }

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
        mode: 'lines+markers',
        marker: {
         color: 'green',
         size: '4'

      },
      line: {
         color: 'green' 
      }
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

// Function for temperature plotting
function showtemp(temp_Filename) {
   if(offcanvastriggered == false){
      var offcanvas = new bootstrap.Offcanvas(document.getElementById('graphOffcanvas'));
      offcanvas.show();
      offcanvastriggered = true
   }  

  // Load evap data based on the filename
  fetch(temp_Filename)
  .then(response => response.text())
  .then(data => {
     // Parse the CSV data and create the Plotly chart
     var rows = data.split('\n');
     var dates = [];
     var tempData = [];
     for (var i = 1; i < rows.length; i++) {
        var cols = rows[i].split('\t');
        dates.push(cols[0]);
        tempData.push(parseFloat(cols[1]));
     }

     var data = [{
        x: dates,
        y: tempData,
        type: 'scatter',
        mode: 'lines+markers',
        marker: {
         color: 'white',
         size: '5',
         line: {
            color: 'red',
            width: 2
         }

      },
      line: {
         color: 'red',
         width: '2'
      }
     }];

     var layout = {
        title: 'Temperature Data',
        xaxis: {
           title: 'Date'
        },
        yaxis: {
           title: 'Temperature (°C)'
        },
        hovermode: 'closest'
     };

     Plotly.newPlot('graphCanvas', data, layout);
  })
  .catch(error => console.error(error));
}

// Function for SSC plotting
function showSSC(ssc_Filename) {
   if(offcanvastriggered == false){
      var offcanvas = new bootstrap.Offcanvas(document.getElementById('graphOffcanvas'));
      offcanvas.show();
      offcanvastriggered = true
   }  

  // Load evap data based on the filename
  fetch(ssc_Filename)
  .then(response => response.text())
  .then(data => {
     // Parse the CSV data and create the Plotly chart
     var rows = data.split('\n');
     var dates = [];
     var sscData = [];
     for (var i = 1; i < rows.length; i++) {
        var cols = rows[i].split('\t');
        dates.push(cols[0]);
        sscData.push(parseFloat(cols[1]));
     }

     var data = [{
        x: dates,
        y: sscData,
        type: 'scatter',
        mode: 'lines+markers',
        marker: {
         color: 'white',
         size: '5',
         line: {
            color: 'purple',
            width: 2
         }

      },
      line: {
         color: 'purple',
         width:  '2' 
      }
     }];

     var layout = {
        title: 'Suspended Sediment Concentration Data',
        xaxis: {
           title: 'Date'
        },
        yaxis: {
           title: 'SSC (mg/L)'
        },
        hovermode: 'closest'
     };

     Plotly.newPlot('graphCanvas', data, layout);
  })
  .catch(error => console.error(error));
}

// Function for aec plotting
function showAEC(aecFilename,dam_name) {

   if(offcanvastriggered == false){
      var offcanvas = new bootstrap.Offcanvas(document.getElementById('graphOffcanvas'));
      offcanvas.show();
      offcanvastriggered = true
   }

   var dam_aecShift = {Pazhassi : 102,
      Banasurasagar : 2390,
      Karapuzha : 2440,
      Peruvannamuzhi : 150,
      Kanjirapuzha : 300,
      Malampuzha : 334,
      Mangalam : 200,
      Parambikulam : 1830,
      Sholayar : 2625,
      Peechi : 230,
      Chimmini : 219,
      Idamalayaar : 511,
      Anayirankal : 3940,
      Ponmudi : 2280,
      Idukki : 2372,
      Mullaperiyar : 2850,
      Kakki : 3210,
      Thenmala : 360,
      Neyyar : 285,      
   }
  // Load aec data based on the filename
  fetch(aecFilename)
  .then(response => response.text())
  .then(data => {
     // Parse the CSV data and create the Plotly chart
     var rows = data.split('\n');
     var elevation = [];
     var elevation_feet = []
     var aecData = [];
     for (var i = 1; i < rows.length; i++) {
        var cols = rows[i].split(',');
        elevation = parseFloat(cols[0]);
        // Convert elevation from meters to feet
        var sa = parseFloat(cols[1]);
        elevation_feet.push(elevation * 3.28084); // 1 meter = 3.28084 feet
        aecData.push(sa);
        
        
     }

     var data = [{
      y: elevation_feet,
      x: aecData,
      type: 'scatter',
      mode: 'lines',
        
      line: {
         color: 'skyblue',
         width: 3 // Customize the line color here
      },
      fill: 'tozerox'
     }];

     var layout = {
        title: 'Area-Elevation Curve',
        yaxis: {
           title: 'Elevation (ft)',
           range: [dam_aecShift[dam_name]-200, elevation_feet[elevation_feet.length-2]+200]
        },
        xaxis: {
           title: 'Surface Area (km<sup>2</sup>)'
        },
        hovermode: 'closest'
     };

     Plotly.newPlot('graphCanvas', data, layout);
  })
  .catch(error => console.error(error));
}

//Function to plot delS
function showdelS(delSFilename) {
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
   fetch(delSFilename)
   .then(response => response.text())
   .then(data => {
      // Parse the CSV data and create the Plotly chart
      var rows = data.split('\n');
      var dates = [];
      var delsData = [];
      for (var i = 1; i < rows.length; i++) {
         var cols = rows[i].split(',');
         dates.push(cols[0]);
         delsData.push(parseFloat(cols[1]));
      }

      var data = [{
         x: dates,
         y: delsData.map(value => value/1000000000),
         type: 'scatter',
         mode: 'lines+markers',
         marker: {
            color: 'black',
            size: '4'

         },
         line: {
            color: 'black',
            width: 2 
         }
      }];

      var layout = {
         title: 'Storage Change Data',
         xaxis: {
            title: 'Date'
         },
         yaxis: {
            title: 'Storage Change (km<sup>3</sup>)'
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



//Precipiation plotting
//Elements:- Precipitaion Toggle, ColorBar Legend, DatePicker, Plot

var precipitationToggle = document.getElementById("precipitationToggle");
var precipitationMarkers = [];
var ColorBarLegend;
var precipMinMax;
precipitationToggle.addEventListener("change", function () {
   if (precipitationToggle.checked) {
      precipON = true;
      cartoDBPositron.addTo(map);
      createDatePicker()
      map.removeLayer(damGroup)

      plotPrecipitation()
      .then(precipMinMax => {
                 
         plotColorBar(precipMinMax.min,precipMinMax.max)
      })
      .catch(error => {
         console.error('An error occurred:', error);
      });
    
      var datePickerInput = document.getElementById("datePicker");   
       // Listen for the change event of datepicker
       datePickerInput.addEventListener("change", function(event) {
          var selectedDate = event.target.value;      
          
          //remove existing precipitaion plot and colorbar
          for (var i = 0; i < precipitationMarkers.length; i++) {
            map.removeLayer(precipitationMarkers[i]);
          }
          precipitationMarkers = [];
          removeColorBar();

          //re-plot with new date and new colorbar
          plotPrecipitation(selectedDate)
         .then(precipMinMax => {
                        
            plotColorBar(precipMinMax.min,precipMinMax.max)
         })
         .catch(error => {
            console.error('An error occurred:', error);
         });
       });


   
     
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
      

      removeColorBar();
      datePickerControl.remove()

      damGroup.addTo(map)
     // When the toggle is unchecked, remove the precipitation markers
     for (var i = 0; i < precipitationMarkers.length; i++) {
       map.removeLayer(precipitationMarkers[i]);
     }
     precipitationMarkers = []; // Clear the markers array
     
     
   }
 });


function plotPrecipitation(selectedDate = "2023-09-01"){
   var maxPrecip = 0;
   var minPrecip = 200;
   var precipMinMax = {}
   console.log(maxPrecip,minPrecip)
   return new Promise((resolve,reject) => {   
// Load the shapefile (Kerala.geojson) to ensure that only those values of precipitaion that lie insdie the region is considered. 
   fetch('./assets/map_data/Kerala_shp.geojson')
      .then(response => response.json())
      .then(geojson => {
         // Load and parse the ASC file
         const ascFileName = `${selectedDate}_IMERG.asc`;
         fetch(`./assets/RAT_results/precipitation/${ascFileName}`)
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
                  precipMinMax = {min: minPrecip, max: maxPrecip}
                  resolve(precipMinMax)
                  
                               
                  
                  
               })
               .catch(error => {
                  console.error('Error loading ASC file:', error);
                  reject(error);
               });
               
      })
      .catch(error => {
         console.error('Error loading shapefile:', error);
         reject(error);
      });
      
   })
   
}

let colorBarLegendContainer; // Store the color bar legend container

function plotColorBar(min, max) {
   // Create the container for the color bar legend
   colorBarLegendContainer = L.DomUtil.create("div", "color-bar-legend");
   colorBarLegendContainer.innerHTML = `
      <div class="legend-container">
         <div class="legend-labels">
            <span class="legend-max">${max}mm</span>
         </div>
         <div class="legend-color-bar"></div>
         <div class="legend-labels">
            <span class="legend-min">${min}mm</span>
         </div>
      </div>
   `;

   // Add the container to the map's control container
   map.getContainer().querySelector(".leaflet-top.leaflet-left").appendChild(colorBarLegendContainer);
}

// Function to remove the color bar legend from the map
function removeColorBar() {
   if (colorBarLegendContainer && colorBarLegendContainer.parentNode) {
      colorBarLegendContainer.parentNode.removeChild(colorBarLegendContainer);
   }
}

//Date selector for precipiation
var datePickerControl;
function createDatePicker(){
   var DatePickerControl = L.Control.extend({
      onAdd: function (map) {
         var container = L.DomUtil.create("div", "date-picker-container"); // Add the class "date-picker-container"
         container.innerHTML = `
            <div class="toggle-box bg-dark px-2 py-0 rounded">
               <input type="date" id="datePicker" value="2023-09-01" class="form-control bg-dark">
            </div>
         `;
         return container;
      },
   });
   datePickerControl = new DatePickerControl({ position: "topleft" });
   datePickerControl.addTo(map);
}