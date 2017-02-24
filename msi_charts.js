function sortArrays(tarray, toutarray, txcatout) {
  tarray = tarray.sort(Comparator);
  $.each(tarray, function (x, y) {
    txcatout.push(y[0]);
    if (y[0] == "US") {
      toutarray.push({y: y[1], color: 'red'});
    }
    else {
      toutarray.push(y[1]);
    };
  });
};

function Comparator(a, b) {
  // sorts by descending - flip signs to sort ascending
   if (a[1] > b[1]) return -1;
   if (a[1] < b[1]) return 1;
   return 0;
}

function sort_by (field, reverse, primer){
   var key = primer ?
     function(x) {return primer(x[field])} :
     function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
     return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
   }
}

function pushData(dobj, things) {
  dobj.push({'type': parseFloat(things[0]),
    'industry': String(things[1]).replace(/['"]+/g, ''),
    'occupation': String(things[2]).replace(/['"]+/g, ''),
    'state': things[3],
    'education': things[4],
    'period': String(things[5]),
    'chg': parseFloat(things[6]),
    'pctchg': parseFloat(things[7])
  });
}

function state_lookup(type, state) {
  state = state.toUpperCase();
  var states = [                                {'name':'Alabama', 'abbrev':'AL'},          {'name':'Alaska', 'abbrev':'AK'},
    {'name':'Arizona', 'abbrev':'AZ'},          {'name':'Arkansas', 'abbrev':'AR'},         {'name':'California', 'abbrev':'CA'},
    {'name':'Colorado', 'abbrev':'CO'},         {'name':'Connecticut', 'abbrev':'CT'},      {'name':'Delaware', 'abbrev':'DE'},
    {'name':'Florida', 'abbrev':'FL'},          {'name':'Georgia', 'abbrev':'GA'},          {'name':'Hawaii', 'abbrev':'HI'},
    {'name':'Idaho', 'abbrev':'ID'},            {'name':'Illinois', 'abbrev':'IL'},         {'name':'Indiana', 'abbrev':'IN'},
    {'name':'Iowa', 'abbrev':'IA'},             {'name':'Kansas', 'abbrev':'KS'},           {'name':'Kentucky', 'abbrev':'KY'},
    {'name':'Louisiana', 'abbrev':'LA'},        {'name':'Maine', 'abbrev':'ME'},            {'name':'Maryland', 'abbrev':'MD'},
    {'name':'Massachusetts', 'abbrev':'MA'},    {'name':'Michigan', 'abbrev':'MI'},         {'name':'Minnesota', 'abbrev':'MN'},
    {'name':'Mississippi', 'abbrev':'MS'},      {'name':'Missouri', 'abbrev':'MO'},         {'name':'Montana', 'abbrev':'MT'},
    {'name':'Nebraska', 'abbrev':'NE'},         {'name':'Nevada', 'abbrev':'NV'},           {'name':'New Hampshire', 'abbrev':'NH'},
    {'name':'New Jersey', 'abbrev':'NJ'},       {'name':'New Mexico', 'abbrev':'NM'},       {'name':'New York', 'abbrev':'NY'},
    {'name':'North Carolina', 'abbrev':'NC'},   {'name':'North Dakota', 'abbrev':'ND'},     {'name':'Ohio', 'abbrev':'OH'},
    {'name':'Oklahoma', 'abbrev':'OK'},         {'name':'Oregon', 'abbrev':'OR'},           {'name':'Pennsylvania', 'abbrev':'PA'},
    {'name':'Rhode Island', 'abbrev':'RI'},     {'name':'South Carolina', 'abbrev':'SC'},   {'name':'South Dakota', 'abbrev':'SD'},
    {'name':'Tennessee', 'abbrev':'TN'},        {'name':'Texas', 'abbrev':'TX'},            {'name':'Utah', 'abbrev':'UT'},
    {'name':'Vermont', 'abbrev':'VT'},          {'name':'Virginia', 'abbrev':'VA'},         {'name':'Washington', 'abbrev':'WA'},
    {'name':'West Virginia', 'abbrev':'WV'},    {'name':'Wisconsin', 'abbrev':'WI'},        {'name':'Wyoming', 'abbrev':'WY'}
    ];
  if (type === "abbr") {
  return ($.grep(states, function (n, i) {
      return n.abbrev === state;
    }))[0].name;
  } else {
    return ($.grep(states, function (n, i) {
      return n.name.toUpperCase() === state;
    }))[0].abbrev;
  };
};

$(document).ready(function () {
  var chartdata = [];
  var type_all = [];
  var type_states = [];
  var type_occ = [];
  var type_industry = [];
  var type_stateOcc = [];
  var type_stateInd = [];

  /* For drilldown data */
  var sub_state = [];
  var sub_industry = [];
  var sub_occ = [];
  /***/
  var xcat = [];

  var last_period = "12/01/2016";
  var str_industry = "";
  var str_occ = "";
  var str_state = "";

  var allLine = [];
  /* for drilldown series */
  var stateLine, occLine, industryLine;
  var mapEd = [];
  var mapInd = [], mapIndUniq = [];
  var mapOcc = [], mapOccUniq = [];

  /* for changes */
  var nat_alledchgs, states_alledchgs, industry_alledchgs, occ_alledchgs;

  var bar_edstates, bar_edocc, bar_edindustry;

  var edColorList = ["#55B209", "#FF5319", "#122DB8"];
  var indColorList = ["#99ccff", "#3399ff", "#0073e6", "#0059b3", "#004d99"];
  var occColorList = ["#ffdd99", "#ffb31a", "#b37700", "#664400", "#332200"];
  /* labels */
  var lblhs = "High school or less";
  var lblaa = "Some college or Associate's degree";
  var lblba = "Bachelor's or advanced degree";
  var lbled = [lblhs, lblaa, lblba];

  var lbldatahs = "HS or less";
  var lbldataaa = "Some college/AA";
  var lbldataba = "BA+";
  var lbldataed = [lbldatahs, lbldataaa, lbldataba];

  var map_chgs = [];

  /* Helper function to create data series for charts */
  function fillLineData (subdata) {
    var tempLine1 = [], tempLine2 = [], tempLine3 = [];
    $.each(subdata, function(items, item) {
      if (item.education === lbldatahs) {
        tempLine1.push(item.chg);
      }
      else if (item.education === lbldataaa) {
        tempLine2.push(item.chg);
      }
      else if (item.education === lbldataba) {
        tempLine3.push(item.chg);
      };
    });
    return [{"name": lblhs, "data": tempLine1, "visible": false, "color": edColorList[0]},
      {"name": lblaa, "data": tempLine2, "color": edColorList[1]},
      {"name": lblba, "data": tempLine3, "visible": false, "color": edColorList[2]}];
  };

  function subsetdata() {
    type_all = $.grep(chartdata, function (n,i) {
      return (n.type === 25);
    });
    type_states = $.grep(chartdata, function (n,i) {
      return (n.type === 57);
    });
    type_occ = $.grep(chartdata, function (n,i) {
      return (n.type === 27);
    });
    type_industry = $.grep(chartdata, function (n,i) {
      return (n.type === 29);
    });
    type_stateOcc = $.grep(chartdata, function (n,i) {
      return (n.type === 58);
    });
    type_stateInd = $.grep(chartdata, function (n,i) {
      return (n.type === 60);
    });
    states_alledchgs = $.grep(type_states, function (n,i) {
      return (n.period === last_period);
    });
    occ_alledchgs = $.grep(type_occ, function (n,i) {
      return (n.period === last_period);
    });
    industry_alledchgs = $.grep(type_industry, function (n,i) {
      return (n.period === last_period);
    });
  };

  function createSeries() {
    var temp1 = [], temp2 = [], temp3 = [];

    allLine = fillLineData(type_all);

    $.each(states_alledchgs, function(items, item) {
      if (item.education === lbldataaa) {
        map_chgs.push({'state': item.state, 'value': item.pctchg});
      };
    });
    nat_alledchgs = $.grep(type_all, function (n,i){
      return (n.period === last_period);
    });

    function addUS() {
      $.each(nat_alledchgs, function (items, item) {
        if (item.education === lbldataaa) {
          temp2.push({name: "US", y: item.pctchg, color: "#BF0B23"});
        } else if (item.education === lbldataba) {
          temp3.push({name: "US", y: item.pctchg, color: "#BF0B23"});
        } else if (item.education === lbldatahs) {
          temp1.push({name: "US", y: item.pctchg, color: "#BF0B23"});
        };
      });
    };

    $.each(states_alledchgs, function(items, item) {
      if (item.education === lbldataaa) {
        temp2.push({name: item.state, y:item.pctchg});
      } else if (item.education === lbldataba) {
        temp3.push({name: item.state, y:item.pctchg});
      } else if (item.education === lbldatahs) {
        temp1.push({name: item.state, y:item.pctchg});
      };
    });
    addUS();
    bar_edstates = [{"name": lblhs, "data": temp1, "visible": false, color: edColorList[0]},
      {"name": lblaa, "data": temp2, "visible": true, color: edColorList[1]},
      {"name": lblba, "data": temp3, "visible": false, color: edColorList[2]}];

    /*
    console.log(bar_edstates[0].data.sort(function (a, b) {
      return a.y - b.y;
    }));
    */
    $.each(bar_edstates, function (items, item) {
      item.data.sort(function (a, b) {
        return b.y - a.y;
      });
    });

    temp1 = [], temp2 = [], temp3 = [];

    $.each(occ_alledchgs, function(items, item) {
      if (item.education === lbldataaa) {
        temp2.push({name: item.occupation, y: item.pctchg})
      } else if (item.education === lbldataba) {
        temp3.push({name: item.occupation, y: item.pctchg})
      } else if (item.education === lbldatahs) {
        temp1.push({name: item.occupation, y: item.pctchg})
      };
    });
    addUS();
    bar_edocc = [{"name": lblhs, "data": temp1, "visible": false, color: edColorList[0]},
      {"name": lblaa, "data": temp2, "visible": true, color: edColorList[1]},
      {"name": lblba, "data": temp3, "visible": false, color: edColorList[2]}];
    $.each(bar_edocc, function (items, item) {
      item.data.sort(function (a, b) {
        return b.y - a.y;
      });
    });

    temp1 = [], temp2 = [], temp3 = [];

    $.each(industry_alledchgs, function(items, item) {
      if (item.education === lbldataaa) {
        temp2.push({name: item.industry, y: item.pctchg})
      } else if (item.education === lbldataba) {
        temp3.push({name: item.industry, y: item.pctchg})
      } else if (item.education === lbldatahs) {
        temp1.push({name: item.industry, y: item.pctchg})
      };
    });
    addUS();
    bar_edindustry = [{"name": lblhs, "data": temp1, "visible": false, color: edColorList[0]},
      {"name": lblaa, "data": temp2, "visible": true, color: edColorList[1]},
      {"name": lblba, "data": temp3, "visible": false, color: edColorList[2]}];
    $.each(bar_edindustry, function (items, item) {
      item.data.sort(function (a, b) {
        return b.y - a.y;
      });
    });

    $.each(type_stateInd, function (items, item) {
      mapIndUniq.push(item.industry);
    });
    $.each(type_stateOcc, function (items, item) {
      mapOccUniq.push(item.occupation);
    });

    mapIndUniq = $.unique(mapIndUniq);
    mapOccUniq = $.unique(mapOccUniq);

  }

  function createStateDrilldown(tcriteria) {
    sub_state = $.grep(type_states, function (n, i) {
      return (n.state === tcriteria);
    });
    stateLine = fillLineData(sub_state);
  }

  function createOccDrilldown(tcriteria) {
    sub_occ = $.grep(type_occ, function (n, i) {
      return (n.occupation === tcriteria);
    });
    occLine = fillLineData(sub_occ);
  }

  function createIndustryDrilldown(tcriteria) {
    sub_industry = $.grep(type_industry, function (n, i) {
      return (n.industry === tcriteria);
    });
    industryLine = fillLineData(sub_industry);
  }

  function clickState () {
      str_state = this.category;
      if (str_state !== "US") {
        createStateDrilldown(str_state);
        drillChartsSt("#state_trend", "Employment changes for " + state_lookup("abbr", str_state), xcat, stateLine);
      } else {
        drillChartsSt("#state_trend", "Employment changes for " + str_state, xcat, allLine);
      }
  }

  function clickOcc () {
    str_occ = this.category;
    if (str_occ !== "US") {
      createOccDrilldown(str_occ);
      drillChartsOcc("#occ_trend", "Employment changes for " + str_occ + " occupations", xcat, occLine);
    } else {
      drillChartsOcc("#occ_trend", "Employment changes for " + str_occ, xcat, allLine);
    }
  }

  function clickIndustry () {
    str_industry = this.category;
    if (str_industry !== "US") {
      createIndustryDrilldown(str_industry);
      drillChartsInd("#industry_trend", "Employment changes for " + str_industry + " industry", xcat, industryLine);
    } else {
      drillChartsInd("#industry_trend", "Employment changes for " + str_industry, xcat, allLine);
    }
  }

  function changeCharts (tdiv, ttitle, tstitle, tcat, tseries, tfunction) {
    var bseries, bcat = [], bdata = [], bcolor;
    if (tcat === "aa") {
      bcolor = edColorList[1];
      bseries = $.grep(tseries, function (n, i) {
        return n.name === lblaa;
      });
    } else if (tcat === "hs") {
      bcolor = edColorList[0];
      bseries = $.grep(tseries, function (n, i) {
        return n.name === lblhs;
      });
    } else if (tcat === "ba") {
      bcolor = edColorList[2];
      bseries = $.grep(tseries, function (n, i) {
        return n.name === lblba;
      });
    };
    $.each(bseries[0].data, function (n, i) {
      bcat.push(bseries[0].data[n].name);
      if (bseries[0].data[n].name === "US") {
        bdata.push({y: bseries[0].data[n].y, color: "red"});
      } else {
        bdata.push({y: bseries[0].data[n].y, color: bcolor});
      }
    });

    $(tdiv).highcharts({
        chart: {
          type: 'bar'
        },
        title: {
            text: ttitle
        },
        subtitle: {
          text: tstitle
        },
        xAxis: {
          /* type: "category",*/
          categories: bcat,
          title: {
              text: null
          }
        },
        yAxis: {
            title: {
              text: null,
              align: 'high'
          },
          labels: {
            enabled: false
          }
        },
        tooltip: {
          valueSuffix: ' %',
          formatter: function() {
            return "<b>" + this.x + ": </b>" + this.y.toFixed(1) + ' %' + "<br>Click to see change over time.";
          }
        },
        plotOptions: {
          bar: {
            dataLabels: {
              enabled: true,
              formatter: function() {
                return this.y.toFixed(1) + ' %';
              }
            }
          },
          series: {
            point: {
              events: {
                click: tfunction
              }
            }
          }
        },
        legend: {
          enabled: false
        },
        credits: {
          enabled: false
        },
        series:
        [{
          name: null,
          data: bdata
        }]
      });

  }

  function drillCharts(tdiv, ttitle, txcat, tdata) {
    $(tdiv).highcharts({
      title: {
        text: ttitle
      },
      xAxis: {
        categories: txcat
      },
      yAxis: {
        title: {
          text: ''
        },
        plotLines: [{
          value: 0,
          width: 1,
          color: '#808080'
        }]
      },
      credits: {
        text: "Click on legend to view or toggle data series"
      },
      tooltip: {
        formatter: function () {
          return ('<span style="font-size: 80%">' + this.x + '</span>' +
            '<br><span style="color:'+ this.series.color +'">\u25CF</span> ' + this.series.name + ": " +
            '<b>' + Math.round(this.y/1e3) + "K<b>");
        }
      },
      series: tdata
    });

  }

  function drillChartsSt(tdivSt, ttitleSt, txcatSt, tdataSt) {
    if ($('input[name = "optradiost"]:checked').val() === "hs") {
      $.each(tdataSt, function (i, n) {
        if (n.name === lblhs) {
          n.visible = true;
        } else {
          n.visible = false;
        };
      });
    } else if ($('input[name = "optradiost"]:checked').val() === "sc") {
      $.each(tdataSt, function (i, n) {
        if (n.name === lblaa) {
          n.visible = true;
        } else {
          n.visible = false;
        };
      });
    } else if ($('input[name = "optradiost"]:checked').val() === "ba") {
      $.each(tdataSt, function (i, n) {
        if (n.name === lblba) {
          n.visible = true;
        } else {
          n.visible = false;
        };
      });
    };
    drillCharts(tdivSt, ttitleSt, txcatSt, tdataSt);
  };

  function drillChartsOcc(tdivOcc, ttitleOcc, txcatOcc, tdataOcc) {
    if ($('input[name = "optradioocc"]:checked').val() === "hs") {
      $.each(tdataOcc, function (i, n) {
        if (n.name === lblhs) {
          n.visible = true;
        } else {
          n.visible = false;
        };
      });
    } else if ($('input[name = "optradioocc"]:checked').val() === "sc") {
      $.each(tdataOcc, function (i, n) {
        if (n.name === lblaa) {
          n.visible = true;
        } else {
          n.visible = false;
        };
      });
    } else if ($('input[name = "optradioocc"]:checked').val() === "ba") {
      $.each(tdataOcc, function (i, n) {
        if (n.name === lblba) {
          n.visible = true;
        } else {
          n.visible = false;
        };
      });
    };
    drillCharts(tdivOcc, ttitleOcc, txcatOcc, tdataOcc);
  };

  function drillChartsInd(tdivInd, ttitleInd, txcatInd, tdataInd) {
    if ($('input[name = "optradioind"]:checked').val() === "hs") {
      $.each(tdataInd, function (i, n) {
        if (n.name === lblhs) {
          n.visible = true;
        } else {
          n.visible = false;
        };
      });
    } else if ($('input[name = "optradioind"]:checked').val() === "sc") {
      $.each(tdataInd, function (i, n) {
        if (n.name === lblaa) {
          n.visible = true;
        } else {
          n.visible = false;
        };
      });
    } else if ($('input[name = "optradioind"]:checked').val() === "ba") {
      $.each(tdataInd, function (i, n) {
        if (n.name === lblba) {
          n.visible = true;
        } else {
          n.visible = false;
        };
      });
    };
    drillCharts(tdivInd, ttitleInd, txcatInd, tdataInd);
  };

  function drillMap(pstateabbr) {
    var tmpEd, tmpInd, tmpOcc, tmpMap;
    mapEd = [], mapInd = [], mapOcc = [];
    tmpEd = $.grep(type_states, function (n, i) {
      return n.state === pstateabbr;
    });
    tmpInd = $.grep(type_stateInd, function (n, i) {
      return n.state === pstateabbr;
    });
    tmpOcc = $.grep(type_stateOcc, function (n, i) {
      return n.state === pstateabbr;
    });
    $.each(lbldataed, function(n, i) {
      tmpMap = {name: lbled[n], data: [], color: edColorList[n]};
      $.each(tmpEd, function (items, item) {
        if (item.education === lbldataed[n]) {
          tmpMap['data'].push(item.pctchg);
        };
      });
      mapEd.push(tmpMap);
    });
    $.each(mapIndUniq, function (n, i) {
      tmpMap = {name: mapIndUniq[n], data: [], color: indColorList[n]};
      $.each(tmpInd, function (items, item) {
        if (item.industry === mapIndUniq[n]) {
          tmpMap['data'].push(item.pctchg);
        };
      });
      mapInd.push(tmpMap);
    });
    $.each(mapOccUniq, function (n, i) {
      tmpMap = {name: mapOccUniq[n], data: [], color: occColorList[n]};
      $.each(tmpOcc, function (items, item) {
        if (item.occupation === mapOccUniq[n]) {
          tmpMap['data'].push(item.pctchg);
        };
      });
      mapOcc.push(tmpMap);
    });

    $("#mapModal").modal('show');
    $("#modal-title").html("Dashboard for " + state_lookup("abbr", pstateabbr));
    $("#modal-ed").highcharts({
      title: {
        text: "Educational attainment"
      },
      xAxis: {
        categories: xcat
      },
      yAxis: {
        title: {
          text: ''
        },
        plotLines: [{
          value: 0,
          width: 1,
          color: '#808080'
        }]
      },
      credits: {
        enabled: false
      },
      tooltip: {
        formatter: function () {
          return ('<span style="font-size: 80%">' + this.x + '</span>' +
            '<br><span style="color:'+ this.series.color +'">\u25CF</span> ' + this.series.name + ": " +
            '<b>' + this.y.toFixed(1) + "%<b>");
        }
      },
      series: mapEd
    });
    $("#modal-ind").highcharts({
      title: {
        text: "Industries"
      },
      xAxis: {
        categories: xcat
      },
      yAxis: {
        title: {
          text: ''
        },
        plotLines: [{
          value: 0,
          width: 1,
          color: '#808080'
        }]
      },
      credits: {
        enabled: false
      },
      tooltip: {
        formatter: function () {
          return ('<span style="font-size: 80%">' + this.x + '</span>' +
            '<br><span style="color:'+ this.series.color +'">\u25CF</span> ' + this.series.name + ": " +
            '<b>' + this.y.toFixed(1) + "%<b>");
        }
      },
      series: mapInd
    });
    $("#modal-occ").highcharts({
      title: {
        text: "Occupations"
      },
      xAxis: {
        categories: xcat
      },
      yAxis: {
        title: {
          text: ''
        },
        plotLines: [{
          value: 0,
          width: 1,
          color: '#808080'
        }]
      },
      credits: {
        enabled: false
      },
      tooltip: {
        formatter: function () {
          return ('<span style="font-size: 80%">' + this.x + '</span>' +
            '<br><span style="color:'+ this.series.color +'">\u25CF</span> ' + this.series.name + ": " +
            '<b>' + this.y.toFixed(1) + "%<b>");
        }
      },
      series: mapOcc
    });

  };

  function drawMap(mdata, mtitle) {
    $('#map_state').highcharts('Map', {
        chart: {
          borderWidth : 1
        },
        title: {
          text : "Employment changes since 2007 (%)"
        },
        subtitle: {
          text: mtitle
        },
        colorAxis: {
          minColor: "#FFFFFF" /* "#efecf3" */,
          maxColor:  "#011e41" /* "#990041" */
        },
        legend: {
          /*
          title: {
            text: "Percent change"
          }, */
          layout: 'horizontal',
          borderWidth: 0,
          backgroundColor: 'rgba(255,255,255,0.85)',
          floating: true,
          verticalAlign: 'top',
          y: 55
        },
        mapNavigation: {
          enabled: true
        },
        credits: {
          enabled: false
        },
        plotOptions: {
          series: {
            point: {
              events: {
                click: function () {
                  //console.log(this.name);
                  //console.log(this['postal-code']);
                  drillMap(this['postal-code']);
                }
              }
            }
          }
        },
        series : [{
          animation: {
            duration: 1000
            },
          data : mdata,
          mapData: Highcharts.maps['countries/us/us-all'],
          joinBy: ['postal-code', 'state'],
          dataLabels: {
              enabled: false /*,
              color: '#FFFFFF',
              format: '{point.state}' */
            },
            name: 'Change in employment (%)',
            states: {
              hover: {
                color: '#a36580'
              }
            },
            tooltip: {
              pointFormat: '{point.postal-code}: {point.value:.1f}' + " % <br> Click for dashboard"
            }
        }]
    });
  };

  function drawCharts() {
    $('#intro').highcharts({
      title: {
        text: "Workers with some college or Associate's degrees have increased since 2007"
      },
      xAxis: {
        categories: xcat
      },
      yAxis: {
        title: {
          text: ''
        },
        plotLines: [{
          value: 0,
          width: 1,
          color: '#808080'
        }]
      },
      credits: {
        text: "Click on legend to view or toggle data series"
      },
      tooltip: {
        formatter: function () {
          return ('<span style="font-size: 80%">' + this.x + '</span>' +
            '<br><span style="color:'+ this.series.color +'">\u25CF</span> ' + this.series.name + ": " +
            '<b>' + Math.round(this.y/1e6) + "M<b>");
        }
      },
      useHTML: true,
      series: allLine
    });

    changeCharts('#state_chg', "State rankings: Employment changes", lblaa, "aa", bar_edstates, clickState);
    changeCharts('#occ_chg', "Occupation rankings: Employment changes", lblaa, "aa", bar_edocc, clickOcc);
    changeCharts('#industry_chg', "Industry rankings: Employment changes", lblaa, "aa", bar_edindustry, clickIndustry);

    str_state = bar_edstates[1].data[0].name;
    createStateDrilldown(str_state);
    drillCharts("#state_trend", "Employment changes for " + state_lookup("abbr", str_state), xcat, stateLine);

    str_occ = bar_edocc[1].data[0].name;
    createOccDrilldown(str_occ);
    drillCharts("#occ_trend", "Employment changes for " + str_occ + " occupations", xcat, occLine);

    str_industry = bar_edindustry[1].data[0].name;
    createIndustryDrilldown(str_industry);
    drillCharts("#industry_trend", "Employment changes for " + str_industry + " industry", xcat, industryLine);

    drawMap(map_chgs, lblaa);

  };

  $.get('cps_mth_ind_occ.txt', function (idata, status) {
      var lines = idata.split('\n');

      $.each(lines, function(lineNo, line) {
        var items = line.split('\t');
        if (lineNo > 0) {
          pushData(chartdata, items);
        }
      });

      subsetdata();
      createSeries();

      $.each(type_all, function(items, item) {
        xcat.push(item.period);
      });
      drawCharts();
    });

    $('input[name = "optradiost"]').on("click change", function (e) {
      if (e.target.value === "hs") {
        changeCharts('#state_chg', "State rankings: Employment changes", lblhs, "hs", bar_edstates, clickState);
        if (str_state !== "US") {
          $.each(stateLine, function (n, i) {
            if (i.name === lblhs) {
              i.visible = true;
            } else {
              i.visible = false;
            }
          })
          drillChartsSt("#state_trend", "Employment changes for " + state_lookup("abbr", str_state), xcat, stateLine);
        } else {
          drillChartsSt("#state_trend", "Employment changes for " + str_state, xcat, allLine);
        }
      } else if (e.target.value === "sc") {
        changeCharts('#state_chg', "State rankings: Employment changes", lblaa, "aa", bar_edstates, clickState);
        if (str_state !== "US") {
          $.each(stateLine, function (n, i) {
            if (i.name === lblaa) {
              i.visible = true;
            } else {
              i.visible = false;
            }
          })
          drillChartsSt("#state_trend", "Employment changes for " + state_lookup("abbr", str_state), xcat, stateLine);
        } else {
          drillChartsSt("#state_trend", "Employment changes for " + str_state, xcat, allLine);
        }
      } else if (e.target.value === "ba") {
        changeCharts('#state_chg', "State rankings: Employment changes", lblba, "ba", bar_edstates, clickState);
        if (str_state !== "US") {
          $.each(stateLine, function (n, i) {
            if (i.name === lblba) {
              i.visible = true;
            } else {
              i.visible = false;
            }
          })
          drillChartsSt("#state_trend", "Employment changes for " + state_lookup("abbr", str_state), xcat, stateLine);
        } else {
          drillChartsSt("#state_trend", "Employment changes for " + str_state, xcat, allLine);
        }
      };
    });
    $('input[name = "optradioocc"]').on("click change", function (e) {
      if (e.target.value === "hs") {
        changeCharts('#occ_chg', "Occupation rankings: Employment changes", lblhs, "hs", bar_edocc, clickOcc);
        if (str_occ !== "US") {
          $.each(occLine, function (n, i) {
            if (i.name === lblhs) {
              i.visible = true;
            } else {
              i.visible = false;
            }
          })
          drillChartsOcc("#occ_trend", "Employment changes for " + str_occ + " occupations", xcat, occLine);
        } else {
          drillChartsOcc("#occ_trend", "Employment changes for " + str_occ, xcat, allLine);
        }
      } else if (e.target.value === "sc") {
        changeCharts('#occ_chg', "Occupation rankings: Employment changes", lblaa, "aa", bar_edocc, clickOcc);
        if (str_occ !== "US") {
          $.each(occLine, function (n, i) {
            if (i.name === lblaa) {
              i.visible = true;
            } else {
              i.visible = false;
            }
          })
          drillChartsOcc("#occ_trend", "Employment changes for " + str_occ + " occupations", xcat, occLine);
        } else {
          drillChartsOcc("#occ_trend", "Employment changes for " + str_occ, xcat, allLine);
        }
      } else if (e.target.value === "ba") {
        changeCharts('#occ_chg', "Occupation rankings: Employment changes", lblba, "ba", bar_edocc, clickOcc);
        if (str_occ !== "US") {
          $.each(occLine, function (n, i) {
            if (i.name === lblba) {
              i.visible = true;
            } else {
              i.visible = false;
            }
          })
          drillChartsOcc("#occ_trend", "Employment changes for " + str_occ + " occupations", xcat, occLine);
        } else {
          drillChartsOcc("#occ_trend", "Employment changes for " + str_occ, xcat, allLine);
        }
      };
    });
    $('input[name = "optradioind"]').on("click change", function (e) {
      if (e.target.value === "hs") {
        changeCharts('#industry_chg', "Industry rankings: Employment changes", lblhs, "hs", bar_edindustry, clickIndustry);
        if (str_industry !== "US") {
          $.each(industryLine, function (n, i) {
            if (i.name === lblhs) {
              i.visible = true;
            } else {
              i.visible = false;
            }
          })
          drillChartsInd("#industry_trend", "Employment changes for " + str_industry + " industry", xcat, industryLine);
        } else {
          drillChartsInd("#industry_trend", "Employment changes for " + str_industry, xcat, allLine);
        }
      } else if (e.target.value === "sc") {
        changeCharts('#industry_chg', "Industry rankings: Employment changes", lblaa, "aa", bar_edindustry, clickIndustry);
        if (str_industry !== "US") {
          $.each(industryLine, function (n, i) {
            if (i.name === lblaa) {
              i.visible = true;
            } else {
              i.visible = false;
            }
          })
          drillChartsInd("#industry_trend", "Employment changes for " + str_industry + " industry", xcat, industryLine);
        } else {
          drillChartsInd("#industry_trend", "Employment changes for " + str_industry, xcat, allLine);
        }
      } else if (e.target.value === "ba") {
        changeCharts('#industry_chg', "Industry rankings: Employment changes", lblba, "ba", bar_edindustry, clickIndustry);
        if (str_industry !== "US") {
          $.each(industryLine, function (n, i) {
            if (i.name === lblba) {
              i.visible = true;
            } else {
              i.visible = false;
            }
          })
          drillChartsInd("#industry_trend", "Employment changes for " + str_industry + " industry", xcat, industryLine);
        } else {
          drillChartsInd("#industry_trend", "Employment changes for " + str_industry, xcat, allLine);
        }
      };
    });
    $('input[name = "optradiomap"]').on("click change", function (e) {
      if (e.target.value === "hs") {
        map_chgs = [];
        $.each(states_alledchgs, function(items, item) {
          if (item.education === lbldatahs) {
            map_chgs.push({'state': item.state, 'value': item.pctchg});
          };
        });
        drawMap(map_chgs, lblhs);
      } else if (e.target.value === "sc") {
          map_chgs = [];
          $.each(states_alledchgs, function(items, item) {
            if (item.education === lbldataaa) {
              map_chgs.push({'state': item.state, 'value': item.pctchg});
            };
          });
          drawMap(map_chgs, lblaa);
      } else if (e.target.value === "ba") {
        map_chgs = [];
        $.each(states_alledchgs, function(items, item) {
          if (item.education === lbldataba) {
            map_chgs.push({'state': item.state, 'value': item.pctchg});
          };
        });
        drawMap(map_chgs, lblba);
      };
    });
});
