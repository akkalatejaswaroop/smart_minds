// fix: Replaced placeholder content with a full implementation for reading PDF and DOCX files.
// Add pdfjs and mammoth to the window object for TypeScript
declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
  }
}

const getPdfText = async (file: File): Promise<string> => {
  if (!window.pdfjsLib) {
    throw new Error('PDF.js library is not loaded. Please wait and try again.');
  }
  const pdfjsLib = window.pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let textContent = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    textContent += text.items.map((item: any) => item.str).join(' ');
  }
  
  return textContent;
};

const getDocxText = async (file: File): Promise<string> => {
  if (!window.mammoth) {
    throw new Error('Mammoth.js library is not loaded. Please wait and try again.');
  }
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileType = file.type;
  
  if (fileType === 'application/pdf') {
    return getPdfText(file);
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return getDocxText(file);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }
};
