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
export function escapeHtml(str: string) {
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

export const VOID_ELEMENTS = new Set([
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

export type JsxNode =
  | VNode
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | JsxNode[];
export type ComponentFn<T> = (props: T) => JsxNode;

export interface VNode {
  type: symbol;
  value: string;
}

export const MARKER = Symbol.for("precompiled-jsx");

export function createVNode(value: string) {
  return { type: MARKER, value };
}

// deno-lint-ignore no-explicit-any
export function isVNode(obj: any): obj is VNode {
  return obj !== null && obj.type === MARKER;
}
