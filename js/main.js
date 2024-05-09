// Load data from CSV file
d3.csv('data/project.csv').then(function(data) {
    // Convert numeric strings to numbers
    data.forEach(function(d) {
        
        d.carrier_delay = +d.carrier_delay;
        d.weather_delay = +d.weather_delay;
        d.arr_flights = +d.arr_flights;
        d.arr_ontime = +d.arr_ontime;
        d.arr_cancelled = +d.arr_cancelled;
    });


// Aggregate data to find the top 10 airports
const airportArrivalData = d3.rollups(data,
    v => d3.sum(v, d => d.arr_flights), // Sum up the number of flights arrived
    d => d.airport_name
);

// Sort airports based on the sum of flights arrived
const sortedAirports = airportArrivalData.sort((a, b) => d3.descending(a[1], b[1]));

// Select the top 10 airports
const top10Airports = sortedAirports.slice(0, 10).map(d => d[0]); // Top 10 airport names

// Create a mapping of airport names to corresponding states
const airportStateMap = new Map();
data.forEach(d => {
    airportStateMap.set(d.airport_name, d.state);
});

// Extract states of the top 10 airports
const top10AirportStates = new Set();
top10Airports.forEach(airport => {
    const state = airportStateMap.get(airport);
    if (state) {
        top10AirportStates.add(state);
    }
});


    // Instantiate the BarChart class and create the bar chart
    const barChartConfig = {
        parentElement: "#bar-chart-container",
        containerWidth: 800,
        containerHeight: 400
    };
    const barChart = new BarChart(barChartConfig, data);
    barChart.updateVis();

    // Instantiate the FlightMap class and create the map
    const mapConfig = {
        parentElement: "#map-chart-container",
        containerWidth: 800,
        containerHeight: 450
    };
    const flightMap = new FlightMap(mapConfig, data, 'data/us_states.json', Array.from(top10AirportStates));
    flightMap.renderVis();
    
    // Extract by Carrier Interaction for Scatterplot
    const carriers = data.map(d => d.carrier_name);
    const uniqueCarriers = Array.from(new Set(carriers));
    

    // Instantiate the Scatterplot class and create the scatterplot
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    const scatterplotConfig = {
        parentElement: "#scatterplot-container",
        containerWidth: 800,
        containerHeight: 400
    };
    const scatterplot = new ScatterPlot(scatterplotConfig, data, colorScale);
    scatterplot.updateVis();

    // Listen for airline selection change event
    document.addEventListener('airlineSelectionChanged', function(event) {
    const selectedAirlines = event.detail.selectedAirlines;
    // Call the filterByAirlines method of the Scatterplot and pass the selected airlines
    scatterplot.filterByAirlines(selectedAirlines);
    });

    // Instantiate the GroupedBarChart class and create the grouped bar chart
    const groupedBarChartConfig = {
        parentElement: "#grouped-bar-chart-container",
        containerWidth: 880,
        containerHeight: 500,
        margin: { top: 50, right: 5, bottom: 100, left: 50 }
    };
    const groupedBarChart = new GroupedBarChart(groupedBarChartConfig, data);
    groupedBarChart.updateVis();


    // Filter by Carrier Interaction for Scatterplot
    const scatterplotCarrierDropdown = d3.select("#scatterplot-carrier-dropdown");
    
    // Create options for carrier dropdown
    scatterplotCarrierDropdown.selectAll("option")
    .data(uniqueCarriers)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

    // Add event listener for dropdown change
    scatterplotCarrierDropdown.on("change",function(){
        const selectedCarrier = this.value;

        // Filter data based on selected carrier
        const filteredData = data.filter(d=>d.carrier_name === selectedCarrier);

        // Update scatterplot with filtered Data
        scatterplot.updateVis(filteredData);
    });

}).catch(function(error){
    console.error("error loading thr data:",error);
});

