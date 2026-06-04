function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code class=\"inline-code\">$1</code>");
}

export function renderAnswerMarkdown(markdown: string) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  const paragraph: string[] = [];
  let code: string[] | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p class="answer-paragraph">${renderInlineMarkdown(paragraph.join("\n"))}</p>`);
    paragraph.length = 0;
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (code) {
        blocks.push(`<pre class="answer-code"><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = null;
      } else {
        flushParagraph();
        code = [];
      }
      continue;
    }

    if (code) {
      code.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    paragraph.push(line);
  }

  if (code) {
    blocks.push(`<pre class="answer-code"><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  }
  flushParagraph();

  return `<div class="answer-rich">${blocks.join("")}</div>`;
}
