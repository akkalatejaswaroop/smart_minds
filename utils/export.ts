// Add jspdf and htmlToDocx to the window object for TypeScript
declare global {
  interface Window {
    jspdf: any;
    htmlToDocx: any;
    html2canvas: any;
  }
}

export const exportAsPdf = (element: HTMLElement, filename: string) => {
    if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
        alert("PDF export library is not loaded yet. Please try again in a moment.");
        return;
    }
    
    const originalStyle = element.style.overflow;
    element.style.overflow = 'visible';

    window.html2canvas(element, { 
      scale: 2, // Higher resolution
      useCORS: true, 
      backgroundColor: '#1e293b' // slate-800 background
    }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;

        // A4 page is 210mm x 297mm. Give 10mm margins.
        const imgWidth = pdfWidth - 20;
        const imgHeight = imgWidth / ratio;
        let heightLeft = imgHeight;
        let position = 10; // Initial top margin

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20); // Subtract visible height

        while (heightLeft > 0) {
            position = position - (pdfHeight - 20); // Move the "canvas" up
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);
        }
        pdf.save(`${filename}.pdf`);
    }).catch((e: any) => {
        console.error("PDF export failed during canvas creation", e);
        alert("Could not export as PDF. The content may be too complex to render.");
    }).finally(() => {
        // Ensure the original style is restored even if the export fails.
        element.style.overflow = originalStyle;
    });
};

export const exportAsDocx = async (element: HTMLElement, filename: string) => {
    if (typeof window.htmlToDocx === 'undefined') {
        alert("DOCX export library is not loaded yet. Please try again in a moment.");
        return;
    }
    try {
        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${filename}</title>
                 <style>
                  /* Basic styles for DOCX compatibility */
                  body { font-family: Calibri, sans-serif; font-size: 11pt; color: #000000; }
                  h1 { font-size: 16pt; color: #4F46E5; } /* indigo */
                  h2 { font-size: 14pt; color: #7C3AED; } /* purple */
                  h3 { font-size: 12pt; color: #4338CA; } /* darker indigo */
                  strong { font-weight: bold; }
                  ul, ol { margin-left: 20px; }
                 </style>
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