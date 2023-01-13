const productionTodayChartOptions = {
  chart: {
    foreColor: "#ccc",
    toolbar: {
      show: false,
    },
    height: 300,
  },  
  xaxis: {
    type: "datetime",
    labels: {
      datetimeUTC: false,
    },
  },
  yaxis: {
    forceNiceScale: true,
  },
  legend: {
    show: true,
  },
  stroke: {
    width: 0,
    colors: ["#E0FF18", "#18FF7C", "#1890FF", "#E819FF", "#E01847"],
    opacity: 0,
    curve: "stepline",
  },
  fill: {
    type: 'solid',
    colors: [ "#1890FF", "#E0FF18", "#18FF7C",, "#E819FF", "#E01847"],
    opacity:0.75,
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    theme: "dark",
    followCursor: true,
    x: {
      format: "yyyy-MM-dd hh:mm:ss",
    },
  },
  grid: {
    borderColor: "#535A6C",
  },
};

export { productionTodayChartOptions };
