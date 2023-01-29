import { baseChart } from "config/charts/basechart.js";

const productionTodayChartOptions = Object.assign(structuredClone(baseChart), {
  fill: {
    type: "solid",
    colors: ["#1890FF", "#E0FF18", "#18FF7C", , "#E819FF", "#E01847"],
    opacity: 0.75,
  },
});

productionTodayChartOptions.stroke.width = 0;

productionTodayChartOptions.yaxis.max = (max) => max > 0 ? max : 0;
productionTodayChartOptions.yaxis.min = (min) => min < 0 ? min : 0;

export { productionTodayChartOptions };
