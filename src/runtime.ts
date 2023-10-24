// Copyright 2023-present the Deno authors. All rights reserved. MIT license.

const ENCODED_ENTITIES = /["&<>']/;

const enum Char {
  DOUBLE_QUOTE = 34,
  AMPERSAND = 38,
  SINGLE_QUOTE = 39,
  LESS_THAN = 60,
  GREATER_THAN = 62,
}

/**
 * Escape HTML
 */
function escapeHtml(str: string) {
  if (str.length === 0 || !ENCODED_ENTITIES.test(str)) return str;

  let last = 0,
    i = 0,
    out = "",
    ch = "";

  // Seek forward in str until the next entity char:
  for (; i < str.length; i++) {
    switch (str.charCodeAt(i)) {
      case Char.DOUBLE_QUOTE:
        ch = "&quot;";
        break;
      case Char.AMPERSAND:
        ch = "&amp;";
        break;
      case Char.SINGLE_QUOTE:
        ch = "&#39;";
        break;
      case Char.LESS_THAN:
        ch = "&lt;";
        break;
      case Char.GREATER_THAN:
        ch = "&gt;";
        break;
      default:
        continue;
    }
    // Append skipped/buffered characters and the encoded entity:
    if (i !== last) out += str.slice(last, i);
    out += ch;
    // Start the next seek/buffer after the entity's offset:
    last = i + 1;
  }
  if (i !== last) out += str.slice(last, i);
  return out;
}

export type ComponentFn<T> = (props: T) => unknown;

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

export function jsx<T>(
  type: ComponentFn<T> | string,
  props: T | null,
  _key?: string | number,
) {
  if (typeof type === "string") {
    let children = "";
    let attrs = "";

    if (props !== null) {
      const anyProps = props as unknown as Record<string, unknown>;
      const propKeys = Object.keys(anyProps);

      for (let i = 0; i < propKeys.length; i++) {
        const name = propKeys[i];
        const value = anyProps[name];

        if (name === "ref" || name === "key" || typeof value === "function") {
          continue;
        } else if (name === "children") {
          children;
        } else if (name === "dangerouslySetInnerHTML") {
          if (typeof value === "string") {
            children = value;
          } else if (value !== null && typeof value === "object") {
            // deno-lint-ignore no-explicit-any
            children = (value as any).__html ?? "";
          }
        } else {
          attrs += jsxattr(name, value);
        }
      }
    }

    let out = `<${type}`;
    if (attrs !== "") out += " " + attrs;

    if (VOID_ELEMENTS.has(type)) {
      out += ">";
      return out;
    }

    out += `>${children}</${type}>`;
    return out;
  }

  // deno-lint-ignore no-explicit-any
  return String(type(props ?? {} as any));
}

// deno-lint-ignore no-explicit-any
export function jsxattr(name: string, value: any) {
  if (name === "key" || name === "ref" || typeof value === "function") {
    return "";
  } else if (ENCODED_ENTITIES.test(name)) {
    // Don't even attempt to encode it
    throw new Error(`Invalid attribute name: ${name}`);
  }

  return `${name}="${escapeHtml(String(value))}"`;
}

function renderDynamic(value: unknown): string {
  if (
    value === true || value === false || value === null ||
    value === undefined || typeof value === "function"
  ) {
    return "";
  }

  if (Array.isArray(value)) {
    let out = "";
    for (let i = 0; i < value.length; i++) {
      out += renderDynamic(value[i]);
    }
    return out;
  }

  return String(value);
}

// deno-lint-ignore no-explicit-any
export function jsxssr(tpl: string[], ...dynamics: any[]) {
  let out = "";
  for (let i = 0; i < tpl.length; i++) {
    out += tpl[i];

    if (i < dynamics.length) {
      out += renderDynamic(dynamics[i]);
    }
  }

  return out;
}
