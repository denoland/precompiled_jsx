// Copyright 2023-present the Deno authors. All rights reserved. MIT license.
import {
  ComponentFn,
  createVNode,
  escapeHtml,
  isVNode,
  VNode,
  VOID_ELEMENTS,
} from "./utils.ts";

/**
 * Dynamic JSX factory function for components or JSX nodes that
 * cannot be serialized. A node is not serializable when it is
 * a component, has spread props or uses `dangerouslySetInnerHTML`.
 */
export function jsx<T>(
  type: ComponentFn<T> | string,
  props: T | null,
  _key?: string | number,
): VNode {
  // Case: jsx("div", { foo: "bar", ...baz })
  // Case: jsx("div", null)
  if (typeof type === "string") {
    let children = "";
    let attrs = "";

    // Serialize attributes to string
    // Case: jsx("div", null)
    if (props !== null) {
      const anyProps = props as unknown as Record<string, unknown>;
      const propKeys = Object.keys(anyProps);

      for (let i = 0; i < propKeys.length; i++) {
        const name = propKeys[i];
        const value = anyProps[name];

        // Skip serializing special properties and functions which are
        // mostly used for event listeners
        if (name === "ref" || name === "key" || typeof value === "function") {
          continue;
        } else if (name === "children") {
          children = renderDynamic(value);
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
      return createVNode(out);
    }

    out += `>${children}</${type}>`;
    return createVNode(out);
  }

  // Render a component
  // deno-lint-ignore no-explicit-any
  const result = type(props ?? {} as any);
  return isVNode(result) ? result : createVNode(renderDynamic(result));
}

export function jsxattr(name: string, value: unknown) {
  if (name === "key" || name === "ref" || typeof value === "function") {
    return "";
  }

  return `${name}="${escapeHtml(String(value))}"`;
}

export const jsxchild = escapeHtml;

/**
 * Serialize any value to a string. To match common expectations
 * of JSX, this discards falsy values, booleans and functions.
 */
function renderDynamic(dynamic: unknown): string {
  if (
    dynamic === null ||
    dynamic === undefined || typeof dynamic === "boolean" ||
    typeof dynamic === "function"
  ) {
    return "";
  } else if (Array.isArray(dynamic)) {
    let out = "";
    for (let i = 0; i < dynamic.length; i++) {
      out += renderDynamic(dynamic[i]);
    }
    return out;
  } else if (isVNode(dynamic)) {
    return dynamic.value;
  }

  return String(dynamic);
}

/**
 * Construct a template composed of static strings and dynamic values
 * into something we can render later. The dynamic parts are expected
 * to be already escaped strings or VNode objects. This function is
 * expected to be used for transpilation.
 */
export function jsxssr(tpl: string[], ...dynamics: unknown[]): VNode {
  let out = "";
  for (let i = 0; i < tpl.length; i++) {
    out += tpl[i];

    if (i < dynamics.length) {
      out += renderDynamic(dynamics[i]);
    }
  }

  return createVNode(out);
}

/**
 * Render JSX to an HTML string
 */
export function renderToString(vnode: VNode) {
  return renderDynamic(vnode);
}
