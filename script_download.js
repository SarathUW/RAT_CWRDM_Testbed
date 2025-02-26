document.addEventListener("DOMContentLoaded", function () {
    var damDropdown = document.getElementById("damDropdown");

    // Load and parse the CSV data
    fetch('./assets/map_data/dam_locations.csv')
    .then(response => response.text())
    .then(data => {
        var rows = data.split('\n');
        var header = rows[0].split(',');

        for (var i = 1; i < rows.length-1; i++) {
            var cols = rows[i].split(',');
            var name = cols[2]; // Assuming the dam names are in the first column
            var mrbid = cols[3];    
            var option = document.createElement("option");
            option.value = name;
            option.text = name;
            damDropdown.appendChild(option);
        }
    })
    .catch(error => console.error(error));

    // Downloading data
    downloadButton.addEventListener("click", function (event) {
        event.preventDefault();
    
        var selectedDam = damDropdown.value;
        var selectedOption = document.getElementById("dataOption").value;
    
        // Construct the file URL based on the selected dam and option
        var fileUrl = `./assets/RAT_results/${selectedOption}/${selectedDam.toLowerCase().replace(/\s/g, '')}.csv`;
        
    
        // Combine selectedDam and selectedOption for the file name
        var fileName = `${selectedDam.replace(/\s/g, '_')}_${selectedOption}.csv`;
    
        // Create a temporary anchor element for the download
        var downloadLink = document.createElement("a");
        downloadLink.href = fileUrl;
        downloadLink.download = fileName;
    
        // Programmatically click on the anchor element to initiate download
        downloadLink.click();
    });
    
});
