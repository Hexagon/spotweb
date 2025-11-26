let level = "normal";

const setLevel = (requestedLevel: string) => {
  level = requestedLevel;
};

const log = (type: string, t: string) => {
  if (type == "debug" && level != "debug") return;
  let fn;
  if (type === "log") fn = console.log;
  else if (type === "info") fn = console.info;
  else if (type === "error") fn = console.error;
  else if (type === "debug") fn = console.debug;
  else throw new Error("Invalid log type, cannot log: " + t);
  if (fn) {
    fn(t);
  }
};

export { log, setLevel };
