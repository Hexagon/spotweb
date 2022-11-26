import { getNestedKeyValue } from "../util.ts";

/**
 * Regex to get the 1 (or 2) arguments of a function
 */
const DYN_ARG_REGEX =
  /(?<arg1>(?:str\s*:\s*\`(?<arg1_val_str>[^`]*)\`)|(?:key\s*:\s*(?:{(?<arg1_val_key>.*?)}))|(?:num\s*:\s*(?<arg1_val_num>[0-9]+(\.[0-9]+)?))|(?:bool\s*:\s*(?<arg1_val_bool>true|false|1|0)))(?:\s*,\s*(?<arg2>(?:str\s*:\s*\`(?<arg2_val_str>[^`]*)\`)|(?:key\s*:\s*(?:{(?<arg2_val_key>.*?)}))|(?:num\s*:\s*(?<arg2_val_num>[0-9]+(\.[0-9]+)?))|(?:bool\s*:\s*(?<arg2_val_bool>true|false|1|0))))?/s;

type ArgType = number | string;

const funcGT = (a: ArgType, b: ArgType) => a > b;
const funcGTE = (a: ArgType, b: ArgType) => a >= b;
const funcNGT = (a: ArgType, b: ArgType) => !funcGT(a, b);
const funcNGTE = (a: ArgType, b: ArgType) => !funcGTE(a, b);
const funcLT = (a: ArgType, b: ArgType) => a < b;
const funcLTE = (a: ArgType, b: ArgType) => a <= b;
const funcNLT = (a: ArgType, b: ArgType) => !funcLT(a, b);
const funcNLTE = (a: ArgType, b: ArgType) => !funcLTE(a, b);
const funcEQ = (a: ArgType | boolean, b: ArgType | boolean) => a === b;
const funcNEQ = (a: ArgType | boolean, b: ArgType | boolean) => a !== b;
const funcAND = (a: boolean, b: boolean) => a && b;
const funcBT = (a: ArgType, b: ArgType, c: ArgType) => funcGT(a, b) && funcLT(a, c);
const funcNBT = (a: ArgType, b: ArgType, c: ArgType) => !funcBT(a, b, c);
const funcIN = (a: ArgType, b: ArgType[] | string) => b.includes(a as string);
const funcNIN = (a: ArgType, b: ArgType[] | string) => !funcIN(a, b);
const funcOR = (a: boolean, b: boolean) => a || b;
const funcXOR = (a: boolean, b: boolean) => funcNEQ(a, b);

/**
 * A map of functions, how many args and their types they take, and their names
 */
export interface FUNCSMapType {
  [func_name: string]: {
    arg_count: number;
    arg_types: [
      ("num" | "str" | "bool" | "key")[],
      ("num" | "str" | "bool" | "key")[]?,
    ];
    // deno-lint-ignore no-explicit-any
    func: (...args: any) => boolean;
  };
}

export const FUNCS: FUNCSMapType = {
  GT: {
    arg_count: 1,
    arg_types: [["num", "str", "key"]],
    func: funcGT,
  },
  GTE: {
    arg_count: 1,
    arg_types: [["num", "str", "key"]],
    func: funcGTE,
  },
  NGT: {
    arg_count: 1,
    arg_types: [["num", "str", "key"]],
    func: funcNGT,
  },
  NGTE: {
    arg_count: 1,
    arg_types: [["num", "str", "key"]],
    func: funcNGTE,
  },
  LT: {
    arg_count: 1,
    arg_types: [["num", "str", "key"]],
    func: funcLT,
  },
  LTE: {
    arg_count: 1,
    arg_types: [["num", "str", "key"]],
    func: funcLTE,
  },
  NLT: {
    arg_count: 1,
    arg_types: [["num", "str", "key"]],
    func: funcNLT,
  },
  NLTE: {
    arg_count: 1,
    arg_types: [["num", "str", "key"]],
    func: funcNLTE,
  },
  EQ: {
    arg_count: 1,
    arg_types: [["num", "str", "key", "bool"]],
    func: funcEQ,
  },
  NEQ: {
    arg_count: 1,
    arg_types: [["num", "str", "key", "bool"]],
    func: funcNEQ,
  },
  BT: {
    arg_count: 2,
    arg_types: [
      ["num", "str", "key"],
      ["num", "str", "key"],
    ],
    func: funcBT,
  },
  NBT: {
    arg_count: 2,
    arg_types: [
      ["num", "str", "key"],
      ["num", "str", "key"],
    ],
    func: funcNBT,
  },
  IN: {
    arg_count: 1,
    arg_types: [["key"]],
    func: funcIN,
  },
  NIN: {
    arg_count: 1,
    arg_types: [["key"]],
    func: funcNIN,
  },
  AND: {
    arg_count: 1,
    arg_types: [["num", "str", "key", "bool"]],
    func: funcAND,
  },
  OR: {
    arg_count: 1,
    arg_types: [["num", "str", "key", "bool"]],
    func: funcOR,
  },
  XOR: {
    arg_count: 1,
    arg_types: [["num", "str", "key", "bool"]],
    func: funcXOR,
  },
};
export const FUNC_NAMES = Object.keys(FUNCS);

export const getFunctionParameters = (
  str: string,
  opts: Record<string, unknown> = {},
) => {
  // Execute the regex to get the arguments from the string
  const {
    arg1,
    arg1_val_str,
    arg1_val_key,
    arg1_val_num,
    arg1_val_bool,
    arg2,
    arg2_val_str,
    arg2_val_key,
    arg2_val_num,
    arg2_val_bool,
  } = (DYN_ARG_REGEX.exec(str) || { groups: {} }).groups as Partial<{
    arg1: string;
    arg1_val_str: string;
    arg1_val_key: string;
    arg1_val_num: string;
    arg1_val_bool: string;
    arg2: string;
    arg2_val_str: string;
    arg2_val_key: string;
    arg2_val_num: string;
    arg2_val_bool: string;
  }>;

  const args: (
    | { val: string | number | boolean; type: "str" | "num" | "bool" | "key" }
    | undefined
  )[] = [];

  if (arg1) {
    const type = arg1.split(":")[0] as "str" | "num" | "bool" | "key";
    let arg: string | number | boolean | undefined = undefined;

    // handle the different types of arguments
    if (type === "str" && arg1_val_str !== undefined) {
      arg = arg1_val_str;
    } else if (type === "key" && arg1_val_key !== undefined) {
      arg = getNestedKeyValue(opts, arg1_val_key as string) as
        | string
        | number
        | boolean
        | undefined;
    } else if (type === "num" && arg1_val_num !== undefined) {
      const tmp_num = arg1_val_num.includes(".") ? Number.parseFloat(arg1_val_num as string) : Number.parseInt(arg1_val_num as string);

      // If the argument isn't a valid number, discard it
      if (Number.isNaN(tmp_num)) {
        arg = undefined;
      } else {
        arg = tmp_num;
      }
    } else if (type === "bool" && arg1_val_bool !== undefined) {
      switch (arg1_val_bool) {
        case "true":
        case "1":
          arg = true;
          break;
        case "false":
        case "0":
          arg = false;
          break;
        default:
          arg = undefined;
          break;
      }
    }

    args.push(arg !== undefined ? { val: arg, type } : undefined);
  }

  // If the function requires a second (really third if you count
  // the comparison passed in at the beginning of the dynamic
  // replacer) argument, parse it from the provided ar2 variables
  // from the regex
  if (arg2) {
    const type = arg2.split(":")[0] as "str" | "num" | "bool" | "key";
    let arg: string | number | boolean | undefined = undefined;

    // handle the different types of arguments
    if (type === "str" && arg2_val_str !== undefined) {
      arg = arg2_val_str;
    } else if (type === "key" && arg2_val_key !== undefined) {
      arg = getNestedKeyValue(opts, arg2_val_key as string) as
        | string
        | number
        | boolean
        | undefined;
    } else if (type === "num" && arg2_val_num !== undefined) {
      arg = arg2_val_num.includes(".") ? Number.parseFloat(arg2_val_num as string) : Number.parseInt(arg2_val_num as string);
      // If the argument isn't a valid number, discard it
      if (Number.isNaN(arg)) {
        arg = undefined;
      }
    } else if (type === "bool" && arg2_val_bool !== undefined) {
      switch (arg2_val_bool) {
        case "true":
        case "1":
          arg = true;
          break;
        case "false":
        case "0":
          arg = false;
          break;
        default:
          arg = undefined;
          break;
      }
    }

    args.push(arg ? { val: arg, type } : undefined);
  }

  return args;
};
