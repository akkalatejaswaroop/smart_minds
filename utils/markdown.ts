export const renderSimpleMarkdown = (text: string): string => {
  if (!text) return '';

  // Use a placeholder to protect code blocks from further processing
  const codeBlocks: string[] = [];
  let html = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const block = `<pre><code class="language-${lang}">${escapedCode}</code></pre>`;
    codeBlocks.push(block);
    return `__CODEBLOCK_${codeBlocks.length - 1}__`;
  });
  
  // Headers (e.g., ### Header)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold (e.g., **bold**)
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // Italic (e.g., *italic*)
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Lists (naive implementation: wrap each item and then merge adjacent lists)
  // This works for simple, non-nested lists which is expected from the AI.
  html = html.replace(/^\s*[-*] (.*$)/gim, '<ul><li>$1</li></ul>');
  html = html.replace(/^\s*\d+\. (.*$)/gim, '<ol><li>$1</li></ol>');
  html = html.replace(/<\/ul>\s*<ul>/gim, '');
  html = html.replace(/<\/ol>\s*<ol>/gim, '');

  // Convert remaining newlines to <br> to preserve line breaks
  html = html.replace(/\n/g, '<br />');

  // Cleanup spacing around block elements that were just created
  html = html.replace(/<br \/>(<[uo]l|<h[1-3]>)/g, '$1');
  html = html.replace(/(<\/[uo]l>|<\/h[1-3]>)<br \/>/g, '$1');

  // Restore the code blocks
  html = html.replace(/__CODEBLOCK_(\d+)__/g, (match, index) => {
    return codeBlocks[parseInt(index, 10)];
  });

  return html;
};