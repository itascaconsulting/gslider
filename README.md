# SlidenPlot: Interactive web-based calculations with sliders and instant results plotting

A Javascript library to create single page web applications with
interactive inputs and instant result plotting. The library depends on
[d3](https://d3js.org) and
[d3-simple-slider](https://github.com/johnwalley/d3-simple-slider).


![Demo](./demo.gif)

## Example

[Live demo](https://s3.us-east-2.amazonaws.com/icgprojects/2857-16/slidenplot_demo.html)

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
     .line {fill: none; stroke-width: 2.5px;}
     .flex-container {display: flex; flex-wrap: nowrap;}
    </style>
  </head>
  <body>
    <p><em>Example slider application</em></p>
    <hr>
    <div class="flex-container">
      <div id="inputs"></div> <div id="results"></div>
    </div>

    <script src="https://d3js.org/d3.v5.min.js"></script>
    <script src="https://unpkg.com/d3-simple-slider"></script>
    <script src="https://s3.us-east-2.amazonaws.com/icgprojects/2857-16/slidenplot.js" charset="utf-8"></script>
    <script>
     var my_app = SlidenPlotApp();
     my_app.add_float_slider("#inputs", "A", "Amplitude", 1, 0.1, 10);
     my_app.add_float_slider("#inputs", "f", "Frequency", 2, 0.1, 10);
     my_app.add_float_slider("#inputs", "p", "Phase", 0, 0, 2*Math.PI);
     my_app.add_radio_buttons("#inputs", "ftype", "Function", ["Sine", "Cosine"], "Sine");
     my_app.add_check_box("#inputs", "damping", "Damping", true);

     function my_callback(data) {
       var n = 200, x = [], y = [];
       for (var i=0; i<n; i++) {
         var lx = i/(n+0)*4*Math.PI,
           func = data.ftype === "Sine" ? Math.sin : Math.cos,
           ly = data.A*func(data.f*lx+data.p);
         if (data.damping) ly = Math.exp(-lx/10)*ly;
         x.push(lx);
         y.push(ly);
       }
       plot_xy("#results", [[x, y]],
           options={ legend: [data.ftype],
                title: "Sample Plot",
                x_label: "Time [s]",
                y_label: "Pressure [Pa]"});
     }
     my_app.add_callback(my_callback);
    </script>
  </body>
</html>
```

## API Documentation
### SlidenPlotApp object

Create an application object: `var my_app = SlidenPlotApp();`

This object has the following methods:

`add_float_slider(selector, short_name, long_name, starting_value, min, max, options)`

Add a floating point slider and a connected input box to the HTML element given by `selector`. `short_name` is used to 
access the values, `long_name` is used as the input label, `starting_value` gives the initial value of the slider, `min`
and `max` are the limits of the sliders. Moving the slider updates the input box and vice versa. The input box allows 
for more decimal places and is treated as the authoritative value. Only floating point values equal to `min` or `max` 
or between `min` and `max` are accepted in the input box. The optional `options` argument can have the following
properties:

 - `slider_width`: the width of the slider in pixels
 - `input_width`: the width of the input box in pixels
 - `font_size`: the font size of the text
 - `fill`: a fill color for the slider
 - `info_text`: adds the text as a small info pop-up for the slider
 - `info_text_size`: text size of the info text

`add_radio_buttons(selector, short_name, long_name, button_names, starting_value, options)`

Add a set of radio buttons to the HTML element given by `selector`. `short_name` is used to access the values, 
`long_name` is used as the input label, `button_names` is an array of strings giving the button names. The button names
are also used as the input value. `starting_value` can be the value of one of the buttons to make that button initially
selected. The optional `options` argument can have the following properties:

 - `font_size`: the font size of the text

`add_check_box(selector, short_name, long_name, starting_value)`

Add a check box input to the HTML element given by `selector`.
`short_name` is used to access the values, `long_name` is used as the
input label, and if `starting_value` is true the box will be check initially.

`add_callback(callable)`

Register a user written function to be called when the value of any input changes. The function should take a single
value as an argument. When this function is called the argument is an object with parameters given by the `short_name`
of each input and the values are the current values of each input.

`get_values()`

Return the values of the inputs as an object where the properties are the short_names of the inputs and the values are
the current values of the inputs. This function is automatically called before the user specified callback function is
invoked. It is not typically necessary to call this function but it is available for testing.

### Plotting
The `plot_xy` function is provided to simplify
creating x,y plots with [d3](https://d3js.org).

`plot_xy(selector, data_sets, options)`

Add a two dimensional plot to the HTML element given by `selector`.
`data_sets` should be an array of arrays of x and y value arrays. The
optional `options` argument can have the following properties:


 - `x_label`: a label for the x axis.
 - `y_label`: a label for the y axis.
 - `xmin` `xmax` `ymin` `ymax`: the upper and lower limits of the x and
  y axes. If this is not specified the limits are determined automatically.
 - `axhlines`: an array of y-values giving locations to plot
   horizontal lines.
 - `axvlines`: an array of x-values giving locations to plot vertical lines.
 - `title`: a title, rendered above the chart.
 - `colors`: a `d3` ordinal scale that returns colors. Each data set
   is given a color according to this scale. The default is
   `d3.schemeCategory10`.
 - `color_index`: The starting index into `colors`. The default is 0.
 - `legend`: an array of strings giving the name of each data_set. A
   color marker and the data_set name are written to the same HTML
   element as the plot.
 - `grid`: add an x,y grid to the plot.
 - `logx`: whether to scale the x-axis logarithmically
 - `logy`: whether to scale the y-axis logarithmically
 - `width`: width of the plot
 - `height`: height of the plot
 - `title_size`: font size of the title
 - `axes_size`: font size of axes' ticks
 - `label_size`: font size of the labels for the axes
 - `margin`: a dictionary mapping `top`, `right`, `bottom`, and `left` to their respective paddings
 - `circles`: An array of arrays of x and y values. Draws a circle on the plot for each
 (x, y) point in the array.
 - `circle_color`: the color of the plotted circles.
 - `graph_text`: text to be displayed on the graph.
 - `graph_text_location`: an array containing an x and y value that determines the location of graph_text
 in pixels relative to the plot. [0, 0] represnts the top-left corner of the plot, with x-values increasing to
 the left and y-values increasing downwards.
 - `graph_text_size`: font size of graph_text

A second y-axis, on the right-side of the plot, can be added by
specifying these properties in the `options` argument:

 - `right_y_scale`: if this factor is given a right-side y-axis is
   rendered scaled by this factor relative to the left-side y-axis.
   Only one of `right_y_scale` or `right_data` can be specified in a
   given plot.
 - `right_data`: data sets to plot on the right-side y-axis. The
   format is the same as `data_sets`. Only one of `right_y_scale` or
   `right_data` can be specified in a given plot.
 - `y2_label`: a label for the right-side y axis.
 - `y2min` and `y2max`: the limits of the right-side y-axis. If this
   is omitted the scale is determined automatically.
 - `ax2hlines`: an array of y-values giving locations to plot
   horizontal lines on the right-side y axis.
 - `ax2hline_color`: a color index for the horizontal line.
