var w = 1024;
var h = 480;

var legendHeight = .5 * h;
var legendWidth = 24;

var margin = {
    left: 20,
    right: 20,
    top: 40,
    bottom: 40
};

const DEFAULTYEAR = 2015;
const DEFAULTCOUNTRY = "CHN";

window.onload = function() {

    var requests = [d3v5.json("data/life_expectancy_after.json")]

    Promise.all(requests).then(function(response) {


        var years = new Set();

        for (i = 0; i < response[0].length; i++) {
          years.add(response[0][i].Year);
        }
        years = Array.from(years);
        years.sort();

        var yearOptions = d3v5.select("#yearSelect").selectAll("option")
            .data(years.reverse())
            .enter().append("option")
            .property("selected", d => d === DEFAULTYEAR)
            .text(d => d);


        life_expectancy_total = response[0].filter(d => d.Variable == "Total population at birth");

        drawMap(life_expectancy_total, DEFAULTYEAR);


        var yearOptions = d3v5.select("#yearSelect").on("change", function() {
            drawMap.update(this.value, 750);
        });


        dataCountry = response[0].filter(d => d.COU == DEFAULTCOUNTRY);
        drawLineGraph(response[0]);
        drawLineGraph.update(DEFAULTCOUNTRY);

    });
};


function drawLineGraph(dataset) {
    drawLineGraph.update = update;

    // Used help from https://bl.ocks.org/d3noob/402dd382a51a4f6eea487f9a35566de0/

    var dataHere = dataset;

    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;

    yearMax = d3v5.max(dataHere, d => d.Year);
    yearMin = d3v5.min(dataHere, d => d.Year);



    var svg = d3v5.select("#lineSVG").attr("width", w).attr("height", h);


    const tooltip = d3v5.select('#tooltip');
    const tooltipLine = svg.append('line');


    // Scale for x.
    var xScale = d3v5.scaleLinear()
        .domain([yearMin, yearMax])
        .range([0, width]);
    // Function for x axis.
    var xAxis = g => g
        .attr("transform", "translate(" + margin.left + "," + (margin.top + height) + ")")
        .call(d3v5.axisBottom(xScale)
            .tickFormat(d3v5.format("d"))
        );
    // Element for x.
    svg.append("g")
        .attr("class", "x-axis")
        .append("text")
        .attr("x", width)
        .attr("y", - 8)
        .style("text-anchor", "end")
        .style("fill", "black")
        .text("year");
    // Set x axis.
    svg.selectAll(".x-axis").call(xAxis);


    // Scale for y.
    var yScale = d3v5.scaleLinear().range([height, 0]);
    // Function for y.
    var yAxis = g => g
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(d3v5.axisLeft(yScale));
    // Element for y.
    svg.append("g")
        .attr("class", "y-axis")
        .append("text")

        .attr("x", - height * .8 )
        .attr("y", 16)
        .style("text-anchor", "start")

        .attr("transform", "rotate(-90)")
        .style("fill", "black")
        .text("life expectancy (years)");


    // Define the line for the graph.
    var valueLine = d3v5.line()
        .x(function(d) { return xScale(d.Year); })
        .y(function(d) { return yScale(d.Value); });


    var title = svg.append("text")
        .attr("x", w / 2)
        .attr("y",  16)
        .attr("class", "lineTitle")
        .style("text-anchor", "middle")
        .style("fill", "black");



    // Draw the legend with help from https://stackoverflow.com/questions/38954316/adding-legends-to-d3-js-line-charts.
    var legendBoxSize = 10;
    var legendBoxDistance = 16;

    var legend_keys = ["Females", "Total", "Males"]

    var lineLegend = svg.selectAll(".lineLegend").data(legend_keys)
        .enter().append("g")
        .attr("class", "lineLegend")
        .attr("transform", "translate(" + (margin.left + width * .8) + "," + (height * .8) + ")");

    lineLegend.append("text").text(d => d)
        .attr("class", "legendText")
        .attr("x", legendBoxDistance)
        .attr("y", function(d, i) {
            return i * legendBoxDistance;
        });

    lineLegend.append("rect")
        .attr("class", d => d + "Legend")
        .attr("width", legendBoxSize).attr("height", legendBoxSize)
        .attr("y", function(d, i) {
            return i * legendBoxDistance - (legendBoxSize);
        });




    function update(countryName, speed) {

        let t = d3v5.transition().duration(speed);


        countryDataTotal = dataHere.filter(d => d.COU == countryName && d.Variable == "Total population at birth");
        countryDataFemales = dataHere.filter(d => d.COU == countryName && d.Variable == "Females at birth");
        countryDataMales = dataHere.filter(d => d.COU == countryName && d.Variable == "Males at birth");


        var ageMax = d3v5.max(countryDataTotal, d => d.Value);

        let scaleFactor = 1.1;
        yScale.domain([0, ageMax * scaleFactor]);


        // Lines.

        var lineTotal = svg.selectAll(".lineTotal").data([countryDataTotal]);
        lineTotal.exit().remove();
        lineTotal.enter().append("path")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("class", "lineTotal")
            .merge(lineTotal)
            .transition(t)
            .attr("d", valueLine);

        var lineFemales = svg.selectAll(".lineFemales").data([countryDataFemales]);
        lineFemales.exit().remove();
        lineFemales.enter().append("path")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("class", "lineFemales")
            .merge(lineFemales)
            .transition(t)
            .attr("d", valueLine);

        var lineMales = svg.selectAll(".lineMales").data([countryDataMales]);
        lineMales.exit().remove();
        lineMales.enter().append("path")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("class", "lineMales")
            .merge(lineMales)
            .transition(t)
            .attr("d", valueLine);


        svg.selectAll(".y-axis").transition(t).call(yAxis);

        // Title.
        if (countryDataTotal.length > 0) {
            title.transition(t).text("Life expectancy in " + countryDataTotal[0].Country );
        } else {
            title.transition(t).text();
        }


        // Dots.

        var dotTotal = svg.selectAll(".dotTotal").data(countryDataTotal);
        dotTotal.exit().remove();
        dotTotal.enter().append("circle") // Uses the enter().append() method
            .attr("class", "dotTotal") // Assign a class for styling
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .merge(dotTotal)
            .transition(t)
            .attr("cx", function(d) { return xScale(d.Year) })
            .attr("cy", function(d) { return yScale(d.Value) })
            .attr("r", 2);

        var dotFemales = svg.selectAll(".dotFemales").data(countryDataFemales);
        dotFemales.exit().remove();
        dotFemales.enter().append("circle") // Uses the enter().append() method
            .attr("class", "dotFemales") // Assign a class for styling
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .merge(dotFemales)
            .transition(t)
            .attr("cx", function(d) { return xScale(d.Year) })
            .attr("cy", function(d) { return yScale(d.Value) })
            .attr("r", 2);

        var dotMales = svg.selectAll(".dotMales").data(countryDataMales);
        dotMales.exit().remove();
        dotMales.enter().append("circle") // Uses the enter().append() method
            .attr("class", "dotMales") // Assign a class for styling
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .merge(dotMales)
            .transition(t)
            .attr("cx", function(d) { return xScale(d.Year) })
            .attr("cy", function(d) { return yScale(d.Value) })
            .attr("r", 2);




        tooltipBox = svg.append('rect')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr('width', width)
            .attr('height', height)
            .attr('opacity', 0)
            .on('mousemove', drawTooltip)
            .on('mouseout', removeTooltip);


        function removeTooltip() {

            if (tooltip) tooltip.style('display', 'none');
            if (tooltipLine) tooltipLine.attr('stroke', 'none');
        }

        function drawTooltip() {

            const year = Math.round(xScale.invert(d3v5.mouse(tooltipBox.node())[0])) ;

            dataYearTotal = countryDataTotal.filter(d => d.Year == year)[0];
            dataYearFemales = countryDataFemales.filter(d => d.Year == year)[0];
            dataYearMales = countryDataMales.filter(d => d.Year == year)[0];



            if (dataYearTotal == undefined) {
                dataYearTotal = {Value: "no data"};
            };
            if (dataYearFemales == undefined) {
                dataYearFemales = {Value: "no data"};
            };
            if (dataYearMales == undefined) {
                dataYearMales = {Value: "no data"};
            };


            tooltipLine.attr('stroke', 'black')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr('x1', xScale(year))
                .attr('x2', xScale(year))
                .attr('y1', 0)
                .attr('y2', height);


            tooltip
                .html("<b>" + year + "</b>" + "<br>"
                + "Total: " + dataYearTotal.Value + '<br>'
                + "Female: " + dataYearFemales.Value + '<br>'
                + "Male: " + dataYearMales.Value)
                .style('display', 'block')
                .style('left', d3v5.event.pageX + 20 + "px")
                .style('top', d3v5.event.pageY - 20 + "px")
        }





    }

}






function drawMap(dataset, year) {
    // The year determines what year the map shows initially.

    drawMap.update = update;
    // help from http://jsbin.com/kuvojohapi/1/edit?html,output

    d3v5.select("#mapContainer").style("width", w + "px").style("height", h +"px").style("position", "relative");


    var dataHere = dataset;

    var defaultFillColor = '#B8B8B8';
    var colorScale = d3v5.scaleLinear()
        .range(['#f03b20','#ffeda0'])


    var colorMap = {};
    dataHere.forEach(function(item) {
        var iso = item.COU;
        var value = item.Value;
        colorMap[iso] = { numberOfThings: value, fillColor: defaultFillColor }
    });


    var map = new Datamap({
    element: document.getElementById("mapContainer"),
    done: function(datamap) {
                datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography, data) {
                    drawLineGraph.update(geography.id, 500);
                });
            },
    geographyConfig: {
        highlightFillColor: function(data) {
            if (data && data.fillColor != null) {
                return data.fillColor;
            } else {
                return defaultFillColor;
            };
        },
        borderColor: "909090",
        highlightBorderColor: "#303030",
        popupTemplate: function(geo, data) {
            if (!data || !data.numberOfThings ){

                return ['<div class="hoverinfo"><strong>',
                        geo.properties.name,
                        ': ' + "no data",
                        '</strong></div>'].join('');
            } else {

                return ['<div class="hoverinfo"><strong>',
                        geo.properties.name,
                        ': ' + data.numberOfThings,
                        '</strong></div>'].join('');
            }
        }
    },
    data: colorMap,


    fills: { defaultFill: defaultFillColor },
    });



    var dataToLegendScale = d3v5.scaleLinear()
        .range([legendHeight, 0]);


    var legendScale = d3v5.scaleLinear()
        .range(['#f03b20','#ffeda0'])
        .domain([0, legendHeight]);


    var legendAxis = g => g
        .attr("transform", "translate(" + ( margin.left + legendWidth ) +"," + (h - margin.bottom - legendHeight) + ")")
        .call(d3v5.axisRight(dataToLegendScale));


    svg = d3v5.select(".datamap");

    // Reserve an element for the colorLegend's axis
    svg.append("g")
        .attr("class", "colorAxis");

    svg.selectAll(".colorAxis")
        .append("text")
        .attr("x", - legendWidth)
        .attr("y", - 8)
        .style("text-anchor", "start")
        .style("fill", "black")
        .text("total life expectancy (years)");

    // Title.
    svg.append("text")
        .attr("x", w / 2)
        .attr("y",  16)
        .attr("class", "mapTitle")
        .style("text-anchor", "middle")
        .style("fill", "black")
        .text("Life expectancy across the world");



    var pallete = svg.append('g')
        .attr('id', 'pallete');


    var legendData = []
    for (i = 0; i <= 1; i = i + 0.05){
        legendData.push(i * legendHeight);
    }

    var colorBar = pallete.selectAll('rect').data(legendData);
    colorBar.enter().append('rect')
        .attr('fill', function(d) {
            return legendScale(d);
        })
        .attr('x', margin.left )
        .attr('y', function(d, i) {
            return h - margin.bottom - (i + 1) * (legendHeight / legendData.length);
        })
        .attr('width', legendWidth )
        .attr('height', legendHeight / legendData.length);



    update(year, 0);


    function update(year, speed) {

        let t = d3v5.transition().duration(speed);

        let yearData = dataHere.filter( d => (d.Year == year) );

        var ageMax = d3v5.max(yearData, d => d.Value);
        var ageMin = d3v5.min(yearData, d => d.Value);


        colorScale.domain([ageMin, ageMax]);

        // Set and update the axis of the legend.
        dataToLegendScale.domain([ageMin, ageMax]);
        svg.selectAll(".colorAxis").transition(t).call(legendAxis);


        // Set all country colors back to default.
        Object.values(colorMap).forEach(function(d) {
          d.numberOfThings = null;
          d.fillColor = defaultFillColor;
        });


        // Update the colors of countries with data.
        yearData.forEach(function(item) {
            var iso = item.COU;
            var value = item.Value;
            colorMap[iso] = { numberOfThings: value, fillColor: colorScale(value) }
        });


        map.updateChoropleth(colorMap);


        };


}
