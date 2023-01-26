import { baseChart } from "config/charts/basechart.js";

const areaViewMonthChartOptions = Object.assign(structuredClone(baseChart), {
  colors: ["rgba(24, 255, 124, 1.0)", "rgba(79, 96, 255, 0.7)"],
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
  stroke: {
    width: 2,
    curve: "smooth",
  },
});

areaViewMonthChartOptions.tooltip.x.format = "yyyy MM dd";

export { areaViewMonthChartOptions };
