// url_test.ts
import { assert } from "std/testing/asserts.ts";
import * as languages from "config/translations/index.js";

const allLanguages = Object.keys(languages);

// Helper
function propertiesToArray(obj) {
  const isObject = (val) => val && typeof val === "object" && !Array.isArray(val);
  const addDelimiter = (a, b) => a ? `${a}.${b}` : b;
  const paths = (obj = {}, head = "") => {
    return Object.entries(obj)
      .reduce((product, [key, value]) => {
        const fullPath = addDelimiter(head, key);
        return isObject(value) ? product.concat(paths(value, fullPath)) : product.concat(fullPath);
      }, []);
  };
  return paths(obj);
}

const propertyListOfEn = propertiesToArray(languages.en);

// Check some basic stuff
Deno.test("There is at lease two languages", () => {
  assert(allLanguages.length > 1);
});
Deno.test("English is available", () => {
  assert(allLanguages.includes("en"));
});
Deno.test("English has at least one property", () => {
  assert(propertyListOfEn.length && propertyListOfEn.length > 0);
});

// Check each language against english recursively
for (const language of allLanguages) {
  const propertyListOfCurrent = propertiesToArray(languages[language]);
  for (const path of propertyListOfEn) {
    Deno.test(language + " has " + path + " from en", () => {
      assert(propertyListOfCurrent.includes(path));
    });
  }
  for (const path of propertyListOfCurrent) {
    Deno.test(path + " of " + language + " is not extraneus", () => {
      assert(propertyListOfEn.includes(path));
    });
  }
}
