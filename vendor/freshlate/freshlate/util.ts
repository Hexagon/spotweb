/**
 * Flatten an object into a single level using dot notation
 * @param obj Object to flatten
 * @param cur_key Current key if has recursed
 * @returns Flattened object using dot notation
 * @example flattenObject({a: {b: {c: 'd'}}}) // {a.b.c: 'd'}
 * @example flattenObject({a: [{b: 'c'}]}) // {a.0.b: 'c'}
 * @example flattenObject({a: [{b: {c: 'd'}}, 'e']}) // {a.0.b.c: 'd', a.1: 'e'}
 */
export const flattenObject = (
  obj: Record<string, unknown>,
  cur_key = "",
): Record<string, string> => {
  const flattened: Record<string, string> = {};

  const handleTypes = (val: unknown, key = "") => {
    if (Array.isArray(val)) {
      val.forEach((item, index) => {
        handleTypes(item, `${key}.${index}`);
      });
    } else if (typeof val === "object") {
      Object.assign(
        flattened,
        flattenObject(val as Record<string, unknown>, key),
      );
    } else {
      flattened[key] = val as string;
    }
  };

  Object.keys(obj).forEach((key: string) => {
    const val = obj[key];

    handleTypes(val, `${cur_key}${cur_key ? "." : ""}${key}`);
  });

  return flattened;
};

/**
 * Get a nested key value from an object
 * @param obj Object to get the nested key of
 * @param key Key to get the value of
 * @returns The value of the nested key or undefined
 */
export const getNestedKeyValue = (
  obj: Record<string, unknown>,
  key: string,
): unknown | undefined => {
  const keys = key.split(".");
  let cur_obj = obj;

  for (let i = 0; i < keys.length; i++) {
    const cur_key = keys[i];
    if (cur_obj[cur_key] === undefined) {
      return undefined;
    } else {
      cur_obj = cur_obj[cur_key] as Record<string, unknown>;
    }
  }

  return cur_obj;
};
