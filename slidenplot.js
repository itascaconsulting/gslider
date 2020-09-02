var SlidenPlotApp = (function() {

  var getters_ = {},
      user_callback = undefined,
      set_inputs = {}, // dictionary mapping short_name to function(new_data) that sets new data
      internal_callback = function() { user_callback(get_values()); };

  var get_values = function() {
    /**
     * Returns the parameters of the app as a dictionary accessed by short name
     */
    var ret = {};
    for (var key in getters_) {
      if (!getters_.hasOwnProperty(key)) continue;
      ret[key] = getters_[key].call();
    }
    return ret;
  }

  var set_values = function(new_data, execute_callback) {
    /**
     * Sets the parameters of the app
     */
    execute_callback = execute_callback === undefined ? true : execute_callback;
    for (let key in new_data) {
      set_inputs[key](new_data[key])
    }
    if (execute_callback) {
      user_callback(get_values());
    }
  }

  var set_callback = function(callback) {
    /**
     * Sets the callback to the inputted function
     */
    user_callback = callback;
    internal_callback()
  }

  var add_float_slider = function(target, short_name, name, start, min_, max_, options) {
    var min = min_,
        max = max_;
    options = options || {};
    let slider_width = options.slider_width || 300,
        input_width = options.input_width || 100,
        fill = options.fill === undefined ? null : options.fill,
        font_size = options.font_size || 12,
        text_format = options.text_format || d3.format(".6e"),
        margin = options.margin || "5px";

    if (!(start >= min)) throw "Start must be greater than or equal to min.";
    if (!(start <= max)) throw "Start must be less than or equal to max.";
    if (!(min < max)) throw  "min must be less than max.";
    let slider_div = d3.select(target)
      .append("div")
      .attr("class", "slider_div")
      .attr("style", "width: " + (slider_width) + "px; margin: " + margin);
    let slider_div_header = slider_div.append("div");
    slider_div_header.append("div")
      .text(name)
      .attr("style", "float:left; font-size: " + font_size + "px;");

    // Add info text
    if ("info_text" in options) {
      let info_text_size = options.info_text_size || font_size;
      slider_div_header
        .append("div")
        .attr("id", "info_img_" + short_name)
        .text("?")
        .attr("style", "float:left; margin: 0 0 0 10px;font-size: " + (font_size - 1) + "px; position: relative;" +
                       "top: -" + (font_size / 36 * 5) + "px" + "; border: 1px solid blue;" +
                       "border-radius: " + (font_size + 2) + "px; width: " + (font_size + 2) + "px;" +
                       "height: " + (font_size + 2) + "px; text-align: center;" +
                       "color: blue; text-decoration: none; cursor: default")
      slider_div_header
        .append("div")
        .attr('class', 'info')
        .text(options.info_text)
        .attr("style", "border: 1px solid black; background: #cbcbcb; position: absolute;" +
                       "width: " + (-6.67 + slider_width) + "px;font-size: " + info_text_size + "px;" +
                       "padding: 2px 2px; white-space: pre-wrap; border-radius: 6px; z-index: 2;" +
                       "transform: translateY(" + (font_size + 5) + "px);")
      // Add hovering style for info
      let style;
      style = document.getElementById("sliders_info_style");
      if (!style) {
        style = document.createElement('style', { is : 'text/css' });
        style.id = "sliders_info_style";
        style.innerHTML = '.info { display: none; } '
        document.getElementsByTagName('head')[0].appendChild(style);
      }
      style.innerHTML = style.innerHTML + '#info_img_' + short_name + ':hover + .info { display: block; }';
    }

    // Add input box
    let input_div = slider_div
      .append('div')
      .attr("style", "clear:both;width:" + input_width + "px;")
    var input_box = input_div
        .append("input")
        .attr("name", short_name)
    input_box.attr("type", "number")
      .property('value', text_format(start))
      .property("min", min)
      .property("max", max)
      .property("step", (max - min)/100.0)
      .attr("style", "clear:both;position:static;width: " + input_width + "px; font-size: " + font_size + "px")

    var formatter = (max < 1e3) ? d3.format("") : d3.format(".1e");
    var slider = d3
        .sliderHorizontal()
        .min(min)
        .max(max)
        .step((max-min)/200.0)
        .default(start)
        .width(slider_width * 7 / 8)
        .fill(fill)
        .ticks(5).tickFormat(formatter)
        .displayValue(false)
        .on('onchange.a', function (value)
            { input_box.property("value", text_format(value)); internal_callback() })
        .on('drag', function (value)
            { input_box.property("value", text_format(value)); })
        .on('end', function (value)
            { input_box.property("value", text_format(value)); });
    getters_[short_name] = (function () { return slider.value(); });

    slider_div
      .append('svg')
      .attr('width', slider_width)
      .attr('height', 60)
      .append('g')
      .attr('transform', 'translate(12,20)')
      .call(slider);

    // link input box change to slider
    input_box.on("click", function () {
      var newValue = parseFloat(input_box.property('value'));
      input_box.value = text_format(newValue)
      if (newValue) {
        if (newValue <= max && newValue >= min) {
          slider.value(newValue);
          internal_callback(); // slider.value() is bugged and does not invoke onchange listener
        }
      }
    });

    input_box.on("keyup",function (e, b) {
      let codes = ['Enter'];
      if (codes.includes(d3.event.key)) {
        var newValue = parseFloat(input_box.property('value'));
        input_box.property('value', text_format(newValue))
        if (newValue) {
          if (newValue <= max && newValue >= min) {
            slider.value(newValue);
            internal_callback();
          }
        }
      }
    });

    input_box.on("focusout", function(e, b) {
      var newValue = parseFloat(input_box.property('value'));
      input_box.property('value', text_format(newValue))
      if (newValue) {
        if (newValue <= max && newValue >= min) {
          slider.value(newValue);
          internal_callback();
        }
      }
    });
    set_inputs[short_name] = function(new_data) {slider.value(new_data); };
    return slider;
  }

  var add_radio_buttons = function(target, short_name, name, button_names, checked, options) {
    options = options || {};
    let font_size = options.font_size || 12,
        inline = options.inline || false,
        margin = options.margin || "5px 5px"
    let radio_div = d3.select(target)
      .append('div')
      .attr("class", "radio_div")
      .attr("style", "font-size: " + font_size + "px; clear: both; overflow: hidden; margin: " + margin);
    radio_div.append('p')
      .text(name)
      .attr("style", "margin: 0 0;")

    let selections = {};
    for (let i=0; i<button_names.length; i++) {
      let section = radio_div.append("div")
      if (inline) {
        section.attr("style", "float: left; margin: 5px 5px 0 0; height: " + (font_size + 3) + "px");
      } else {
        section.attr("style", "clear: both; margin: 5px 0 0 0; height: " + (font_size + 3) + "px");
      }
      let selection =  section.append("input")
          .attr("type", "radio")
          .attr("name", short_name)
          .attr("value", button_names[i])
          .attr("style", 'float: left; border: 0px; height: ' + font_size + 'px; ' +
                         'width: ' + font_size + 'px; margin-top: 0')
          .on("change", function () { internal_callback(); });
      selections[button_names[i]] = selection;
      section.append("p")
          .text(button_names[i])
          .attr("style", "font-size: " + (font_size - 2) + "px; float: left; margin: 0 0;");
      if (button_names[i]===checked) { selection.attr("checked",""); }
    }
    getters_[short_name] = function () {
      return document.querySelector('input[name="'+short_name+'"]:checked').value;
    };
    set_inputs[short_name] = function(selected_value) { selections[selected_value].attr("checked",""); };
  }

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

  var add_input_box = function(target, short_name, long_name, starting_value, options) {
    options = options || {};
    let input_width = options.input_width || 150,
        font_size = options.font_size || 16,
        text_format = options.text_format || d3.format(".6e"),
        max = options.max || Number.MAX_VALUE,
        min = options.min || Number.MIN_VALUE,
        inline = options.inline || false,
        margin = options.margin || "5px 5px"

    let input_div = d3.select(target)
      .append("div")
      .attr("class", "input_div")
      .attr("id", "input_div_"+short_name)
      .attr("style", "clear: both; margin: " + margin +
                     ";font-size: " + font_size + "px;");

    // Header
    let header = input_div.append("div")
      .attr('style', 'height: ' + (font_size*1.2) + 'px;');
    header.append("p")
      .text(long_name)
      .attr('style', "margin-right: 5px; float: left; font-size: " + font_size + 'px;')

    // Input box
    let input_box = input_div
        .append("input")
        .attr("name", short_name)
        .attr("type", "number")
        .property('value', text_format(starting_value));
    if (inline) {
      input_box.attr("style", "float:left;width: " + input_width + "px; font-size: " + font_size + "px;" +
                              "transform: translateY(-12.5%);")
    } else {
      input_box.attr("style", "clear:both;position:static;width: " + input_width + "px; font-size: " + font_size + "px")
    }

    // Add info text
    if ("info_text" in options) {
      let info_text_size = options.info_text_size || font_size;
      let info_target;
      let text_style = "border: 1px solid black; background: #cbcbcb; position: absolute;" +
                       "padding: 2px 2px; white-space: pre-wrap; border-radius: 6px; z-index: 2;" +
                       "font-size: " + info_text_size + "px;"
      if (inline) {
        info_target = input_div;
        text_style += "width: " + (document.getElementById("input_div_" + short_name).clientWidth - 6) + "px;" +
                      "transform: translateY(" + (font_size + 5) + "px);"
      } else {
        info_target = header;
        text_style += "width: " + (input_width + 1) + "px; transform: translateY(" + (font_size + 4) + "px);"
      }
      info_target.append("div")
          .attr("id", "info_img_" + short_name)
          .text("?")
          .attr("style", "float:left; margin: 0 0 0 5px;font-size: " + (font_size - 1) + "px; position: relative;" +
                         "top: -" + (font_size / 36 * 5) + "px" + "; border: 1px solid blue;" +
                         "border-radius: " + (font_size + 2) + "px; width: " + (font_size + 2) + "px;" +
                         "height: " + (font_size + 2) + "px; text-align: center;" +
                         "color: blue; text-decoration: none; cursor: default")
      info_target.append("div")
        .attr('class', 'info')
        .text(options.info_text)
        .attr("style", text_style)
      // Add hovering style for info
      let style;
      style = document.getElementById("sliders_info_style");
      if (!style) {
        style = document.createElement('style', { is : 'text/css' });
        style.id = "sliders_info_style";
        style.innerHTML = '.info { display: none; } '
        document.getElementsByTagName('head')[0].appendChild(style);
      }
      style.innerHTML = style.innerHTML + '#info_img_' + short_name + ':hover + .info { display: block; }';
    }

    // Handle options
    if ('max' in options) input_box.property("max", options.max)
    if ('min' in options) input_box.property("min", options.min)

    // Link callback to input change
    input_box.on("click", function () {
      let newValue = parseFloat(input_box.property('value'));
      input_box.property('value', text_format(newValue))
      if (newValue) {
        if (newValue <= max && newValue >= min) {
          internal_callback();
        }
      }
    });

    input_box.on("keyup",function (e, b) {
      let codes = ['Enter'];
      if (codes.includes(d3.event.key)) {
        var newValue = parseFloat(input_box.property('value'));
        input_box.property('value', text_format(newValue))
        if (newValue) {
          if (newValue <= max && newValue >= min) {
            internal_callback();
          }
        }
      }
    });

    input_box.on("focusout", function(e, b) {
      var newValue = parseFloat(input_box.property('value'));
      input_box.property('value', text_format(newValue))
      if (newValue) {
        if (newValue <= max && newValue >= min) {
          internal_callback();
        }
      }
    });

    getters_[short_name] = (function () { return parseFloat(input_box.property('value')); });
    set_inputs[short_name] = function(newValue) { input_box.property('value', text_format(newValue)); };
    return input_div;

  }

    var add_drop_down = function(target, short_name, name, selections, options) {
    options = options || {};
    let margin = options.margin || "5px",
        font_size = options.font_size || 14;

    let selector_div = d3.select(target).append('div')
      .attr('class', 'selector_div')
      .attr('style', 'margin: ' + margin + ';');

    let header = selector_div.append('p')
      .text(name)
      .attr('style', 'font-size: ' + font_size + 'px;');

    let selector = selector_div.append('select')
      .attr('name', name)
      .attr('style', 'font-size: ' + font_size + 'px;')
      .on('change', internal_callback);

    let choices = selector.selectAll('option')
      .data(selections)
      .enter()
      .append('option')
      .text(function (e) { return e; });

    getters_[short_name] = function() { return selector.property('value'); };
    set_inputs[short_name] = function(newValue) { selector.property('value', newValue); };
    return selector_div;

  }

  return {
    add_float_slider: add_float_slider,
    add_radio_buttons: add_radio_buttons,
    add_check_box: add_check_box,
    add_input_box: add_input_box,
    add_drop_down: add_drop_down,
    set_callback: set_callback,
    get_values: get_values,
    set_values: set_values
  }

});

function plot_xy(destination, datasets, options) {

  document.querySelectorAll(destination)[0].innerHTML ="";

  var options = options || {};
  var colors = 'colors' in options ? d3.scaleOrdinal().range(options.colors)
                                       .domain(d3.range(options.colors.length)) :
                                     d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10));
  var color_index = options.color_index || 0;
  var x_label = options.x_label || "";
  var y_label = options.y_label || "";
  var y2_label = options.y2_label || "";
  var title = options.title || "";

  var padding = "padding" in options ? options.padding : {top: 30, right: 80, bottom: 40, left: 80},
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
  }

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
    y2 = d3.scaleLinear()
  } else {
    y = d3.scaleLog()
    y2 = d3.scaleLog();
  }

  x.domain([xmin_use, xmax_use])
   .range([0, width])
   .clamp(true);
  y.domain([ymin_use, ymax_use])
   .range([height, 0])
   .clamp(true);
  y2.range([height, 0])
   .clamp(true);

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
      .attr("width", width + padding.left + padding.right)
      .attr("height", height + padding.top + padding.bottom)
      .attr("style", "overflow:hidden;")
      .append("g")
      .attr("transform", "translate(" + padding.left + "," + padding.top + ")");

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
      let xarray = d[0];
      let yarray = d[1];
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
      chart1.append("path")
        .attr("class", "horizontal_line")
        .attr("stroke", colors((i+color_index)%10))
        .attr("stroke-dasharray", 'dashlen' in options ? options.dashlen + ', ' + options.dashlen : '0, 0')
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
        .attr("stroke-dasharray", 'dashlen' in options ? options.dashlen + ', ' + options.dashlen : '0, 0')
        .attr("stroke-width", 'line_width' in options ? options.line_width + 'px' : '2px')
        .attr("d", valueline(x.domain(), [d,d], x,y2));
    });
  }
  if ("axvlines" in options) {
    options.axvlines.forEach(function (d,i) {
      chart1.append("path")
        .attr("class", "vertical_line")
        .attr("stroke", colors((i+color_index)%10))
        .attr("stroke-dasharray", 'dashlen' in options ? options.dashlen + ', ' + options.dashlen : '0, 0')
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
    .attr("font-size", axes_size);

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
        .attr("style", "font-size:" + ("label_size" in options ? options.label_size : 15) + "px;")
        .text(d);
    });
  }

}
