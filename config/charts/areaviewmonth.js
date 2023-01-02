const areaViewMonthChartOptions = {
  chart: {
    foreColor: "#ccc",
    toolbar: {
      show: false,
    },
    height: 300,
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
  colors: ["rgba(24, 255, 124, 1.0)", "rgba(79, 96, 255, 0.7)"],
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

export { areaViewMonthChartOptions };
