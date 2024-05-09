class GroupedBarChart {
    constructor(_config, _data, _colorScale) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 400, // Adjusted container width
            containerHeight: _config.containerHeight || 450, // Adjusted container height
            margin: _config.margin || { top: 10, right: 30, bottom: 80, left: 60 }, // Adjusted margin
            tooltipPadding: _config.tooltipPadding || 15
        };
        this.data = _data;
        this.colorScale = _colorScale;
        this.selectedAirlines = []; // Array to store the selected airlines
        this.initVis();
    }

    initVis() {
        this.width = this.config.containerWidth - this.config.margin.left - this.config.margin.right;
        this.height = this.config.containerHeight - this.config.margin.top - this.config.margin.bottom;

        // Append SVG container for the grouped bar chart
        this.svg = d3.select(this.config.parentElement)
            .append('svg')
            .attr('id', 'grouped-bar-container')
            .attr('width', this.config.containerWidth)
            .attr('height', this.config.containerHeight)
            .append('g')
            .attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);

        // Create checkboxes for airline selection
        this.createCheckboxes();

        // Append x-axis container
        this.svg.append("g")
            .attr("class", "axis axis-x")
            .attr("transform", `translate(0,${this.height})`);

        // Append y-axis container
        this.svg.append("g")
            .attr("class", "axis axis-y");

        // Render the visualization
        this.updateVis(); // Initially render with no data
    }

    // Create checkbox menu
    createCheckboxes() {
        const parentElement = document.querySelector(this.config.parentElement);
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'checkbox-container';
    
        // Extract unique airline names
        const uniqueAirlines = [...new Set(this.data.map(d => d.carrier_name))];
    
        uniqueAirlines.forEach(airline => {
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'checkbox-item';
    
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = airline;
            checkbox.checked = false; // Default to unchecked
            checkbox.addEventListener('change', () => {
                this.updateSelectedAirlines();
                // Dispatch a custom event only when a checkbox is checked
                if (checkbox.checked) {
                    const event = new CustomEvent('airlineSelectionChanged', { detail: { selectedAirlines: this.selectedAirlines } });
                    document.dispatchEvent(event);
                }
                // Also update the visualization
                this.updateVis();
            });
    
            const label = document.createElement('label');
            label.textContent = airline;
    
            // Append checkbox and label to the checkbox container
            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
    
            // Append checkbox container to the main checkbox div
            checkboxDiv.appendChild(checkboxContainer);
        });
    
        // Append checkbox container to the parent element
        parentElement.insertBefore(checkboxDiv, parentElement.firstChild);
    }
    
    // Update selected airlines
    updateSelectedAirlines() {
        this.selectedAirlines = [];
        const checkboxes = document.querySelectorAll(`${this.config.parentElement} input[type="checkbox"]:checked`);
        checkboxes.forEach(checkbox => {
            this.selectedAirlines.push(checkbox.value);
        });
    }

    // Update visualization
    updateVis() {
        if (this.selectedAirlines.length === 0) {
            // If no checkboxes are checked, render an empty visualization
            this.renderVis(new Map());
        } else {
            // Filter data based on selected airlines
            const filteredData = this.data.filter(d => this.selectedAirlines.includes(d.carrier_name));
            
            // Pass filtered data to the scatterplot
            const event = new CustomEvent('airlineSelectionChanged', { detail: { selectedAirlines: this.selectedAirlines } });
            document.dispatchEvent(event);
            
            // Calculate max values for grouped bar chart
            const nestedData = d3.group(filteredData, d => d.carrier_name);
            const maxValues = new Map();
            nestedData.forEach((value, key) => {
                let maxArrFlights = 0;
                let maxArrCancelled = 0;
                let maxArrOntime = 0;
                value.forEach(entry => {
                    maxArrFlights += +entry.arr_flights;
                    maxArrCancelled += +entry.arr_cancelled;
                    maxArrOntime += +entry.arr_ontime;
                });
                maxValues.set(key, {
                    arr_flights: maxArrFlights,
                    arr_cancelled: maxArrCancelled,
                    arr_ontime: maxArrOntime
                });
            });
    
            // Render the grouped bar chart with the filtered data
            this.renderVis(maxValues);
        }
    }

    renderVis(maxValues) {
        const nestedData = maxValues ? Array.from(maxValues.keys()) : [];
        const categories = ["arr_flights", "arr_cancelled", "arr_ontime"];

        // Set the width of each bar
        const barWidth = 15;

        this.width = this.config.containerWidth - this.config.margin.left - this.config.margin.right;

        //const newWidth = this.width * 1.5
        const x0 = d3.scaleBand()
            .domain(nestedData)
            .rangeRound([0, this.width])
            .paddingInner(0.2)
            .paddingOuter(0.2);

        const x1 = d3.scaleBand()
            .domain(categories)
            .rangeRound([0, barWidth * categories.length]) // Adjusted range to accommodate thicker bars
            .padding(0.05);

        const y = d3.scaleLinear()
            .domain([0, 14000000])
            .nice()
            .rangeRound([this.height, 0]);

        const color = d3.scaleOrdinal()
            .domain(categories)
            .range(["#98abc5", "#FFBF00", "#FF5733"]);

        const xAxis = d3.axisBottom(x0).tickSizeOuter(0);
        const yAxis = d3.axisLeft(y).ticks(10, ".0f");

        this.svg.select(".axis-x")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-35)")
            .style("font-size", "12px")
            .attr("text-anchor", "middle");

        this.svg.select(".axis-y")
            .call(yAxis);

        const bars = this.svg.selectAll(".bars")
            .data(nestedData)
            .join("g")
            .attr("class", "bars")
            .attr("transform", d => `translate(${x0(d)},0)`);

        bars.selectAll("rect")
            .data(d => categories.map(key => ({ key, value: maxValues.get(d)[key] || 0 })))
            .join("rect")
            .attr("x", (d, i) => x1(categories[i])) // Adjusted x position to spread bars apart
            .attr("y", d => y(d.value))
            .attr("width", x1.bandwidth())
            .attr("height", d => this.height - y(d.value))
            .attr("fill", d => color(d.key));

        // Remove existing legend and create a new one
        this.svg.selectAll(".legend").remove();

        const legend = this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.width - 120}, 10)`); // Adjusted legend position to top right

        legend.selectAll("rect")
            .data(categories)
            .join("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 20)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", d => color(d));

        legend.selectAll("text")
            .data(categories)
            .join("text")
            .attr("x", 15)
            .attr("y", (d, i) => i * 20 + 9)
            .text(d => {
                const nameMap = {
                    "arr_flights": "Total Flights",
                    "arr_cancelled": "Cancelled Flights",
                    "arr_ontime": "On Time Flights"
                };
                return nameMap[d];
            })
            .style("font-size", "14px")
            .attr("alignment-baseline", "middle");
    }

}
