const areaViewChartOptions = {
  chart: {
    foreColor: "#ccc",
    toolbar: {
      show: false,
    },
    height: 350,
  },
  fill: {
    type: "gradient",
    gradient: {
      shade: "dark",
      gradientToColors: ["#FF3815"],
      shadeIntensity: 1,
      type: "vertical",
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 100],
    },
  },
  colors: ["rgba(24, 255, 124, 1.0)", "rgba(96, 96, 196, 1.0)"],
  xaxis: {
    type: "category",
    tickAmount: 6,
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
  },
  legend: {
    show: false,
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

export { areaViewChartOptions };
