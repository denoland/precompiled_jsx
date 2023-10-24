// Copyright 2023-present the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "https://deno.land/std@0.204.0/assert/mod.ts";
import { jsx, jsxattr, jsxssr, renderToString } from "./runtime.ts";

Deno.test("jsxattr - encodes attribute values", () => {
  assertEquals(
    jsxattr("foo", `&"'><&"'><`),
    `foo="&amp;&quot;&#39;&gt;&lt;&amp;&quot;&#39;&gt;&lt;"`,
  );
});

Deno.test("jsxssr - renders template", () => {
  const html = `<div foo="bar"></div>`;
  const tpl = [html];
  assertEquals(renderToString(jsxssr(tpl)), html);
});

Deno.test("jsxssr - renders dynamic parts", () => {
  const tpl = [`<div foo="bar" `, " ", "></div>"];
  assertEquals(
    renderToString(
      jsxssr(tpl, jsxattr("class", "foo"), jsxattr("data-bar", "foo")),
    ),
    `<div foo="bar" class="foo" data-bar="foo"></div>`,
  );
});

Deno.test("jsxssr - ignores falsy dynamic children", () => {
  const tpl = [`<div>`, "", "", "", "", "</div>"];
  assertEquals(
    renderToString(jsxssr(tpl, null, false, true, undefined, () => null)),
    `<div></div>`,
  );
});

Deno.test("jsxssr - array children", () => {
  const tpl = [`<div>`, "</div>"];
  assertEquals(
    renderToString(jsxssr(tpl, [1, 2, 3])),
    `<div>123</div>`,
  );
});

Deno.test("jsxssr - jsx children", () => {
  function Foo() {
    return jsxssr(["<p></p>"]);
  }

  const tpl = [`<div>`, "</div>"];
  assertEquals(
    renderToString(jsxssr(tpl, jsx(Foo, null))),
    `<div><p></p></div>`,
  );
});

Deno.test("jsx - dom", () => {
  assertEquals(
    renderToString(jsx("div", { class: "foo", onclick: () => null })),
    `<div class="foo"></div>`,
  );
});

Deno.test("jsx - dom children", () => {
  assertEquals(
    renderToString(jsx("div", { children: "foo" })),
    `<div>foo</div>`,
  );

  assertEquals(
    renderToString(jsx("div", { children: jsx("p", null) })),
    `<div><p></p></div>`,
  );
});

Deno.test("jsx - dangerouslySetInnerHTML", () => {
  assertEquals(
    renderToString(jsx("div", { dangerouslySetInnerHTML: "<span>foo</span>" })),
    "<div><span>foo</span></div>",
  );
});

Deno.test("jsx - Components", () => {
  function Foo() {
    return jsxssr(["<div></div>"]);
  }

  assertEquals(
    renderToString(jsx(Foo, null)),
    "<div></div>",
  );

  function Bar(props: { foo: string }) {
    return props.foo;
  }

  assertEquals(
    renderToString(jsx(Bar, { foo: "foo" })),
    "foo",
  );
});
