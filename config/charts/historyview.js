const historyChartOptions = {
  chart: {
    foreColor: "#ccc",
    toolbar: {
      show: false,
    },
    height: 300,
  },
  colors: ["rgba(224, 255, 24, 0.7)", "rgba(24, 255, 124, 0.7)", "rgba(24, 144, 255, 0.7)", "rgba(232, 24, 255, 0.7)", "rgba(224, 24, 71, 0.7)"],
  xaxis: {
    type: "datetime",
    labels: {
      datetimeUTC: false,
    },
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
  },
  legend: {
    show: true,
  },
  stroke: {
    width: 2,
    curve: "smooth",
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    theme: "dark",
    followCursor: true,
    x: {
      format: "yyyy MM dd",
    },
  },
  grid: {
    borderColor: "#535A6C",
  },
};

export { historyChartOptions };
