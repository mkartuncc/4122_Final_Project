class FlightMap {
    constructor(_config, _data, _geoDataPath, _airportData) {
        this.config = {
            parentElement: _config.parentElement,
            width: _config.width || 850,
            height: _config.height || 600,
            margin: _config.margin || { top: 20, right: 20, bottom: 20, left: 10 },
            colorScale: _config.colorScale || d3.scaleSequential(d3.interpolateBlues).domain([0, 1000]) // Adjust color scale domain based on your data
        };
        this.data = _data;
        // this.barChart = _barChart;
        this.geoDataPath = _geoDataPath; // Path to your GeoJSON file
        this.airportData = _airportData; // Airport data containing state-wise airport counts
        this.projection = d3.geoAlbersUsa();
        this.path = d3.geoPath().projection(this.projection);
        this.initVis();
    }
    
    async initVis() {
        let vis = this;
    
        // Load GeoJSON data
        try {
            vis.geoData = await d3.json(vis.geoDataPath);
            
    
            // Create SVG container
            vis.svg = d3.select(vis.config.parentElement)
                .append('svg')
                .attr('width', vis.config.width)
                .attr('height', vis.config.height);
        } catch (error) {
            
        }
        
    
    vis.updateVis(0,'North Carolina');
     }
    updateVis(check,color) {
        let vis = this;
    
        // Define highlighted states
        const highlightedStates = ['Georgia', 'Illinois', 'Texas', 'Colorado', 'California', 'Arizona', 'North Carolina', 'Nevada'];
    
        // Append GeoJSON features to the map
        vis.svg.selectAll('.feature')
            .data(vis.geoData.features)
            .enter().append('path')
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('class', 'feature')
            .attr('d', vis.path)
            .attr('fill', d => {
                // Fill states with a color based on the number of airports
                const state = d.properties.NAME;
                const airportCount = vis.airportData[state] || 0;
                return vis.config.colorScale(airportCount);
            })
            .style('fill', d => {
                // Highlight specific states
                if(check == 0){
                    if (highlightedStates.includes(d.properties.NAME)) {
                        return '#ffd700'; // Change the fill color to  for highlighted states
                    } else {
                        return vis.config.colorScale(vis.airportData[d.properties.NAME] || 0); // Use default color for non-highlighted states
                    }
                

                }
                else{
                    if(check==1){
                        if(d.properties.NAME == color){
                            return "blue";
                        }
                        else{
                            if (highlightedStates.includes(d.properties.NAME)) {
                                return '#ffd700'; // Change the fill color to  for highlighted states
                            } else {
                                return vis.config.colorScale(vis.airportData[d.properties.NAME] || 0); // Use default color for non-highlighted states
                            }
                        }

                    }
                    
                }
                
            });

            
    
        // Append state labels to the map for highlighted states only
        vis.svg.selectAll('.state-label')
            .data(vis.geoData.features.filter(d => highlightedStates.includes(d.properties.NAME)))
            .enter().append('text')
            .attr('class', 'state-label')
            .attr('transform', d => `translate(${vis.path.centroid(d)})`) // Position labels at the centroid of each state
            .attr('dy', '.35em') // Offset labels slightly
            .text(d => d.properties.NAME); // Use the state name as the label text
    
        
            vis.renderVis();
    
        
    }
    
    
    renderVis() {
        
    }
    
}

