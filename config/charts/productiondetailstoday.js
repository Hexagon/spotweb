const productionDetailsTodayChartOptions = {
  chart: {
    foreColor: "#ccc",
    toolbar: {
      show: false,
    },
    height: 300,
    type: "bar",
    stacked: true,
  },
  xaxis: {
    type: "datetime",
    labels: {
      datetimeUTC: false,
    },
  },
  yaxis: {
    forceNiceScale: true,
    min: (min) => min < 0 ? min : 0,
  },
  legend: {
    show: true,
  },
  fill: {
    type: "solid",
    opacity: 0.7,
  },
  stroke: {
    width: 0,
    opacity: 1,
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    theme: "dark",
    followCursor: true,
    x: {
      format: "yyyy-MM-dd HH:mm",
    },
  },
  grid: {
    borderColor: "#535A6C",
  },
};

export { productionDetailsTodayChartOptions };
