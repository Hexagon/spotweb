import { baseChart } from "config/charts/basechart.js";

const tableChartOptions = Object.assign(structuredClone(baseChart), {
  colors: ["#54EF54"],
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
});

tableChartOptions.stroke.curve = "smooth";

export { tableChartOptions };
