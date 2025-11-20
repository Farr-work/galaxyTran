import { Question, Option } from '../types';

export const parseQuizContent = (rawText: string): Question[] => {
  if (!rawText.trim()) return [];

  // Normalize newlines
  const normalizedText = rawText.replace(/\r\n/g, '\n');

  // Split by "Câu [number]:" or just "Câu [number]" to separate questions
  // Regex looks for "Câu" followed by number, case insensitive, start of line or after newline
  const questionBlocks = normalizedText.split(/(?=(?:^|\n)Câu\s+\d+[:.])/i).filter(block => block.trim().length > 0);

  return questionBlocks.map((block, index) => {
    const cleanBlock = block.trim();
    
    // 1. Extract Question Content vs Options
    // We look for the first occurrence of a pattern that looks like an option (e.g., "A.", "*A.", "A)", "*A)")
    // The * is the marker for correct answer
    
    const optionRegex = /(?:^|\s)(\*?)([A-Z])(?:\.|:|\))\s/g;
    let firstOptionIndex = -1;
    let match;
    
    // Find the start of the first option to split Question Text from Options Text
    while ((match = optionRegex.exec(cleanBlock)) !== null) {
      if (firstOptionIndex === -1) {
        firstOptionIndex = match.index;
        break;
      }
    }

    let questionText = "";
    let optionsText = "";

    if (firstOptionIndex !== -1) {
      questionText = cleanBlock.substring(0, firstOptionIndex).trim();
      optionsText = cleanBlock.substring(firstOptionIndex);
    } else {
      // Fallback if regex fails to find structured options (treat whole block as text)
      questionText = cleanBlock;
    }

    // CLEANUP: Remove the "Câu X:" prefix if present in the extracted text
    // This prevents "Câu 1: Câu 1: Nội dung..." in the UI
    questionText = questionText.replace(/^(?:Câu\s+\d+[:.])\s*/i, "");

    // 2. Parse Options
    const options: Option[] = [];
    // We split optionsText by the Option Key pattern (A., B., etc)
    // We use a capturing group in split to keep the delimiters
    const parts = optionsText.split(/(?:^|\s)(\*?)([A-Z])(?:\.|:|\))\s/);
    
    // The split result will look like: ["", "*", "A", "Content of A", "", "", "B", "Content of B"...]
    // Loop through parts. index 0 is usually empty pre-text.
    // We expect groups of 3: [marker, letter, content]
    
    for (let i = 1; i < parts.length; i += 3) {
      const marker = parts[i]; // "*" or ""
      const letter = parts[i+1]; // "A", "B", etc
      let content = parts[i+2] || ""; // "Answer text..."

      // Clean up content: remove trailing newlines or the start of next option if regex missed something
      content = content.trim();

      if (letter && content) {
        options.push({
          id: letter,
          text: content,
          isCorrect: marker === '*',
        });
      }
    }

    return {
      id: index + 1,
      text: questionText,
      options
    };
  });
};

export const SAMPLE_DATA = `Câu 1: JavaScript là ngôn ngữ gì?
A. Ngôn ngữ lập trình phía máy chủ (Server-side)
*B. Ngôn ngữ kịch bản (Scripting language) chạy trên trình duyệt
C. Ngôn ngữ biên dịch (Compiled language)
*D. Có thể chạy trên server thông qua Node.js

Câu 2: Trong HTML, thẻ nào dùng để xuống dòng?
A. <break>
*B. <br>
C. <lb>
D. <newline>

Câu 3: CSS dùng để làm gì?
*A. Định dạng giao diện trang web
B. Xử lý logic tính toán
C. Lưu trữ dữ liệu
D. Kết nối cơ sở dữ liệu`;