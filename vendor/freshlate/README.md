# Freshlate

A small plugin for Fresh to handle translations. It may be rough around the edges for now, but suits my needs (and hopefully yours) decently enough.

## Support

For support, feel free to open an issue!

## Installation

Install freshlate by adding the import and setting it up in fresh

```ts
import languagePlugin from "https://deno.land/x/freshlate/mod.ts";
import languageConfig from "./translate.config.ts";

await start(manifest, {
  plugins: [twindPlugin(twindConfig), languagePlugin({ ...languageConfig })],
});
```

Example `translate.config.ts` file

```ts
import type { Options } from "https://deno.land/x/freshlate/mod.ts";

export default {
  selfURL: import.meta.url,
  languages: {
    en: {},
  },
  fetch_url: "/api/translation/{{lang}}",
  fallback_language: "en",
} as Options;
```

## Usage/Examples

#### Example Fresh `main.ts` file

```ts
/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "fresh/server.ts";
import manifest from "./fresh.gen.ts";

import languagePlugin from "freshlate";
import languageConfig from "./translate.config.ts";

await start(manifest, {
  plugins: [languagePlugin({ languageConfig })],
});
```

#### Example `translate.config.ts` file

```ts
import type { Options } from "freshlate";

export default {
  selfURL: import.meta.url,
  languages: {
    en: {
      common: {
        languages: {
          en: "English",
          es: "Spanis",
        },
      },
    },
    es: {
      common: {
        languages: {
          en: "Inglés",
          es: "Español",
        },
      },
    },
  },
  fetch_url: "/api/translation/{{lang}}",
} as Options;
```

#### Example component with translation

```typescript
export function Button() {
  return (
    <button
      class="px-2 py-1 border(gray-100 2) hover:bg-gray-200"
      data-t-key="common.languages.es"
    >
      Spanish {/* This will be replaced by the translation service  */}
    </button>
  );
}
```

#### Example with formatting and data replacement

What translation tool would be feature-complete(ish) without a formatter and data inserter? The general formatting of a dynamic translation key
follows the following:

- starts with `[[~`
- ends with `]]`
- first parameter is a key on the params object (can be as deeply nested as you want) and must be wrapped in curly braces; examples:
  - `{a_key_on_the_root_object}` - root level key
  - `{parent.child_key}` - Nested key
  - `{key.deeply.nested.0.and_in_array}` - Nested deeply and within an array
  - `{key.still.2.1.3.nested.deeply.}` - Nested deeply within multi-dimensional arrays
- next parameter onwards is a format option key. The key can be a string but can not include spaces but only supports the regex values `\w-`;
  examples:
  - valid: test_case
  - valid: test-case
  - valid: testCase
  - invalid: test case
  - invalid: test(case)
  - invalid: test.case
- key followed by colon, and value of test case is wrapped in backticks
- each parameter should be separated by a lone pipe character
- optionally, a `default` case can be passed in at the end to handle edge cases
- optionally, you can embed a value in a format case using double squigly lines; examples:
  - `test_case:`\`Here's my embeded data {{data_key}}\``
- optionally, embedded values can have fallback strings spanning multiple lines. They should be surrounded by double pipes, and can't contain double
  pipes; examples:
  - `{{key}}||oops, nothing here||`

If we put all that together and format it to our liking, we get something like the following: (new lines should be treated as spaces)

```
[[~
    {key}
	 test_case_1: `test 2` |
	 test_case_2: `{{key}} {{key2}}||no key found||` |
	 default: `oops, no cases matched`
]]
```

The above would only look pretty outside of a JSON file though. The return characters are purely decorative outside of the case formats The regex that
handles the parsing of the above can be found in `/freshlate/translation.ts` Here's the regex to save you the trouble though:

```ts
const DYN_STR_REGEX = /\[\[~\s*(?:{(.*?)})\s*((?:\s*[\w-]+\s*:\s*`[^`]*`\s*\|*\s*)*\s*(?:default\s*:\s*`[^`]*`\s*){0,1})\]\]/gs;
```

Here's an example properly showing how this would be used in the real-world

```ts
// /translate.config.ts
...    
        common: {
            counter: 'You have [[~ {count} 0: `no apples` | 1: `one apple` | default: `{{count}} apples` ]]'
        }
...
// --------------------------- //

// /components/button.ts
export function Button() {
  return (
    <button
      class="px-2 py-1 border(gray-100 2) hover:bg-gray-200"
      data-t-key="common.counter"
      data-t-key-params={{count: 10}}
    >
      Apples {/* This will be replaced by
                 the translation service and
                 should read "You have 10 apples" */}
    </button>
  );
}
```

#### Example with formatting and data replacement, as well as data fallback

If a value doesn't exist for the provided key, you can provide a fallback value. This can be anything but must not contain the sequence `||` and must
begin and end with `||`

```ts
// /translate.config.ts
...    
        common: {
            counter: 'You have [[~ {count} 0: `no apples` | 1: `one apple` | default: `{{count}}||inappropriate|| apples` ]]'
        }
...
// --------------------------- //

// /components/button.ts
export function Button() {
  return (
    <button
      class="px-2 py-1 border(gray-100 2) hover:bg-gray-200"
      data-t-key="common.counter"
      data-t-key-params={{other_count: 10}}
    >
      Apples {/* The text nodes here will be replaced by
                 the translation service and
                 should read "You have inappropriate apples" */}
    </button>
  );
}
```

### Calling the translate function manually

If you're opposed to translations happening on the client side at all - you can pre-translate things by omitting any of the above data attributes, and
instead just calling the translation service directly. Here's an example of how you might call it:

```ts
import { freshlate } from 'freshlate'

/*
 * Example with the following translation object:
 * {
 *   "my": {
 *     "translation": {
 *       "key": "Here's a translation [[~ {containing.for_data} substituion: `with substitution` | default: `oops` ]]"
 *     }
 *   }
 * }
*/

freshlate.t('my.translation.key', {
    my: 'object',
    containing: {
        relevant: 'information',
        for_data: 'substitution
    }
) // output: "Here's a translation with substitution"
```

### Function case keys for further filtering

We'll start off with a direct example from the tests file:

```ts
const svc = new LanguageService();

svc.addLanguage("en", {
  common: {
    test_age: "You are [[~ {age} LTE(num:12): `a child` | BT(num:12, num:18): `a teenager` | GTE(num:18): `an adult` ]]",
  },
});

assertEquals(svc.t("common.test_age", { age: 18 }), "You are an adult");
assertEquals(svc.t("common.test_age", { age: 13 }), "You are a teenager");
assertEquals(svc.t("common.test_age", { age: 8 }), "You are a child");
```

Each sequentual assertion would provide the valid answers. The functions get run in sequential order, exiting once one returns true.

There's 17 comparison functions in total, most are just variants of each other though:

```typescript
[
  "GT",
  "GTE",
  "NGT",
  "NGTE", // greater than functions
  "LT",
  "LTE",
  "NLT",
  "NLTE", // less than functions
  "EQ",
  "NEQ", // equality functions (strict === and !==)
  "AND", // checking for two boolean values
  "BT",
  "NBT", // between two numbers (non-inclusive 15 is not between 10-15)
  "IN",
  "NIN", // array functions, checks to see if the current variable is inside a provided options key array
  "OR",
  "XOR", // standard or functions (a || b, a !== b)
];
```

So a readout of all of those would be:

- greater than
- greater than or equal to
- not greater than
- not greater than or equal to
- less than
- less than or equal to
- not less than
- not less than or equal to
- equal to (strict)
- not equal to (strict)
- and (&&)
- between (GT(a, b) && LT(a, c))
- not between
- in (string or array .includes)
- not in
- or (||)
- xor (a !== b, strict)

The first parameter (which we'll call `a`) is always passed in by the dynamic replacer as the parameter at the start of the statement

```
[[~
    {key.child.child} <---- this
    ...
]]
```

The second parameter (and third if it requires one) are ones passed in by you (`b`, and `c` respectively) Each parameter is prefixed by its type to
aid the parser. The prefixes available are:

- num - a simple number type, parsed as either an int or a float depending on if a period is detected. The answer is thrown out if `Number.isNaN`
  returns true.
- str - A string
- bool - a boolean value. this can be written either as: bool:1, or bool:true (and their false counterparts)
- key - a value that should be fetched from the options object you passed in. This is handled the same way as the afformentioned parameter at the
  start of the statement

Spacing doesn't matter when writing the function, it can be formatted in a number of ways to help with readability. eg:

- GT(num:1) `test`
- GT( num: 1 ) `test`
- GT(num : 1) `test` Or even:

```
GT(
	num: 1
)
```

Each function has a list of available types to use for each parameter, these apply to afformentioned parameters `b`, and `c`. | fn group | param: b |
param: c | |--------------------|---------------------|---------------| | GT, GTE, NGT, NGTE | num, str, key | N/A | | LT, LTE, NLT, NLTE | num, str,
key | N/A | | EQ, NEQ | num, str, key, bool | N/A | | BT, NBT | num, str, key | num, str, key | | AND, OR, XOR | num, str, key, bool | N/A | | IN, NIN
| key | N/A |

_You'll have to be careful when passing in user data as the statement starting parameter as this isn't checked like the above._

On top of casting the type before the value, the different types also have their values wrapped differently:

- strings: `` str: `test` `` (backtick wrapped string. you can put anything inside other than backticks)
- numbers: `num: 1` || `num: 1.1`
- booleans: `bool: 1` || `bool: 0` || `bool: false` || `bool: true`
- values of keys: `key: {key1.child_key}`

Parameters should be separated by a comma - but again, spacing doesn't matter here.

An example with two given parameters can be found in the test `Translate a key and handle function calls`. Here's the test separated out from the
other one in there though:

```ts
Deno.test(
  { name: "Translate a key and handle function calls" },
  () => {
    const svc = new LanguageService();

    svc.addLanguage("en", {
      common: {
        test_array:
          "You have [[~ {messages.length} EQ(num:0): `no` | LTE(num:3): `some` | LTE(num:8): `a few` | LTE(num:40): `a lot of` | GTE(num:41): `too many` | default: `{{messages.length}}` ]] messages",
      },
    });

    const arr = new Array(0);

    assertEquals(svc.t("common.test_array", { messages: arr }), "You have no messages");
    arr.length = 3;
    assertEquals(svc.t("common.test_array", { messages: arr }), "You have some messages");
    arr.length = 8;
    assertEquals(svc.t("common.test_array", { messages: arr }), "You have a few messages");
    arr.length = 40;
    assertEquals(svc.t("common.test_array", { messages: arr }), "You have a lot of messages");
    arr.length = 41;
    assertEquals(svc.t("common.test_array", { messages: arr }), "You have too many messages");
  },
);
```

## Authors

- [@brocococonut](https://www.github.com/brocococonut)

## License

[MIT](https://choosealicense.com/licenses/mit/)
