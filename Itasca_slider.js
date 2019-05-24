var Itasca_slider_app = (function (controls) {
  var sliders_ = [],
      count = -1;

  var expFormat = d3.format(".3e");
  var expFormat2 = d3.format(".2f");

  var internal_callback = function(index, value) {
    console.log(index, value);
  };

  var add_float_slider = function(target, short_name, name,
                                  start, min, max) {
    count += 1;
    var local_count = count;
    console.log(name);
    console.assert(start >= min);
    console.assert(start <= max);
    console.assert(min < max);
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
        .on('onchange', function (value) { internal_callback(local_count, value); });

    d3.select(target)
      .append('div').text(name);
    d3.select(target).append("br");
    d3.select(target)
      .append('svg')
      .attr('width', 500)
      .attr('height', 60)
      .append('g')
      .attr('transform', 'translate(30,20)')
      .call(slider);
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
      if (i===checked) { tmp.attr("checked",""); }
    }

  };

  return {
    add_float_slider: add_float_slider,
    add_radio_buttons: add_radio_buttons
  };
});


function slider_callback() {
  function get_data(controls, sliders) {
    var data = {};
    var i=0;
    for (c in controls) {
      data[c] = sliders[i].value();
      i+=1;
    }
    return data;
  }
  var input_data = get_data(input_controls, input_sliders);
  run_model(input_data);
  writeInputBox(input_data, "#sliders");
  function writeInputBox (data,divA) {
    for (d in data) {
      d3.select(divA).select('.symbol'+d)
        .property('value', expFormat(data[d]));
    }
  }
}

function add_controls(controls, divToAdd) {
  var sliders = [],
      show_sliders = d3.select(divToAdd),
      c,i=0;
  for (c in controls) {
    var name = controls[c][0],
        min_val = controls[c][1],
        start_val = controls[c][2],
        max_val = controls[c][3];
    var temp_slider = show_sliders.append("div");
    temp_slider.attr("id", "slider"+i).attr("class", divToAdd.substring(1));
    var formatter = (max_val < 1e3) ? d3.format("") : d3.format(".1e");
    var tmp_d3slider = d3.slider().min(min_val).max(max_val)
        .ticks(5).showRange(true).tickFormat(formatter)
        .value(start_val).callback(slider_callback);

    var h1 = show_sliders.select("#slider"+i).append("div");
    h1.attr('style', 'white-space: pre;')
      .attr('id',"h1__"+i)
      .html(name + ": ");

    var inputDiv = show_sliders.select("#slider"+i)
        .select("div")
        .append("input")
        .attr("symbol", c);
    inputDiv.attr("type", "number")
      .attr("id", "input__"+i)
      .attr("class",'input symbol'+c)
      .property('value', expFormat(start_val))
      .property("min", min_val)
      .property("max", max_val)
      .property("step", (max_val - min_val)/100 )
      .attr("data-currentvalue",start_val);

    d3.select('#slider'+i).call(tmp_d3slider);
    sliders.push(tmp_d3slider);

    // click listener
    d3.select("#left").selectAll('.input').on("click",function (a,b) {
      var idToChange = d3.select(this).attr('id');
      var newerValue = parseFloat(d3.select(this).property('value'));
      var symbolToChange = d3.select(this).attr('symbol');
      inputBoxChange(idToChange, symbolToChange, newerValue);
    });
    // number input listener
    d3.select("#left").selectAll('.input').on("keyup",function (e, b) {
      if ((d3.event.keyCode >=48 && d3.event.keyCode <= 57) || (d3.event.keyCode >=96 && d3.event.keyCode <=105)) {
        var idToChange = d3.select(this).attr('id');
        var newerValue = parseFloat(d3.select(this).property('value'));
        var symbolToChange = d3.select(this).attr('symbol');
        inputBoxChange(idToChange, symbolToChange, newerValue);
      };
    });

    i += 1;
  }
  return sliders;
}

  var inputBoxChange = function (idChanged, symbol, newerValue) {
    divNum = idChanged.split("__")[1];
    sliderID = "#slider"+divNum;

    var getMin = d3.select(sliderID).select(".input").property("min");
    var getMax = d3.select(sliderID).select(".input").property("max");
    var getCurrentValue = d3.select(sliderID)
        .select(".input").attr("data-currentvalue");
    if (newerValue >= getMin && newerValue <= getMax) {
      var newWidth = parseInt(d3
                              .select(sliderID)
                              .select(".d3slider-rect-range")
                              .attr("width"));
      var newScale = d3.scale.linear()
          .domain([getMin, getMax]).range([0, newWidth]).clamp(true);
      var changeSlider = d3.select(sliderID)
          .select('.dragger').attr("transform", function() {
        return "translate(" + newScale(newerValue) + ")";
      });
      d3.select(sliderID).select('.d3slider-rect-value')
        .attr("width", newScale(newerValue));
      d3.select(sliderID).select(".input")
        .attr("data-currentvalue", newerValue);

      var groupDiv = d3.select(sliderID).attr("class");
      groupDiv = groupDiv.split(' ')[0].split('_')[0];

      input_sliders[divNum].setValue(newerValue);
    } else {
      d3.select(sliderID).select(".input")
        .property('value', expFormat(getCurrentValue));
    }
  };
