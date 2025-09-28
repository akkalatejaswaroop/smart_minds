// utils/fileReader.ts
declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
  }
}

export const extractTextFromFile = async (file: File): Promise<string> => {
  if (!window.pdfjsLib || !window.mammoth) {
    return Promise.reject(new Error('File reading libraries are not loaded yet. Please try again in a moment.'));
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (!event.target?.result) {
          return reject(new Error('Failed to read file.'));
        }
        try {
          const pdf = await window.pdfjsLib.getDocument({ data: event.target.result }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item: any) => item.str).join(' ');
          }
          resolve(text);
        } catch (error) {
          reject(new Error(`Error parsing PDF: ${error instanceof Error ? error.message : String(error)}`));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file.'));
      reader.readAsArrayBuffer(file);
    });
  } else if (extension === 'docx') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (!event.target?.result) {
          return reject(new Error('Failed to read file.'));
        }
        try {
          const result = await window.mammoth.extractRawText({ arrayBuffer: event.target.result });
          resolve(result.value);
        } catch (error) {
          reject(new Error(`Error parsing DOCX: ${error instanceof Error ? error.message : String(error)}`));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file.'));
      reader.readAsArrayBuffer(file);
    });
  } else if (extension === 'doc') {
    return Promise.reject(new Error('.doc files are not supported. Please use .docx or .pdf.'));
  } else {
    return Promise.reject(new Error('Unsupported file type. Please upload a .pdf or .docx file.'));
  }
};
