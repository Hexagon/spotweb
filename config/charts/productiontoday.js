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
    width: 3,
    colors: ["#E0FF18", "#18FF7C", "#1890FF", "#E819FF", "#E01847"],
    opacity: 0.7,
    curve: "stepline",
  },
  fill: {
    type: 'solid',
    colors: ["#E0FF18", "#18FF7C", "#1890FF", "#E819FF", "#E01847"],
    opacity:0.1,
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
