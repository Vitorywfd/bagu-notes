import { describe, expect, it } from "vitest";
import { renderAnswerMarkdown } from "./markdown";

describe("renderAnswerMarkdown", () => {
  it("renders paragraphs and fenced code blocks", () => {
    const html = renderAnswerMarkdown("第一段\n\n```c\nint main(void) { return 0; }\n```");

    expect(html).toContain('<p class="answer-paragraph">第一段</p>');
    expect(html).toContain('<pre class="answer-code"><code>int main(void) { return 0; }</code></pre>');
  });

  it("escapes unsafe html from answers", () => {
    const html = renderAnswerMarkdown("<img src=x onerror=alert(1)>\n\n```js\n<script>alert(1)</script>\n```");

    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });
});
