class ScatterPlot {
    constructor(_config, _data, _colorScale) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 400,
            containerHeight: _config.containerHeight || 400,
            margin: _config.margin || { top: 30, right: 50, bottom: 50, left: 70 },
            tooltipPadding: _config.tooltipPadding || 10
        };
        this.data = _data;
        this.colorScale = _colorScale;

        // Listen for airline selection change event
        document.addEventListener('airlineSelectionChanged', (event) => {
            const selectedAirlines = event.detail.selectedAirlines;
            // Call the filter method of the Scatterplot and pass the selected airlines
            this.filterByAirlines(selectedAirlines);
        });  

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

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom(vis.xScale)
            .tickSizeOuter(0);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .tickSizeOuter(0);

        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);

        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        vis.createCarrierDropdown();

        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', -vis.height / 2)
            .attr('y', vis.config.margin.left - 60)
            .attr('dy', '0.71em')
            .attr('transform', 'rotate(-90)')
            .style('text-anchor', 'middle')
            .text('Carrier Delay');

        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', vis.width / 2 + vis.config.margin.left)
            .attr('y', vis.height + vis.config.margin.top + 30)
            .attr('dy', '0.71em')
            .style('text-anchor', 'middle')
            .text('Weather Delay');

        vis.legend = vis.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top - 20})`);
        
            
    }
    // Create a dropdown to select carriers

    createCarrierDropdown() {
        let vis = this;
    
        const dropdownContainer = d3.select(vis.config.parentElement)
            .append('div')
            .attr('class', 'dropdown-container');
    
        dropdownContainer
            .append('label')
            .text('Select Carrier: ');
    
        vis.carrierDropdown = dropdownContainer
            .append('select')
            .attr('id', 'carrier-dropdown')
            .on('change', function () {
                const selectedCarrier = this.value;
                vis.filterData(selectedCarrier);
            });
    
        // Add default option for selecting all carriers
        vis.carrierDropdown.append('option')
            .attr('value', 'all')
            .text('All Carriers');
    
        vis.carrierDropdown.selectAll('option')
            .data([...new Set(vis.data.map(d => d.carrier_name))])
            .enter()
            .append('option')
            .attr('value', d => d)
            .text(d => d);
    }
    // Filter data based on selected carrier
    
    filterData(selectedCarrier) {
        let vis = this;
    
        if (selectedCarrier === 'all') {
            vis.updateVis(); // Show all data
        } else {
            const filteredData = vis.data.filter(d => d.carrier_name === selectedCarrier);
            vis.updateVis(filteredData);
        }
    }
    
    filterByAirlines(selectedAirlines) {
        // Limit the number of selected airlines to 3
        const latestSelectedAirlines = selectedAirlines.slice(-2);
        // Filter data based on the latest selected airlines
        const filteredData = this.data.filter(d => latestSelectedAirlines.includes(d.carrier_name));
        // Update the visualization with filtered data
        this.updateVis(filteredData);
    }
    

    updateVis(filteredData = null) {
        let vis = this;
    
        vis.colorValue = d => d.year;
        vis.xValue = d => d.carrier_delay;
        vis.yValue = d => d.weather_delay;
    
        const data = filteredData ? filteredData : vis.data;
    
        data.forEach(d => {
            d.carrier_delay = +d.carrier_delay;
            d.weather_delay = +d.weather_delay;
        });
    
        // Clear existing scatterplot data
        vis.chart.selectAll('.point').remove();
    
        vis.xScale.domain([0, d3.max(data, vis.xValue)]).nice();
        vis.yScale.domain([0, d3.max(data, vis.yValue)]).nice();
    
        vis.renderVis(data);
    }    
    
    renderVis(data) {
        let vis = this;
    
        // Remove any existing scatterplot points
        vis.chart.selectAll('.point').remove();
    
        // Add new scatterplot points
        const points = vis.chart.selectAll('.point')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'point')
            .attr('r', 3)
            .attr('cx', d => vis.xScale(vis.xValue(d)))
            .attr('cy', d => vis.yScale(vis.yValue(d)))
            .attr('fill', d => vis.colorScale(vis.colorValue(d)))
            .attr('opacity', 0.7)
            .on('mouseover', function (event, d) {
                d3.select(this).attr('r', 5).attr('stroke', 'black').attr('stroke-width', 2);
                vis.tooltip.html(`<strong>Carrier Name:</strong> ${d.carrier_name}<br><strong>Carrier Delay:</strong> ${d.carrier_delay}<br><strong>Weather Delay:</strong> ${d.weather_delay}<br><strong>Year:</strong> ${d.year}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 15) + 'px')
                    .style('opacity', 0.9);
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', 3).attr('stroke', 'none');
                vis.tooltip.style('opacity', 0);
            });
    
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
    
        // Initialize tooltip
        vis.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background-color', 'white')
            .style('border', '1px solid black')
            .style('padding', '5px')
            .style('opacity', 0); // Set initial opacity to 0
            const uniqueYears = [...new Set(data.map(d => d.year))];
        const legendWidth = uniqueYears.length * 100;

        vis.legend.selectAll('.legend').remove();
    
        const legend = vis.legend.selectAll('.legend')
            .data(uniqueYears)
            .join('g')
            .attr('class', 'legend')
            .attr('transform', (d, i) => `translate(${(vis.width - legendWidth) / 2 + i * 100}, 0)`);
    
        legend.append('rect')
            .attr('width', '12px')
            .attr('height', '12px')
            .attr('fill', d => vis.colorScale(d));
    
        legend.append('text')
            .attr('x', 15)
            .attr('y', 6)
            .style('fill', 'black')
            .attr('text-anchor', 'left')
            .style('alignment-baseline', 'middle')
            .style('font-size', '14px')
            .text(d => d);

    }
    
}
