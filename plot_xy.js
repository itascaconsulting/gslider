function plot_xy(destination, datasets, options) {

  document.querySelectorAll(destination)[0].innerHTML ="";

  var options = options || {};
  var colors = 'colors' in options ? d3.scaleOrdinal().range(options.colors)
                                       .domain(d3.range(options.colors.length)) :
                                     d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10));
  var color_index = options.color_index || 0;
  var x_label = options.x_label || "",
      y_label = options.y_label || "",
      y2_label = options.y2_label || "",
      title = options.title || "";

  var padding = "padding" in options ? options.padding : {top: 30, right: 80, bottom: 60, left: 80},
      width = ("width" in options ? options.width : 400) - padding.left - padding.right,
      height = ("height" in options ? options.height : 200) - padding.top - padding.bottom;

  var label_size = "label_size" in options ? options.label_size : 15,
      axes_size = "axes_size" in options ? options.axes_size : 10,
      label_offset = "label_offset" in options ? options.label_offset : 20 + axes_size + label_size;

  // Function support for different browsers
  Math.log10 = Math.log10 || function(x) {
    return Math.log(x) * Math.LOG10E;
  };
  Number.isInteger = Number.isInteger || function(x) {
    return typeof x === "number" && isFinite(x) && Math.floor(x) === x;
  };
  Math.sign = Math.sign || function (x) {
    return x > 0 ? 1 : x < 0 ? -1 : x;
  };

  var xmin = d3.min(datasets.map(function (d) { return d3.min(d[0]);}));
  var xmax = d3.max(datasets.map(function (d) { return d3.max(d[0]);}));
  var ymin = d3.min(datasets.map(function (d) { return d3.min(d[1]);}));
  var ymax = d3.max(datasets.map(function (d) { return d3.max(d[1]);}));

  var xmin_use = "xmin" in options ? options.xmin : xmin;
  var xmax_use = "xmax" in options ? options.xmax : xmax;

  var ymin_use =  "ymin" in options ? options.ymin : ymin;
  var ymax_use =  "ymax" in options ? options.ymax : ymax;

  // Create scales
  var x, y, y2;

  // If using a log-x scale, domain must be strictly positive or strictly negative (0 excluded)
  // If domain does not fulfill these requirements, use a linear scale instead
  if (!options.logx || !(Math.sign(xmin_use) === Math.sign(xmax_use) && xmin_use !== 0 && xmax_use !== 0)) {
     x = d3.scaleLinear();
  } else {
    x = d3.scaleLog();
  }

  // If using a log-y scale, domain must be strictly positive or strictly negative (0 excluded)
  // If domain does not fulfill these requirements, use a linear scale instead
  if (!options.logy || !(Math.sign(ymin_use) === Math.sign(ymax_use) && ymin_use !== 0 && ymax_use !== 0)) {
    y = d3.scaleLinear();
    y2 = d3.scaleLinear();
  } else {
    y = d3.scaleLog();
    y2 = d3.scaleLog();
  }

  x.domain([xmin_use, xmax_use])
   .range([0, width])
   .clamp(false);
  y.domain([ymin_use, ymax_use])
   .range([height, 0])
   .clamp(false);
  y2.range([height, 0])
   .clamp(false);

  if ("right_y_scale" in options) {
    y2.domain([ymin_use*options.right_y_scale,
               ymax_use*options.right_y_scale]);
  }

  var tick_format = d3.format('.1e');

  // tick format for logarithmic axes
  var log_format = function (d) {
    if (Number.isInteger(Math.log10(d))) {
      return tick_format(d);
    } else {
      return '';
    }
  };

  var tick_format_x = options.logx ? log_format: tick_format;
  var tick_format_y = options.logy ? log_format: tick_format;

  var xAxis = d3.axisBottom().scale(x)
      .ticks(5)
      .tickFormat(tick_format_x)
      .tickPadding(6);
  var yAxis = d3.axisLeft().scale(y)
      .ticks(5)
      .tickFormat(tick_format_y)
      .tickPadding(6);

  var yAxis_right = undefined;
  if (("right_y_scale" in options) || ("right_data" in options)) {
    yAxis_right =  d3.axisRight().scale(y2)
      .ticks(5)
      .tickFormat(tick_format_y)
      .tickPadding(6);
  }

  var valueline = function(xa, ya, xscale, yscale){
    return d3.line()
      .x(function(d,i) { return xscale(xa[i]); })
      .y(function(d,i) { return yscale(ya[i]); })
    (Array(xa.length));
  };

  var chart1 = d3.select(destination)
      .append("svg")
      .attr("width", width + padding.left + padding.right)
      .attr("height", height + padding.top + padding.bottom)
      .attr("style", "overflow:hidden;")
      .append("g")
      .attr("transform", "translate(" + padding.left + "," + padding.top + ")");
  // example of getting mouse input from a D3 plot
  // d3.select("svg").on("click", function() {
  //   var coords = d3.mouse(this);
  //         var newData= {
  //           x: Math.round( x.invert(coords[0])),  // Takes the pixel number to convert to number
  //           y: Math.round( y.invert(coords[1]))
  //         };
  //   console.log(newData);
  // });
  chart1.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate("+ (width/2)+","+(height+label_offset)+")")
    .attr("style", "font-size:" + label_size + "px;")
    .text(x_label);

  chart1.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate("+ (width/2)+","+(-padding.top/2.5)+")")
    .attr("style", "font-size:" + ("title_size" in options ? options.title_size : 15) + "px; font-weight:bold")
    .text(title);

  chart1.append("text")
    .attr("text-anchor", "middle")
    .attr("transform",
          "translate("+(-padding.left/1.3)+","+(height/2.0)+")rotate(-90)")
    .attr("style", "font-size:" + ("label_size" in options ? options.label_size : 15) + "px;")
    .text(y_label);

  chart1.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate("+(width + padding.right/1.3)+","+(height/2)+")rotate(-90)")
    .attr("style", "font-size:" + ("label_size" in options ? options.label_size : 15) + "px;")
    .text(y2_label);


  datasets.forEach(function (d, i) {
    let xarray = d[0];
    let yarray = d[1];
    let path = chart1.append("path")
      .attr("class", "line")
      .attr("stroke", colors((i+color_index)%("colors" in options ? options.colors.length : 10)))
      .attr("stroke-width", 'line_width' in options ? options.line_width + 'px' : '2px')
      .attr("fill", 'none')
      .attr("d", valueline(xarray, yarray, x, y));
    if ("opacity" in options) {
      path.attr("opacity", options.opacity[i]);
    }
  });

  var color_offset = datasets.length + color_index;

  if ("right_data" in options) {
    var y2min = d3.min(options.right_data.map(function (d){return d3.min(d[1]);}));
    var y2max = d3.max(options.right_data.map(function (d){return d3.max(d[1]);}));
    var y2min_use =  "y2min" in options ? options.y2min : y2min;
    var y2max_use =  "y2max" in options ? options.y2max : y2max;
    y2.domain([y2min_use, y2max_use]);

    options.right_data.forEach(function (d, i) {
      let xarray = d[0],
          yarray = d[1];
      chart1.append("path")
        .attr("class", "line")
        .attr("stroke", colors((i+color_offset)%10))
        .attr("stroke-width", 'line_width' in options ? options.line_width + 'px' : '2px')
        .attr("fill", 'none')
        .attr("d", valueline(xarray, yarray, x, y2));
    });

  }

  if ("axhlines" in options) {
    options.axhlines.forEach(function (d,i) {
      var lcolor = colors((i+color_index)%10);
      if ("axhlines_color" in options) {
        lcolor = options.axhlines_color[(i+color_index)%options.axhlines_color.length];
      }
      chart1.append("path")
        .attr("class", "horizontal_line")
        .attr("stroke", lcolor)
        .attr("stroke-width", 'line_width' in options ? options.line_width + 'px' : '2px')
        .attr("d", valueline(x.domain(), [d,d], x,y));
    });
  }

  if ("ax2hlines" in options) {
    options.ax2hlines.forEach(function (d,i) {
      var ax2hline_color = options.ax2hline_color || (i+color_index);
      chart1.append("path")
        .attr("class", "horizontal_line")
        .attr("stroke", colors((ax2hline_color)%10))
        .attr("stroke-width", 'line_width' in options ? options.line_width + 'px' : '2px')
        .attr("d", valueline(x.domain(), [d,d], x,y2));
    });
  }
  if ("axvlines" in options) {
    options.axvlines.forEach(function (d,i) {
      var lcolor = colors((i+color_index)%10);
      if ("axvlines_color" in options) {
        lcolor = options.axvlines_color[(i+color_index)%options.axhlines_color.length];
      }

      chart1.append("path")
        .attr("class", "vertical_line")
        .attr("stroke", lcolor)
        .attr("stroke-width", 'line_width' in options ? options.line_width + 'px' : '2px')
        .attr("d", valueline([d,d], y.domain(),x,y));
    });
  }

  if ("graph_text" in options) {
    let location = "graph_text_location" in options ? options.graph_text_location : [width/4, height/4];
    chart1.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate("+location[0]+","+location[1]+")")
    .attr("style", "font-size:" + ("graph_text_size" in options ? options.graph_text_size : 15) + "px;" +
                   "font-weight: bold")
    .text(options.graph_text);
  }

  chart1.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  chart1.append("g")
    .attr("class", "y axis")
    .call(yAxis);

  if (options.logy && options.grid) {
    chart1.selectAll("g.y.axis g.tick line")
      .attr("x2", width)
      .attr("stroke", "#808080")
      .attr("opacity", function (x) {
        if (Number.isInteger(Math.log10(x))) return 1;
        else return .8;
      })
      .attr("stroke-dasharray", function (x) {
        if (Number.isInteger(Math.log10(x))) return 0;
        else return 2;
      });
  } else if (options.grid) {
    chart1.selectAll("g.y.axis g.tick line")
      .attr("x2", width)
      .attr("stroke", "#808080");
  } else if (options.logy) {
    chart1.selectAll("g.y.axis g.tick line")
      .attr("x2", function (x) {
        if (Number.isInteger(Math.log10(x))) return -10;
        else return -4;
      });
  }

  if (options.logx && options.grid) {
    chart1.selectAll("g.x.axis g.tick line")
      .attr("y2", -height)
      .attr("stroke", "#808080")
      .attr("opacity", function (x) {
        if (Number.isInteger(Math.log10(x))) return 1;
        else return .8;
      })
      .attr("stroke-dasharray", function (x) {
        if (Number.isInteger(Math.log10(x))) return 0;
        else return 2;
      });
  } else if (options.grid) {
    chart1.selectAll("g.x.axis g.tick line")
      .attr("y2", -height)
      .attr("stroke", "#808080");
  } else if (options.logx) {
    chart1.selectAll("g.x.axis g.tick line")
      .attr("y2", function (x) {
        if (Number.isInteger(Math.log10(x))) return 10;
        else return 4;
      });
  }

  if ("right_y_scale" in options || "right_data" in options) {
    chart1.append("g")
      .attr("class", "y axis right")
      .attr("transform", "translate(" + width + " ,0)")
      .call(yAxis_right);
  }

  chart1.selectAll(".tick text")
    .attr("font-size", axes_size);


  if ("show_datapoints" in options) {
    // Turn into array if not an array
    if (!(Array.isArray(options.show_datapoints))) {
      options.show_datapoints = [options.show_datapoints];
    }
    // Initialize defaults
    let color = options.datapoint_color || colors(color_index);
    let radius = options.datapoint_radius || 5;
    // Iterate through datasets
    for (let i = 0; i < options.show_datapoints.length; i++) {
      if (options.show_datapoints[i]) {
        let d = datasets[i];
        for (let i = 0; i < d[0].length; i++) {
          chart1.append("circle")
                .attr("cx", x(d[0][i]))
                .attr("cy", y(d[1][i]))
                .attr("r", radius)
                .attr("fill", color);
        }
      }
    }
  }

  if ("legend" in options || "circle_arrays_legend" in options) {
    var ltarget = destination;
    if ("legend_target" in options) {
      ltarget = options.legend_target;
      document.querySelectorAll(ltarget)[0].innerHTML ="";
    }
    d3.select(ltarget).append("br");
    options.legend.forEach(function (d,i) {
      d3.select(ltarget)
        .append("svg")
        .attr("width", 30)
        .attr("height", 10)
        .append("line")
        .attr("x1", 0)
        .attr("y1", 5)
        .attr("x2", 25)
        .attr("y2", 5)
        .attr("stroke-width", 3)
        .attr("stroke", colors((i+color_index)%10));

      d3.select(ltarget)
        .append("text")
        .attr("style", "font-size:" + ("label_size" in options ? options.label_size : 15) + "px;")
        .text(d);
      d3.select(ltarget).append("br");
    });

    if ("axhlines_legend" in options) {
      options.axhlines_legend.forEach(function(d,i) {
      d3.select(ltarget)
        .append("svg")
        .attr("width", 30)
        .attr("height", 10)
        .append("line")
        .attr("x1", 0)
        .attr("y1", 5)
        .attr("x2", 25)
        .attr("y2", 5)
        .attr("stroke-width", 3)
        .attr("stroke", options.axhlines_color);

      d3.select(ltarget)
        .append("text")
        .attr("style", "font-size:" + ("label_size" in options ? options.label_size : 15) + "px;")
        .text(d);
      d3.select(ltarget).append("br");
      });
    }

    if ("axvlines_legend" in options) {
      options.axvlines_legend.forEach(function(d,i) {
      d3.select(ltarget)
        .append("svg")
        .attr("width", 30)
        .attr("height", 10)
        .append("line")
        .attr("x1", 0)
        .attr("y1", 5)
        .attr("x2", 25)
        .attr("y2", 5)
        .attr("stroke-width", 3)
        .attr("stroke", options.axvlines_color[i%options.axvlines_color.length]);

      d3.select(ltarget)
        .append("text")
        .attr("style", "font-size:" + ("label_size" in options ? options.label_size : 15) + "px;")
        .text(d);
      d3.select(ltarget).append("br");
      });
    }

    if ("circle_arrays_legend" in options) {
      let radius = options.circle_arrays_radius || 5;
      let lcolors =  colors;
      if ("circle_arrays_colors" in options) {
        lcolors = d3.scaleOrdinal().range(options.circle_arrays_colors)
          .domain(d3.range(options.circle_arrays_colors.length));
      }
      options.circle_arrays_legend.forEach(function (d,i) {
        d3.select(ltarget)
          .append("svg")
          .attr("width", 30)
          .attr("height", 10)
          .append("circle")
          .attr("cx",22)
          .attr("cy",5)
          .attr("r",5)
          .attr("fill",lcolors(i));
        d3.select(ltarget)
          .append("text")
          .attr("style", "font-size:" + ("label_size" in options ? options.label_size : 15) + "px;")
          .text(d);
        d3.select(ltarget).append("br");
      });
    }


  }

  if ("circles" in options) {
    let color = "circle_color" in options ? options.circle_color : colors(color_index);
    options.circles.forEach(function (d,i) {
      chart1.append("circle")
        .attr("cx", x(d[0]))
        .attr("cy", y(d[1]))
        .attr("r", 10)
        .attr("fill", color);
    });
  }

  if ("circle_arrays" in options) {
    let radius = options.circle_arrays_radius || 5;
    let lcolors =  colors;
    if ("circle_arrays_colors" in options) {
      lcolors = d3.scaleOrdinal().range(options.circle_arrays_colors)
        .domain(d3.range(options.circle_arrays_colors.length));
    }

    for (let i = 0; i < options.circle_arrays.length; i++) {
      let d = options.circle_arrays[i];
      for (let j = 0; j < d.length; j++) {
        chart1.append("circle")
          .attr("cx", x(d[j][0]))
          .attr("cy", y(d[j][1]))
          .attr("r", radius)
          .attr("fill", lcolors(i));
      }
    }
  }

}
