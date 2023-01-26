import { baseChart } from "config/charts/basechart.js";

const productionDetailsTodayChartOptions = Object.assign(structuredClone(baseChart), {
  fill: {
    type: "solid",
    opacity: 0.7,
  },
});

productionDetailsTodayChartOptions.stroke.width = 0;
productionDetailsTodayChartOptions.chart.stacked = true;
productionDetailsTodayChartOptions.yaxis.min = (min) => min < 0 ? min : 0;
export { productionDetailsTodayChartOptions };
