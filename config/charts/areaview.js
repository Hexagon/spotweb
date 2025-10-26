import { baseChart } from "config/charts/basechart.js";

const areaViewChartOptions = Object.assign(structuredClone(baseChart), {
  colors: ["rgba(24, 255, 124, 1.0)", "rgba(96, 96, 196, 1.0)"],
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
  xaxis: {
    type: "datetime",
    tickAmount: 6,
    labels: {
      datetimeUTC: false,
      format: "HH:mm",
    },
  },
});

export { areaViewChartOptions };
