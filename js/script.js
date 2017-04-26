// format the moment object
moment.updateLocale( 'en', {
  calendar: {
    lastDay: '[yesterday at] h:mma',
    sameDay: '[today at] h:mma',
    nextDay: '[tomorrow at] h:mma',
    lastWeek: '[last] dddd [(]Do[) at] h:mma',
    nextWeek: 'on dddd [at] h:mma',
    sameElse: 'on Do MMMM YYYY [at] h:mma'
  }
} );

// set the default tooltip for chart.js
Chart.defaults.global.tooltips.custom = function ( tooltip ) {
  // Tooltip Element
  var tooltipEl = document.getElementById( 'chartjs-tooltip' );

  // Hide if no tooltip
  if ( tooltip.opacity === 0 ) {
    tooltipEl.style.opacity = 0;
    return;
  }

  // Set caret Position
  tooltipEl.classList.remove( 'above', 'below', 'no-transform' );
  if ( tooltip.yAlign ) {
    tooltipEl.classList.add( tooltip.yAlign );
  } else {
    tooltipEl.classList.add( 'no-transform' );
  }

  function getBody( bodyItem ) {
    return bodyItem.lines;
  }

  // Set Text
  if ( tooltip.body ) {
    var titleLines = tooltip.title || [];
    var bodyLines = tooltip.body.map( getBody );

    var innerHtml = '<thead>';

    titleLines.forEach( function ( title ) {
      innerHtml += '<tr><th>' + title + '</th></tr>';
    } );
    innerHtml += '</thead><tbody>';

    bodyLines.forEach( function ( body, i ) {
      var colors = tooltip.labelColors[ i ];
      var style = 'background:' + colors.backgroundColor;
      style += '; border-color:' + colors.borderColor;
      style += '; border-width: 2px';
      var span = '<span class="chartjs-tooltip-key" style="' + style +
        '"></span>';
      span = '';
      innerHtml += '<tr><td>' + span + body + '</td></tr>';
    } );
    innerHtml += '</tbody>';

    var tableRoot = tooltipEl.querySelector( 'table' );
    tableRoot.innerHTML = innerHtml;
  }

  var positionY = this._chart.canvas.offsetTop;
  var positionX = this._chart.canvas.offsetLeft;

  // Display, position, and set styles for font
  tooltipEl.style.opacity = 1;
  tooltipEl.style.left = positionX + tooltip.caretX + 'px';
  tooltipEl.style.top = positionY + tooltip.caretY + 'px';
  tooltipEl.style.fontFamily = tooltip._fontFamily;
  tooltipEl.style.fontSize = tooltip.fontSize;
  tooltipEl.style.fontStyle = tooltip._fontStyle;
  tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding +
    'px';
};

// defaults for the humanizeDuration object so that a time length can be formatted with these settings
var timeago = humanizeDuration.humanizer( {
  "conjunction": ' and ',
  "language": 'en',
  "round": true,
  "units": [ 'w', 'd', 'h', 'm' ]
} );

// define the location from the URL
var LOCATION = capitalizeFirstLetter( document.referrer.split( "/" ).pop() );

// a function that capitalises the first letter of a string
// see: http://stackoverflow.com/a/1026087
function capitalizeFirstLetter( string ) {
  return string.charAt( 0 ).toUpperCase() + string.slice( 1 ).toLowerCase();
}

// a function that adds the data to the html page
function define_section( d, period ) {
  try {
    // set the period dates
    setElement(
      period + "_start",
      startFrom( d[ period + "_by_all" ].start, d[ period + "_by_all" ].end,
        period )
    );
    // check if it rained at all
    if ( typeof d[ period + "_by_all" ].wet.total_rainfall == "undefined" ) {
      setElement(
        period + "_wet",
        "It has not rained in the last " + period + "."
      );
      // stop this loop here as it hasn't rained
      return false;
    }
    // if we have got this far then it rained during the period, lets do some more processing

    // define the part to be used
    var part = d[ period + "_by_all" ];

    // this data is only available when it rained in the period
    if ( part.wet.number_of_periods > 0 ) {
      setElement(
        period + "_amount",
        mmToInches( part.wet.total_rainfall )
      );
      setElement(
        period + "_heaviest_15",
        mmToInches( part.wet.heaviest_in_15_mins.amount )
      );
      setElement(
        period + "_heaviest_15_time",
        formatDate( part.wet.heaviest_in_15_mins.when )
      );
      setElement(
        period + "_largest",
        mmToInches( part.wet.largest_amount.amount )
      );
      setElement(
        period + "_largest_time",
        formatDate( part.wet.largest_amount.when )
      );
      [ "wet", "dry" ].forEach( function ( wd ) {
        setElement(
          period + "_longest_" + wd,
          timeago( part[ wd ].longest_period.length * 1000 )
        );
        setElement(
          period + "_longest_" + wd + "_time",
          formatDate( part[ wd ].longest_period.when )
        );
        setElement(
          period + "_" + wd + "_count",
          onceOrTwice( part[ wd ].number_of_periods, "spells" )
        );
        var units = {
          "units": [ 'w', 'd', 'h', 'm' ]
        };
        if ( period === "record" ) units = {
          "units": [ 'mo', 'w', 'd', 'h', 'm' ]
        };
        setElement(
          period + "_" + wd + "_time",
          timeago( part[ wd ].total_time * 1000, units )
        );
        setElement(
          period + "_" + wd + "_percent",
          part[ wd ].percentage
        );
      } );
    }

    // define the sub data parts
    [ "hour", "day" ].forEach( function ( sub ) {
      try {
        // re-set the part we want
        var part = d[ period + "_by_" + sub ];
        // if this is the hour period then there will be no hourly or daily data so stop this loop immeidately, similarly there will be no daily data for the day period
        if ( period === "hour" && ( sub === "hour" || sub === "day" ) ) {
          document.getElementById( period + "_" + sub ).style.display =
            "none";
          return false;
        } else if ( period === "day" && sub === "day" ) {
          document.getElementById( period + "_" + sub ).style.display =
            "none";
          return false;
        }
        if ( sub === "hour" ) {
          setElement(
            period + "_hour_intensity",
            mmToInches( part.wet.intensity.amount )
          );
          setElement(
            period + "_hour_intensity_time",
            formatDate( part.wet.intensity.when )
          );
        }
          [ "wet", "dry" ].forEach( function ( wd ) {
          duration = part[ wd ].number_of_periods;
          duration_text = " " + wd + " " + sub;
          if ( duration !== 1 ) {
            duration_text = duration_text + "s";
          }
          setElement(
            period + "_" + sub + "_" + wd,
            numberWithCommas( duration ) + " " + duration_text
          );
        } );

        var multiplier = 86400000;
        var formatter = "Do MMMM YYYY";
        if ( sub === "hour" ) {
          multiplier = 3600000;
          formatter = "h:mma [on] " + formatter;
        }
        [ "wet", "dry" ].forEach( function ( wd ) {
          setElement(
            period + "_" + sub + "_" + wd + "_row",
            timeago( Math.ceil( part[ wd ].longest_period.length *
              1000 /
              multiplier ) * multiplier )
          );
          setElement(
            period + "_" + sub + "_" + wd + "_row_time",
            formatDate( part[ wd ].longest_period.when[ 0 ],
              formatter )
          );
        } );
      } catch ( e ) {
        document.getElementById( period + "_" + sub ).style
          .display = "none";
      }
    } );
  } catch ( e ) {}
}

// this function draws the graphs
function drawGraph( options ) {
  // shuffle two arrays in the same way
  // see: http://stackoverflow.com/a/18194993
  function shuffle() {
    var length0 = 0,
      length = arguments.length,
      i,
      j,
      rnd,
      tmp;

    for ( i = 0; i < length; i += 1 ) {
      if ( {}.toString.call( arguments[ i ] ) !== "[object Array]" ) {
        throw new TypeError( "Argument is not an array." );
      }

      if ( i === 0 ) {
        length0 = arguments[ 0 ].length;
      }

      if ( length0 !== arguments[ i ].length ) {
        throw new RangeError( "Array lengths do not match." );
      }
    }

    for ( i = 0; i < length0; i += 1 ) {
      rnd = Math.floor( Math.random() * i );
      for ( j = 0; j < length; j += 1 ) {
        tmp = arguments[ j ][ i ];
        arguments[ j ][ i ] = arguments[ j ][ rnd ];
        arguments[ j ][ rnd ] = tmp;
      }
    }
  }

  // start a chart.js object
  var ctx = document.getElementById( options.id ).getContext( "2d" );
  // get a set of colours and a corresponding darker set
  var bgColours = chroma.scale( [ options.colour1, options.colour2 ] ).colors(
    options.labels.length );
  var hbgColours = chroma.scale( [ chroma( options.colour1 ).darken( 3 ).hex(),
      chroma( options.colour2 ).darken( 3 ).hex() ] ).colors( options.labels.length );
  // shuffle the colours randomly
  shuffle( bgColours, hbgColours );
  // define some data for the chart
  var chart_data = {
    labels: options.labels,
    datasets: [
      {
        data: options.data_points,
        backgroundColor: bgColours,
        hoverBackgroundColor: hbgColours
      } ]
  };
  // draw the chart
  var myChart = new Chart( ctx, {
    type: options.type,
    data: chart_data,
    options: {
      responsive: options.responsive,
      layout: {
        padding: 0
      },
      scale: {
        display: false
      },
      scales: {
        xAxes: [ {
          display: false,
          categoryPercentage: 1.0,
          barPercentage: 1.0
        } ],
        yAxes: [ {
          display: false
        } ]
      },
      legend: {
        display: false
      },
      tooltips: {
        enabled: false,
        callbacks: {
          title: function ( tooltipItem, data ) {
            return options.title;
          },
          label: function ( tooltipItem, data ) {
            return options.alter_fn( data.labels[ tooltipItem.index ] ) +
              " : " +
              mmToInches(
                data.datasets[ tooltipItem.datasetIndex ].data[
                  tooltipItem.index ],
                true
              );
          }
        }
      }
    }
  } );
}

// a function that sets up the drawing of the charts
function draw_the_graphs( d ) {
  // define the likely data and graphs
  var loop = [ "hour", "dayOfWeek", "dayOfYear", "week", "month", "year" ];
  loop.forEach( function ( which ) {
    try {
      // find the highest number in the likely array
      var popmax = popular( d.likely[ which ], "max" );

      // draw the graph
      var chart_options = {
        "hour": {
          "type": "bar",
          "responsive": false,
          "title": "Total Hourly Rainfall",
          "alter_fn": function ( i ) {
            return moment.utc().hour( i ).format( "ha" );
          }
        },
        "dayOfWeek": {
          "type": "polarArea",
          "responsive": false,
          "title": "Total Day Of Week Rainfall",
          "alter_fn": function ( i ) {
            return moment.utc().day( i - 1 ).format( "dddd" );
          }
        },
        "dayOfYear": {
          "type": "bar",
          "responsive": true,
          "title": "Total Day Of Year Rainfall",
          "alter_fn": function ( i ) {
            return moment.utc( "2016-01-01" ).add( i - 1, "days" ).format(
              "MMMM Do" );
          }
        },
        "week": {
          "type": "polarArea",
          "responsive": false,
          "title": "Total Weekly Rainfall",
          "alter_fn": function ( i ) {
            return moment.utc().week( i ).format( "wo" ) + " week";
          }
        },
        "month": {
          "type": "polarArea",
          "responsive": false,
          "title": "Total Monthly Rainfall",
          "alter_fn": function ( i ) {
            return moment.utc().month( i - 1 ).format( "MMMM" );
          }
        },
        "year": {
          "type": "polarArea",
          "responsive": false,
          "title": "Total Yearly Rainfall",
          "alter_fn": function ( i ) {
            return i;
          }
        }
      };
      // begin drawing the chart
      drawGraph( {
        "id": "likely-" + which + "-graph",
        "responsive": chart_options[ which ].responsive,
        "type": chart_options[ which ].type,
        "colour1": "#3276B1",
        "colour2": "#B6E6FB",
        "labels": d.likely[ which ].map( function ( y ) {
          return y.period;
        } ),
        "data_points": d.likely[ which ].map( function ( y ) {
          return y.rain;
        } ),
        "title": chart_options[ which ].title,
        "alter_fn": chart_options[ which ].alter_fn
      } );

      // format the date of the highest number depending on the period
      if ( which === "month" ) {
        popmax[ 1 ] = moment.utc().month( popmax[ 1 ] -
          1 ).format( "MMMM" );
      } else if ( which === "year" ) {
        popmax[ 1 ] = moment.utc().year( popmax[ 1 ] ).format(
          "YYYY" );
      } else if ( which === "dayOfWeek" ) {
        popmax[ 1 ] = moment.utc().day( popmax[ 1 ] - 1 )
          .format( "dddd" );
      } else if ( which === "dayOfYear" ) {
        popmax[ 1 ] = moment.utc( "2016-01-01" ).add( popmax[ 1 ] - 1,
          "days" ).format( "Do MMMM" );
      } else if ( which === "hour" ) {
        popmax[ 1 ] = moment.utc().hour( popmax[ 1 ] ).format(
          "ha" );
      } else if ( which === "week" ) {
        popmax[ 1 ] = popmax[ 1 ] + " (around " +
          moment.utc().week( popmax[ 1 ] ).startOf( "week" ).format(
            "Do MMMM" ) + ")";
      }
      setElement(
        "most_popular_" + which,
        popmax[ 1 ]
      );
      setElement(
        "most_popular_" + which + "_amount",
        mmToInches( popmax[ 0 ] )
      );
      setElement(
        "most_popular_" + which + "_average",
        mmToInches( popmax[ 2 ] )
      );
      if ( which === "year" ) {
        var words = "  ";
        var this_amount, this_when;
        try {
          this_when = d.likely[ which ][ d.likely[
            which ].length - 1 ].period;
          this_amount = mmToInches( d.likely[ which ]
              [ d.likely[ which ].length - 1 ].rain );
          if ( this_when === popmax[ 1 ] ) {
            words += this_when +
              " has the highest amount of rain we have ever recorded.";
          } else {
            words += this_amount +
              " of rain has fallen so far in " +
              this_when + ".";
          }
        } catch ( e ) {}
        setElement(
          "most_popular_special",
          words
        );
      }
    } catch ( e ) {
      var list = document.getElementsByClassName( "most_popular_" + which +
        "_summary" );
      for ( var l = 0; l < list.length; l++ ) {
        list[ l ].style.display = "none";
      }
    }
  } );
}

// a function that calculates the expected amount of rainfall in a given period, it returns how much of the expected amount has fallen as a percentage
function expected_amount( d, period ) {
  try {
    // var format = period === "month" ? "M" : "YYYY";
    if ( typeof d.likely[ period ] !== "undefined" &&
      typeof d[ period + "_by_all" ] !== "undefined" ) {
      // var this_period = parseInt( moment.utc().format( format ), 10 );
      var expected_rainfall_this_period;
      if ( period === "month" ) {
        var lower = moment.utc().add( -1, "month" ).format( "DDD" );
        var upper = moment.utc().format( "DDD" );
        expected_rainfall_this_period = d.likely.dayOfYear.filter(
          function ( m ) {
            return m.period > lower && m.period <= upper;
          } ).reduce( function ( tot, m ) {
          return tot + m.average_per_period;
        }, 0 );
      } else {
        expected_rainfall_this_period = d.likely[ period ].reduce(
          function ( tot, m ) {
            return tot + m.average_per_period;
          }, 0 ) / d.likely[ period ].length;
      }
      var percentage_of_expected = round( 100 * d[ period + "_by_all" ].wet.total_rainfall /
        expected_rainfall_this_period, 1 );
      return percentage_of_expected;
    }
  } catch ( e ) {
    return null;
  }
}

// a function that formats a date or array of dates into the format passed
function formatDate( dateamount, format ) {
  format = typeof format !== "undefined" ? format : "h:mma [on] Do MMMM YYYY";
  if ( Object.prototype.toString.call( dateamount ) === "[object String]" ) {
    dateamount = [ dateamount ];
  }
  for ( var d = 0; d < dateamount.length; d++ ) {
    dateamount[ d ] = moment.utc( dateamount[ d ] ).format( format );
  }
  return niceList( dateamount );
}

// a function that hides the html section when the data is missing
function hide_section( s ) {
  try {
    document.getElementById( s ).style.display = "none";
    document.getElementById( "tab_" + s ).setAttribute( "type", "hidden" );
    document.getElementById( "label_" + s ).style.display = "none";
  } catch ( e ) {
    try {
      document.getElementById( period ).style.display = "none";
      document.getElementById( "tab_" + s ).style.display = "none";
      document.getElementById( "tab_" + s ).setAttribute( "type", "hidden" );
      document.getElementById( "label_" + s ).style.display = "none";
    } catch ( e ) {}
  }
}

// a function that calculates the highest common factor between two numbers
// see: http://stackoverflow.com/a/17445304
function highest_common_factor( a, b ) {
  if ( !b ) {
    return a;
  }
  return highest_common_factor( b, a % b );
}

// a function that fetches the json from a url.  it then sets off nextFunction when the download has completed
function loadJSON( url, nextFunction ) {
  var xhttp = new XMLHttpRequest();
  if ( xhttp.overrideMimeType ) {
    xhttp.overrideMimeType( "application/json" );
  }
  xhttp.onreadystatechange = function () {
    if ( this.readyState == 4 && this.status == 200 ) {
      try {
        nextFunction( JSON.parse( this.responseText ) );
      } catch ( e ) {}
    }
  };
  xhttp.open( "GET", url, true );
  xhttp.send();
}

// a function that converts mm into inches and formats the output in the form of x (c|m)m (X x/y") for instance 2.54cm (1")
function mmToInches( mm, clean ) {
  clean = typeof clean !== "undefined" ? clean : false;
  // convert the mm into inches and can the whole number of inches and the remaining part
  var inches = mm / 25.4;
  var whole = numberWithCommas( parseInt( inches, 10 ) );
  var part = inches % 1;
  // return the whole number of inches if this is an exact number
  if ( part === 0 ) return mm + "mm (" + whole + "\")";
  // get how many 1/64ths of an inch there are in the remaining part of the number
  part = parseInt( part * 64, 10 );
  // return the phrase if this is too small
  if ( part === 0 && whole % 1 === 0 ) {
    return mm +
      "mm (less than <sup>1</sup>&frasl;<sub>64</sub>\")";
  } else if ( part === 0 ) {
    return mm + "mm (" + whole + "\")";
  }
  // determine the highest common factor between 64 and the part remaining
  var hcf = highest_common_factor( part, 64 );
  // simplify mm
  var mm_suffix = "mm";
  if ( mm >= 1000 ) {
    mm = mm / 1000;
    mm = mm.toFixed( 3 );
    mm_suffix = "m";
  } else if ( mm >= 10 ) {
    mm = mm / 10;
    mm = mm.toFixed( 2 );
    mm_suffix = "cm";
  }
  // return the result
  var result = numberWithCommas( mm ) + mm_suffix + " (";
  if ( whole > 0 ) result += whole + " and ";
  result += "<sup>" + ( part / hcf ) + "</sup>&frasl;<sub>" + ( 64 / hcf ) +
    "</sub>\")";
  if ( clean ) {
    result = result.replace( /sup|sub/g, "" ).replace( /<|\/|>/g, "" ).replace(
      "&frasl;", "/" );
  }
  return result;
}

// returns a nicely listed array of items, for instance [1,2,3] becomes 1, 2 and 3
// see: http://stackoverflow.com/a/16251861
function niceList( arr ) {
  return [ arr.slice( 0, -1 ).join( ', ' ), arr.slice( -1 )[ 0 ] ].join( arr.length <
    2 ? '' : ' and ' );
}

// a function that adds commas every thousand so 1000 becomes 1,000 and 1000000 becomes 1,000,000
// see: http://stackoverflow.com/a/2901298
function numberWithCommas( x ) {
  var parts = x.toString().split( "." );
  parts[ 0 ] = parts[ 0 ].replace( /\B(?=(\d{3})+(?!\d))/g, "," );
  return parts.join( "." );
}

// a function that returns the phrase once, twice or x word depending on the number (num) passed
function onceOrTwice( num, word ) {
  switch ( parseInt( num, 10 ) ) {
  case 1:
    return "once";
  case 2:
    return "twice";
  default:
    return "in " + numberWithCommas( num ) + " " + word;
  }
}

// a function that processes an array and outputs the value found, when it occurred and what the average of the array is
function popular( arr, which ) {
  var maxmin = Math[ which ].apply( Math, arr.map(
    function ( o ) {
      return o.rain;
    } ) );
  var maxmin_when = arr.filter( function (
    item ) {
    return item.rain === maxmin;
  } ).map( function ( item ) {
    return item.period;
  } );
  var average = ( arr.map(
    function ( o ) {
      return o.rain;
    } ).reduce( function ( a, b ) {
    return a + b;
  } ) / arr.length ).toFixed( 1 );
  return [ maxmin, maxmin_when, average ];
}

// a function that processes the JSON that has been downloaded
function processData( data ) {
  try {
    // last updated
    setElement( "updated", moment.utc( data.last_data_time ).calendar() );

    // last rained
    if ( data.last_rained === data.last_data_time ) {
      if ( typeof data.hour_by_all.wet === "undefined" ) {
        setElement( "holder_rained", "It has just started to rain." );
      } else {
        setElement( "holder_rained",
          "It was raining when we took our last data point." );
      }
    } else {
      var rained_moment = moment.utc( data.last_rained );
      var rained = rained_moment.calendar();
      if ( rained.startsWith( "on" ) ) {
        rained += " (" + humanizeDuration(
          rained_moment.diff( moment.utc( data.last_data_time ) ),
          {
            "round": true,
            "units": [ 'mo', 'd' ]
          }
        ) + " ago)";
      }
      setElement( "rained", rained );

      var shower_length = data.last_shower.length * 900000;
      var shower_amount = data.last_shower.reduce( function ( tot, am ) {
        return tot + am.amount;
      }, 0 );
      setElement( "last_shower_details", "The rain lasted for " + timeago(
          shower_length ) + " and " +
        mmToInches( shower_amount ) + " fell." );
    }

    // add how well we are doing this month and year
    var referenceNode = document.getElementById( "last_shower_details" );
    var lsd = document.getElementById( "lsd" );
    if ( lsd !== null ) referenceNode.removeChild( lsd );
    var expectedNode = document.createElement( "p" );
    expectedNode.setAttribute( "id", "lsd" );
    var expected = expected_amount( data, "month" );
    if ( expected !== null ) expectedNode.innerHTML = LOCATION +
      " has had " + expected +
      "% of the expected average rainfall for the last month.";
    expected = expected_amount( data, "year" );
    if ( expected !== null ) {
      var current = "";
      if ( expectedNode.innerHTML !== "" ) {
        current = expectedNode.innerHTML + " ";
      }
      expectedNode.innerHTML = current + "For the last year, " + expected +
        "% of the expected average rainfall has fallen.";
    }
    if ( expectedNode.innerHTML !== "" ) {
      referenceNode.parentNode.insertBefore( expectedNode, referenceNode.nextSibling );
    }

    // data age
    setElement( "collecting_age", moment.utc( data.record_by_all.start ).format(
      "Do MMMM YYYY [at] h:mma" ) );

    // location
    setElement( "location_name", LOCATION );
    document.title = LOCATION + " - rain.boff.in";

    // add the data to the page period by period
    var loop = [ "hour", "day", "week", "month", "year", "record" ];
    loop.forEach( function (
      period ) {
      if ( data[ period + "_by_all" ].wet.total_rainfall === 0 ) {
        // period_by_all does not exist so hide the section
        hide_section( period );
      } else {
        // period_by_all exists so add the data to the page
        define_section( data, period );
      }
    } );

    // select the first visible tab
    var inputs = document.getElementsByTagName( "input" );
    for ( var i = 0; i < inputs.length; i += 1 ) {
      if ( inputs[ i ].type !== "hidden" ) {
        inputs[ i ].click();
        break;
      }
    }

    // now draw the likely graphs
    draw_the_graphs( data );

    // finally make the content visible
    var body_class = document.body.getAttribute( "class" );
    if ( body_class === null ) {
      document.body.className += "loaded";
    } else if ( body_class.indexOf( "loaded" ) === -1 ) {
      document.body.className += " loaded";
    }
  }
  catch ( e ) {
    alert(
      "There was an error with our data, please try again later.\n\nAlternatively you can watch this raindrop fill repeatedly."
    );
  }
}

function getNiceName( str ) {
  switch ( str ) {
  case "record_by_all":
    return "All time";
  case "year_by_all":
    return "In the last year";
  case "month_by_all":
    return "In the last month";
  case "week_by_all":
    return "In the last week";
  case "day_by_all":
    return "In the last day";
  default:
    return "In the last hour";
  }
}

// this function redirects the user to a new location
// (called from html)
function redirect( loc ) {
  window.location.replace( "https://rain.boff.in/" + loc );
}

// rounds a number to a certain precision
// see: http://stackoverflow.com/a/7343013
function round( value, precision ) {
  var multiplier = Math.pow( 10, precision || 0 );
  return Math.round( value * multiplier ) / multiplier;
}

// a function that sets and html element with the amount given
function setElement( which, amount ) {
  document.getElementById( which ).innerHTML = amount;
}

// a function that calculates and formats the start and end dates of the data
function startFrom( start, end, duration ) {
  if ( duration === "hour" ) {
    return moment.utc( start ).format( "ha" ) + " to " + moment.utc( end ).format(
      "ha" );
  } else if ( duration === "day" ) {
    return moment.utc( start ).format( "Do MMMM ha" ) + " to " + moment.utc(
      end ).format( "Do MMMM ha" );
  }
  else
  if ( duration === "week" ) {
    return moment.utc( start ).format( "Do MMMM" ) + " to " + moment.utc(
      end ).format( "Do MMMM" );
  }
  else if ( duration === "month" ) {
    return moment.utc( start ).format( "Do MMMM YYYY" ) + " to " + moment
      .utc( end ).format( "Do MMMM YYYY" );
  } else if ( duration === "year" ) {
    return moment.utc( start ).format( "Do MMMM YYYY" ) + " to " + moment
      .utc( end ).format( "Do MMMM YYYY" );
  } else {
    return moment.utc( start ).format( "Do MMMM YYYY h:mma" ) + " to " +
      moment.utc( end ).format( "Do MMMM YYYY h:mma" );
  }
}

// do this when the page is ready
document.addEventListener( "DOMContentLoaded", function ( event ) {
  // loadJSON( LOCATION.toLowerCase() + "/rain.json", processData );
  setTimeout( function () {
    if ( LOCATION !== "" ) {
      // fetch the JSON and process the data
      loadJSON( LOCATION.toLowerCase() + "/rain.json", processData );
    }
  }, 500 );
} );
