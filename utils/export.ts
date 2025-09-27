// Add jspdf and htmlToDocx to the window object for TypeScript
declare global {
  interface Window {
    jspdf: any;
    htmlToDocx: any;
  }
}

export const exportAsPdf = (element: HTMLElement, filename: string) => {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.html(element, {
            callback: function (doc: any) {
                doc.save(`${filename}.pdf`);
            },
            x: 10,
            y: 10,
            width: 190,
            windowWidth: element.scrollWidth
        });
    } catch (e) {
        console.error("PDF export failed", e);
        alert("Could not export as PDF. Please try again.");
    }
};

export const exportAsDocx = async (element: HTMLElement, filename: string) => {
    try {
        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${filename}</title>
            </head>
            <body>
                ${element.innerHTML}
            </body>
            </html>
        `;
        const fileBuffer = await window.htmlToDocx.asBlob(content);
        const url = URL.createObjectURL(fileBuffer);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("DOCX export failed", e);
        alert("Could not export as DOCX. Please try again.");
    }
};