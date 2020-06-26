// in the slider the input box shoud be authoritative
// ensure a valid value in input box when focus leaves?

var SlidenPlotApp = (function (controls) {
  var getters_ = {},
      user_callback = undefined,
      expFormat = d3.format(".3e");

  var get_values = function () {
    var ret = {};
    for (var key in getters_) {
      if (!getters_.hasOwnProperty(key)) continue;
      ret[key] = getters_[key].call();
    }
    return ret;
  };

  var internal_callback = function() {
    user_callback(get_values());
  };

  var add_float_slider = function(target, short_name, name,
                                  start, min_, max_) {
    var min = min_,
        max = max_;
    if (!(start >= min)) throw "Start must be greater than or equal to min.";
    if (!(start <= max)) throw "Start must be less than or equal to max.";
    if (!(min < max)) throw  "min must be less than max.";
    d3.select(target)
      .append('div').text(name);
    var input_box = d3.select(target)
        .append("input")
        .attr("name", short_name);
    input_box.attr("type", "number")
      .property('value', d3.format(".6e")(start))
      .property("min", min)
      .property("max", max)
      .property("step", (max - min)/100.0)
      .attr("size", 60)
      .attr("data-currentvalue", start);

    var formatter = (max < 1e3) ? d3.format("") : d3.format(".1e");
    var slider = d3
        .sliderHorizontal()
        .min(min)
        .max(max)
        .step((max-min)/200.0)
        .default(start)
        .width(300)
        .ticks(5).tickFormat(formatter)
        .displayValue(false)
        .on('onchange.a', function (value)
            { internal_callback(); })
        .on('drag', function (value)
            { input_box.property("value", d3.format(".6e")(value)); })
        .on('end', function (value)
            { input_box.property("value", d3.format(".6e")(value)); });
    getters_[short_name] = (function () { return slider.value(); });

    d3.select(target).append("br");
    d3.select(target)
      .append('svg')
      .attr('width', 500)
      .attr('height', 60)
      .append('g')
      .attr('transform', 'translate(30,20)')
      .call(slider);

    // link input box change to slider
    input_box.on("click", function () {
      var newValue = parseFloat(input_box.property('value'));
      if (newValue) {
        if (newValue <= max && newValue >= min) {
          slider.value(newValue);
          internal_callback() // slider.value() is bugged and does not invoke onchange listener
        }
      }
    });

    input_box.on("keyup",function (e, b) {
      var codes = [48,49,50,51,52,53,54,55,56,57,0,8,
                   46,16,38,40,187,189,190];
      // 187 is +, 189 is -, 190 is . 107,109 are numpad +,-
      // 108 is numpad .
      // 96-105 are the keypad digits
      // 48-57 is [0-9] 69: e 16:E 8: backspace 46:delete
      // right: 39 left: 37 up: 38 down: 40
      // see: https://keycode.info/
      if (codes.includes(d3.event.keyCode) ||
          (d3.event.keyCode >=96 && d3.event.keyCode <=105)) {
        var newValue = parseFloat(input_box.property('value'));
        if (newValue) {
          if (newValue <= max && newValue >= min) {
            slider.value(newValue);
            internal_callback() // slider.value() is bugged and does not invoke onchange listener
          }
        }
      }
    });
  };

  var add_radio_buttons = function(target, short_name, name, options,
                                   checked) {
    d3.select(target)
      .append('div').text(name);
    for (var i=0; i<options.length; i++) {
      d3.select(target).append("div").text(options[i]);
      var tmp =  d3.select(target).append("input")
          .attr("type", "radio")
          .attr("name", short_name)
          .attr("value", options[i])
          .on("change", function () { internal_callback(); });
      if (options[i]===checked) { tmp.attr("checked",""); }
    }
    getters_[short_name] = function () {
      return document.querySelector('input[name="'+short_name+'"]:checked').value;
    };
  };

  var add_check_box = function(target, short_name, name, checked) {
    d3.select(target)
      .append('div').text(name);
    var input =  d3.select(target).append("input");
    input.attr("type", "checkbox")
      .attr("name", short_name)
      .attr("value", short_name)
      .on("change", internal_callback);
    if (checked) { input.attr("checked",""); }
    getters_[short_name] = function () { return !!input.property("checked"); };
  };

  var add_callback = function (callback) {
    user_callback = callback;
    internal_callback();
  };

  return {
    add_float_slider: add_float_slider,
    add_radio_buttons: add_radio_buttons,
    add_check_box: add_check_box,
    add_callback: add_callback,
    get_values: get_values
  };
});

function plot_xy(destination, datasets, options) {
  document.querySelectorAll(destination)[0].innerHTML ="";

  var options = options || {};
  var colors = options.colors || d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10));
  var color_index = options.color_index || 0;
  var x_label = options.x_label || "";
  var y_label = options.y_label || "";
  var y2_label = options.y2_label || "";
  var title = options.title || "";

  var margin = "margin" in options ? options.margin : {top: 30, right: 80, bottom: 40, left: 80},
      width = ("width" in options ? options.width : 400) - margin.left - margin.right,
      height = ("height" in options ? options.height : 200) - margin.top - margin.bottom;

  var margin = "margin" in options ? options.margin : {top: 30, right: 80, bottom: 40, left: 80},
      width = ("width" in options ? options.width : 400) - margin.left - margin.right,
      height = ("height" in options ? options.height : 200) - margin.top - margin.bottom;

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
     x = d3.scaleLinear()
           .domain([xmin_use, xmax_use])
           .range([0, width]);
  } else {
    x = d3.scaleLog()
          .domain([xmin_use, xmax_use])
          .range([0, width]);
  }

  // If using a log-y scale, domain must be strictly positive or strictly negative (0 excluded)
  // If domain does not fulfill these requirements, use a linear scale instead
  if (!options.logy || !(Math.sign(ymin_use) === Math.sign(ymax_use) && ymin_use !== 0 && ymax_use !== 0)) {
    y = d3.scaleLinear()
          .domain([ymin_use, ymax_use])
          .range([height, 0]);
    y2 = d3.scaleLinear()
           .range([height, 0]);
  } else {
    y = d3.scaleLog()
          .domain([ymin_use, ymax_use])
          .range([height, 0]);
    y2 = d3.scaleLog()
           .range([height, 0]);
  }

  if ("right_y_scale" in options) {
    y2.domain([ymin_use*options.right_y_scale,
               ymax_use*options.right_y_scale]);
  }

  var tick_format = d3.format('.1e');

  // tick format for logarithmic axes
  var log_format = function (d) {
    if (Number.isInteger(Math.log10(d))) {
      return tick_format(d)
    } else {
      return ''
    }
  }

  var tick_format_x = options.logx ? log_format: tick_format;
  var tick_format_y = options.logy ? log_format: tick_format;

  var xAxis = d3.axisBottom().scale(x)
      .ticks(5)
      .tickFormat(tick_format_x)
      .tickPadding(6);
  var yAxis = d3.axisLeft().scale(y)
      .ticks(5)
      .tickFormat(tick_format_y)
      .tickPadding(6)

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
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("style", "overflow:hidden;")
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  chart1.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate("+ (width/2)+","+(height+margin.bottom/1.5)+")")
    .attr("style", "font-size:" + ("label_size" in options ? options.label_size : 15) + "px;")
    .text(x_label);

  chart1.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate("+ (width/2)+","+(-margin.top/2.5)+")")
    .attr("style", "font-size:" + ("title_size" in options ? options.title_size : 15) + "px; font-weight:bold")
    .text(title);

  chart1.append("text")
    .attr("text-anchor", "middle")
    .attr("transform",
          "translate("+(-margin.left/1.2)+","+(height/2.0)+")rotate(-90)")
    .attr("style", "font-size:" + ("label_size" in options ? options.label_size : 15) + "px;")
    .text(y_label);

  chart1.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate("+(width + margin.right/1.3)+","+(height/2)+")rotate(-90)")
    .attr("style", "font-size:" + ("label_size" in options ? options.label_size : 15) + "px;")
    .text(y2_label);

  datasets.forEach(function (d, i) {
    let xarray = d[0];
    let yarray = d[1];
    chart1.append("path")
      .attr("class", "line")
      .attr("stroke", colors((i+color_index)%10))
      .attr("d", valueline(xarray, yarray, x, y));
  });

  var color_offset = datasets.length + color_index;

  if ("right_data" in options) {
    var y2min = d3.min(options.right_data.map(function (d){return d3.min(d[1]);}));
    var y2max = d3.max(options.right_data.map(function (d){return d3.max(d[1]);}));
    var y2min_use =  "y2min" in options ? options.y2min : y2min;
    var y2max_use =  "y2max" in options ? options.y2max : y2max;
    y2.domain([y2min_use, y2max_use]);

    options.right_data.forEach(function (d, i) {
      let xarray = d[0];
      let yarray = d[1];
      chart1.append("path")
        .attr("class", "line")
        .attr("stroke", colors((i+color_offset)%10))
        .attr("d", valueline(xarray, yarray, x, y2));
    });
  }

  if ("axhlines" in options) {
    options.axhlines.forEach(function (d,i) {
      chart1.append("path")
        .attr("class", "horizontal_line")
        .attr("stroke", colors((i+color_index)%10))
        .attr("d", valueline(x.domain(), [d,d], x,y));
    });
  }

  if ("ax2hlines" in options) {
    options.ax2hlines.forEach(function (d,i) {
      var ax2hline_color = options.ax2hline_color || (i+color_index);
      chart1.append("path")
        .attr("class", "horizontal_line")
        .attr("stroke", colors((ax2hline_color)%10))
        .attr("d", valueline(x.domain(), [d,d], x,y2));
    });
  }
  if ("axvlines" in options) {
    options.axvlines.forEach(function (d,i) {
      chart1.append("path")
        .attr("class", "vertical_line")
        .attr("stroke", colors((i+color_index)%10))
        .attr("d", valueline([d,d], y.domain(),x,y));
    });
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
    })
  } else if (options.grid) {
    chart1.selectAll("g.y.axis g.tick line")
      .attr("x2", width)
      .attr("stroke", "#808080")
  } else if (options.logy) {
    chart1.selectAll("g.y.axis g.tick line")
      .attr("x2", function (x) {
        if (Number.isInteger(Math.log10(x))) return -10;
        else return -4;
      })
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
    })
  } else if (options.grid) {
    chart1.selectAll("g.x.axis g.tick line")
      .attr("y2", -height)
      .attr("stroke", "#808080")
  } else if (options.logx) {
    chart1.selectAll("g.x.axis g.tick line")
      .attr("y2", function (x) {
        if (Number.isInteger(Math.log10(x))) return 10;
        else return 4;
      })
  }

  if ("right_y_scale" in options || "right_data" in options) {
    chart1.append("g")
      .attr("class", "y axis right")
      .attr("transform", "translate(" + width + " ,0)")
      .call(yAxis_right);
  }

  chart1.selectAll(".tick text")
    .attr("font-size", ("axes_size" in options ? options.axes_size : 10));

  if ("circles" in options) {
    let color = "circle_color" in options ? options.circle_color : colors((color_index));
    options.circles.forEach(function (d,i) {
      chart1.append("circle")
          .attr("cx", x(d[0]))
          .attr("cy", y(d[1]))
          .attr("r", 10)
          .attr("fill", color);
    });
  }

  if ("legend" in options) {
    options.legend.forEach(function (d,i) {
      d3.select(destination)
        .append("svg")
        .attr("width", 30)
        .attr("height", 10)
        .append("circle")
        .attr("cx",22)
        .attr("cy",5)
        .attr("r",5)
        .attr("fill",colors((i+color_index)%10));
      d3.select(destination)
        .append("text")
        .text(d);
    });
  }

}
