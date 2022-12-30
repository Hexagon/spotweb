const comparisonChartOptions = {
  series: [],
  chart: {
    foreColor: "#ccc",
    toolbar: {
      show: false,
    },
    height: 300,
    forceNiceScale: true,
  },
  colors: ["#54EF54", "#EF5454", "#5454EF", "#EF54EF"],
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
    position: "bottom",
    horizontalAlign: "right",
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
    x: {
      format: "yyyy MM dd HH:mm",
    },
  },
  grid: {
    borderColor: "#535A6C",
  },
};

export { comparisonChartOptions };
