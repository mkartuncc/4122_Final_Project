class BarChart {
    constructor(_config, _data, _flightMap) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 400,
            containerHeight: _config.containerHeight || 400,
            margin: _config.margin || { top: 5, right: 5, bottom: 70, left: 200 }
        };
        this.data = _data;
        this.flightMap = _flightMap;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.xScale = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yScale = d3.scaleBand()
            .padding(0.5)
            .range([0, vis.height]);

        vis.xAxis = d3.axisBottom(vis.xScale)
            .tickSizeOuter(0);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .tickSize(0);

        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);

        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        vis.yGrid = d3.axisLeft(vis.yScale)
            .tickSize(0)
            .tickFormat('')
            .ticks(6);

        vis.yGridG = vis.chart.append('g')
            .attr('class', 'grid y-grid')
            .call(vis.yGrid);

        // Add x-axis label
        vis.svg.append('text')
            .attr('class', 'x-axis-label')
            .attr('x', vis.config.margin.left + vis.width / 2)
            .attr('y', vis.config.containerHeight - 10)
            .style('text-anchor', 'middle')
            .text('Number of Flights Arrived')
            .style('font-size', '18px');

        // Add y-axis label
        vis.svg.append('text')
            .attr('class', 'y-axis-label')
            .attr('x', -vis.config.margin.top - vis.height / 2)
            .attr('y', 15)
            .attr('transform', 'rotate(-90)')
            .style('text-anchor', 'middle')
            .text('Airport Name')
            .style('font-size', '18px');

        // Initialize tooltip
        vis.tooltip = d3.select(vis.config.parentElement)
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

    }

    updateVis() {
        let vis = this;

        // Group data by airport name and sum up arrived flights
        const arr_flights = d3.rollups(vis.data,
            v => d3.sum(v, d => d.arr_flights), // sum up arrived flights
            d => d.airport_name
        );


       

        // Convert the grouped data into an array of objects
        const airports = Array.from(arr_flights, ([airport_name, arr_flights]) => ({ airport_name, arr_flights }));

        // Sort the airports by arrival flights in descending order
        vis.data = airports.sort((a, b) => d3.descending(a.arr_flights, b.arr_flights));

        // Take top 10 airports
        const topAirports = vis.data.slice(0, 10);

        // Update yScale domain with airport names
        vis.yScale.domain(topAirports.map(d => d.airport_name))
            .range([0, vis.height]);

        // Update xScale domain with maximum arrival flights
        const maxArrFlights = d3.max(topAirports, d => d.arr_flights);
        vis.xScale.domain([0, maxArrFlights])
            .range([0, vis.width]);

        vis.xAxis.ticks(6);
        vis.xAxisG.call(vis.xAxis);

        vis.renderVis(topAirports);
    }


    renderVis(topAirports) {
        let vis = this;

        const barThickness = 25;

        const bars = vis.chart.selectAll('.bar')
            .data(topAirports);

        bars.enter().append('rect')
            .attr('class', 'bar')
            .merge(bars)
            .attr('x', 0)
            .attr('y', d => vis.yScale(d.airport_name))
            .attr('width', d => vis.xScale(d.arr_flights))
            .attr('height', barThickness)
            .style('fill', '#3182bd') // Set color to blue
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .style('fill', '#a5b3fa'); // Change color on hover
                // Show tooltip
                vis.tooltip.html(`<strong>Airport:</strong> ${d.airport_name}<br><strong>Arrival Flights:</strong> ${d.arr_flights}`)
                    .style('left', event.pageX + 'px')
                    .style('top', event.pageY + 'px')
                    .style('opacity', 0.9);
                    if(vis.flightMap){
                
                    vis.flightMap.updateVis(1,'North Carolina');
                    }
            })
            .on('click', function (event, d) {
                // Update the FlightMap when a bar is clicked
                if (vis.flightMap) {
                    vis.flightMap.highlightAirport(d.airport_name);
                }
            })
            .on('mousemove', function (event) {
                // Move tooltip with mouse
                vis.tooltip.style('left', event.pageX + 'px')
                    .style('top', event.pageY + 'px');
            })
            .on('mouseleave', function () {
                d3.select(this)
                    .style('fill', '#3182bd'); // Revert color on mouse leave
                // Hide tooltip
                vis.tooltip.style('opacity', 0);
            });

        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);

        // Resize the chart to fit the labels
        vis.svg.attr('height', Math.max(vis.config.margin.top + vis.config.margin.bottom + topAirports.length * 30, vis.config.containerHeight));
    }

    highlightAirports(airport_name) {
        let vis = this;
        // Highlight airports on the flight map
        if (vis.flightMap) {
            vis.flightMap.highlightAirports(airport_name);
        }
}
}