const tableChartOptions = {
  series: [],
  chart: {
    foreColor: "#ccc",
    toolbar: {
      show: false,
    },
    height: 300,
    animations: {
      enabled: false
    }
  },
  colors: ["#54EF54"],
  xaxis: {
    type: "datetime",
    labels: {
      datetimeUTC: false,
    },
  },
  yaxis: {
    title: {
      text: "Electricity price",
    },
    min: 0,
  },
  legend: {
    position: "top",
    horizontalAlign: "right",
    showForSingleSeries: true,
    show: true,
    floating: true,
    offsetY: -25,
    offsetX: -5,
  },
  stroke: {
    width: 3,
    curve: "smooth",
  },
  dataLabels: {
    enabled: false,
  },
  fill: {
    type: "gradient",
    gradient: {
      shade: "dark",
      gradientToColors: ["#FD4835"],
      shadeIntensity: 1,
      type: "vertical",
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 100],
    },
  },
  tooltip: {
    theme: "dark",
    x: {
      format: "yyyy MM dd HH:mm",
    },
  },
  grid: {
    borderColor: "#535A6C",
  },
};

export { tableChartOptions };
