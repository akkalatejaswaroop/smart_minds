export const renderSimpleMarkdown = (text: string): string => {
  if (!text) return '';

  let html = text;

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

  return html;
};
