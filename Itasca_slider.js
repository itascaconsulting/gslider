// in the slider the input box shoud be authoritative
// ensure a valid value in input box when focus leaves?

var Itasca_slider_app = (function (controls) {
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
    console.assert(start >= min);
    console.assert(start <= max);
    console.assert(min < max);
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
        }
      }
    });

    input_box.on("keyup",function (e, b) {
      var codes = [48,49,50,51,52,53,54,55,56,57,0,8,
                   46,16,38,40];
      // 96-105 are the keypad digits
      // 48-57 is [0-9] 69: e 16:E 8: backspace 46:delete
      // right: 39 left: 37 up: 38 down: 40
      if (codes.includes(d3.event.keyCode) ||
          (d3.event.keyCode >=96 && d3.event.keyCode <=105)) {
        var newValue = parseFloat(input_box.property('value'));
        if (newValue) {
          if (newValue <= max && newValue >= min) {
            slider.value(newValue);
          }
        }
      };
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
      .attr("value", short_name);
    if (checked) { input.attr("checked",""); }
    // how do we check if the checkbox is checked.
    getters_[short_name] = function () { return input.attr("checked") ? true : false; };
  };

  var add_callback = function (callback) {
    user_callback = callback;
  };

  return {
    add_float_slider: add_float_slider,
    add_radio_buttons: add_radio_buttons,
    add_check_box: add_check_box,
    add_callback: add_callback
  };
});

function plot_xy(destination, datasets, options) {
  document.querySelectorAll(destination)[0].innerHTML ="";

  var options = options || {};
  var colors = options.colors || d3.scale.category10().domain(d3.range(10));
  var color_index = options.color_index || 0;
  var x_label = options.x_label || "";
  var y_label = options.y_label || "";
  var y2_label = options.y2_label || "";
  var title = options.title || "";

  var margin = {top: 30, right: 80, bottom: 40, left: 80},
      width = 400 - margin.left - margin.right,
      height = 220 - margin.top - margin.bottom;
  var     x = d3.scale.linear().range([0, width]);
  var     y = d3.scale.linear().range([height, 0]);
  var     y2 = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis().scale(x)
      .orient("bottom")
      .innerTickSize(-height)
      .ticks(5);
  var yAxis = d3.svg.axis().scale(y)
      .orient("left")
      .innerTickSize(-width)
      .ticks(5)
      .tickFormat(d3.format(".1e"));

  var yAxis_right = undefined;
  if (("right_y_scale" in options) || ("right_data" in options)) {
    yAxis_right =  d3.svg.axis().scale(y2)
      .orient("right")
      .ticks(5)
      .tickFormat(d3.format(".1e"));
  }

  var valueline = function(xa, ya, xscale, yscale){
    return d3.svg.line()
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
    .text(x_label);

  chart1.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate("+ (width/2)+","+(-margin.top/2.5)+")")
    .attr("style", "font-size:15px; font-weight:bold")
    .text(title);

  chart1.append("text")
    .attr("text-anchor", "middle")
    .attr("transform",
          "translate("+(-margin.left/1.5)+","+(height/2.0)+")rotate(-90)")
    .text(y_label);

  chart1.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate("+(width + margin.right/1.3)+","+(height/2)+")rotate(-90)")
    .text(y2_label);

  var xmin = d3.min(datasets.map(function (d) { return d3.min(d[0]);}));
  var xmax = d3.max(datasets.map(function (d) { return d3.max(d[0]);}));
  var ymin = d3.min(datasets.map(function (d) { return d3.min(d[1]);}));
  var ymax = d3.max(datasets.map(function (d) { return d3.max(d[1]);}));

  var xmin_use = "xmin" in options ? options.xmin : xmin;
  var xmax_use = "xmax" in options ? options.xmax : xmax;
  x.domain([xmin_use,xmax_use]);
  var ymin_use =  "ymin" in options ? options.ymin : ymin;
  var ymax_use =  "ymax" in options ? options.ymax : ymax;
  y.domain([ymin_use,ymax_use]);
  if ("right_y_scale" in options) {
    y2.domain([ymin_use*options.right_y_scale,
               ymax_use*options.right_y_scale]);
  }

  datasets.forEach(function (d, i) {
    xarray = d[0];
    yarray = d[1];
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
    y2.domain([y2min_use,y2max_use]);

    options.right_data.forEach(function (d, i) {
      xarray = d[0];
      yarray = d[1];
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
    var ax2hline_color = options.ax2hline_color || i+color_index;
        options.ax2hlines.forEach(function (d,i) {
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

  if ("right_y_scale" in options || "right_data" in options) {
    chart1.append("g")
      .attr("class", "y axis right")
      .attr("transform", "translate(" + width + " ,0)")
      .call(yAxis_right);
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
