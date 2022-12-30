const log = (type: string, t: string) => {
    let fn;
    if (type==="log") fn = console.log;
    else if (type==="info") fn = console.info;
    else if (type==="error") fn = console.error;
    else throw new Error("Invalid log type, cannot log: " + t);
    if (fn) fn(new Date().toLocaleString("sv-SE"), "Backend:", t);
};

export { log };