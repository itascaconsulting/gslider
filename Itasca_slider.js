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
          .attr("value", options[i]);
      if (options[i]===checked) { tmp.attr("checked",""); }
    }
  };


  var add_check_box = function(target, short_name, name, checked) {
    d3.select(target)
      .append('div').text(name);
    var input =  d3.select(target).append("input");
    input.attr("type", "checkbox")
      .attr("name", short_name)
      .attr("value", short_name);
    if (checked) { input.attr("checked",""); }
    getters_[short_name] = function () { return true; };
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
