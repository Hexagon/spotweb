import { JSX, options as preactOptions, VNode } from "preact";
import { lang_svc } from "./translation.ts";

declare module "preact" {
  namespace JSX {
    interface DOMAttributes<Target extends EventTarget> {
      /**
       * The translation key to use for the element's text content.
       */
      "data-t-key"?: string;
      "lang"?: string;
      "data-t-key-params"?: Record<string, string>;
    }
  }
}

/**
 * Options for the translation service.
 */
export interface Options {
  /** The import.meta.url of the module defining these options. */
  selfURL: string;
  /**
   * Preallocated languages to use for translations. This is useful if you want
   * to preallocate languages on the server and then hydrate them on the client.
   * If this is not provided, the client will try to get the language from the
   * provided fetch_url.
   */
  languages: Record<string, Record<string, string>>;
  /**
   * Optional location to attempt fetching a translation from
   * @example https://example.com/translations/{{lang}}.json
   * @example https://example.com/api/translations/{{lang}}
   * @example https://example.com/api/translations.json?lang={{lang}}
   */
  fetch_url?: string;

  /**
   * The fallback language to use if the browser's language is not supported/not set.
   * If this is not set, the fallback language will be the first language in the
   * languages object.
   * @example en
   * @example en-US
   * @example fr
   * @example es
   */
  fallback_language?: string;
}

export function setup(options: Options, language?: string) {
  for (const lang in options.languages) {
    if (Object.prototype.hasOwnProperty.call(options.languages, lang)) {
      lang_svc.addLanguage(lang, options.languages[lang]);
    }
  }

  // Backup the original vnode hook function
  const originalHook = preactOptions.vnode;

  // Create a new hook function that will be called before every vnode is
  // rendered
  // deno-lint-ignore no-explicit-any
  preactOptions.vnode = (vnode: VNode<JSX.DOMAttributes<any>>) => {
    const { props } = vnode;

    // If the element has a translation key, replace its children with the translated text.
    if (props?.["data-t-key"]) {
      // Get the parameters from the element's data-t-key-params
      // attribute, otherwise use an empty object
      const translate_props = props["data-t-key-params"] || ({} as Record<string, string>);

      // If a language was passed in, set it as the language to use
      if (language) {
        translate_props.lang = language;
      }

      // If the vnode has a lang attribute, use that instead
      if (props?.["lang"]) {
        translate_props.lang = props?.["lang"];
      }

      // If the key is an array, map over all items and translate them if necessary
      if (Array.isArray(props.children)) {
        // Map over the children and translate them if necessary
        props.children = props.children.map((child) => {
          if (typeof child === "string") {
            return lang_svc.t(props["data-t-key"] as string, translate_props);
          } else {
            return child;
          }
        });
      } else if (typeof props.children === "string") {
        // If the children is a string, translate it
        props.children = lang_svc.t(
          props["data-t-key"] as string,
          translate_props,
        );
      }
      // props.children = `${lang_svc.t(props['data-t-key'], props?.['data-t-key-params'] as Record<string, string>)}`
    }

    if (
      lang_svc.getKey(language as string, props?.["data-t-key"] as string) !==
        "__NOT_FOUND__"
    ) {
      // Remove the translation key and params from the element if they exist
      delete props?.["data-t-key"];
      delete props?.["data-t-key-params"];
    }

    // Call the original hook function if it exists
    originalHook?.(vnode);
  };
}
