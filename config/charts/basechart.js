const baseChart = {
  chart: {
    foreColor: "#ccc",
    toolbar: {
      show: false,
    },
    height: 350,
    animations: {
      enabled: false,
    },
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
  },
  xaxis: {
    type: "datetime",
    labels: {
      datetimeUTC: false,
    },
  },
  legend: {
    show: true,
  },
  stroke: {
    width: 3,
    curve: "stepline",
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    theme: "dark",
    followCursor: true,
    x: {
      format: "yyyy MM dd HH:mm",
    },
  },
  grid: {
    borderColor: "#535A6C",
  },
};

export { baseChart };
