import { baseChart } from "./basechart.js";

const historyChartOptions = Object.assign(structuredClone(baseChart), {
  colors: ["rgba(224, 255, 24, 0.7)", "rgba(24, 255, 124, 0.7)", "rgba(24, 144, 255, 0.7)", "rgba(232, 24, 255, 0.7)", "rgba(224, 24, 71, 0.7)"],
});

historyChartOptions.stroke.curve = "smooth";
historyChartOptions.tooltip.x.format = "yyyy MM dd";

export { historyChartOptions };
