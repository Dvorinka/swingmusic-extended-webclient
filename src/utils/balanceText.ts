import { isSmallPhone } from "@/stores/content-width";

export function balanceText(
  text: string,
  container_width: number,
  font_size: string = "2.75rem"
) {
  if (isSmallPhone.value) return [text];

  const tempElem = document.createElement("span");
  tempElem.classList.add("balance-text-temp");
  tempElem.style.fontSize = font_size;
  tempElem.style.fontWeight = "700";
  tempElem.innerText = text;
  document.body.appendChild(tempElem);

  const tempWidth = tempElem.offsetWidth;

  document.body.removeChild(tempElem);

  const ratio = tempWidth / container_width;

  if (ratio < 0.9 || ratio > 1.75) {
    // text fits properly or overflows 2 lines.
    return [text];
  }

  const words = text.split(" ");
  const wordsPerLine = Math.ceil(words.length / 2);
  
  // Character-based splitting improvement:
  // Check if the middle word is too short or too long, and adjust split point
  if (words.length > 2) {
    const middleWord = words[wordsPerLine - 1];
    const avgWordLength = text.length / words.length;
    
    // If middle word is significantly longer than average, try splitting after it
    if (middleWord.length > avgWordLength * 1.5 && wordsPerLine < words.length) {
      // Move split point forward
      const firstLine = words.slice(0, wordsPerLine).join(" ");
      const secondLine = words.slice(wordsPerLine).join(" ");
      
      // Check if this creates a better balance
      const firstLineRatio = firstLine.length / text.length;
      if (firstLineRatio > 0.35 && firstLineRatio < 0.65) {
        return [firstLine, secondLine];
      }
    }
    
    // If middle word is significantly shorter than average, try splitting before it
    if (middleWord.length < avgWordLength * 0.5 && wordsPerLine > 1) {
      // Move split point backward
      const adjustedPerLine = wordsPerLine - 1;
      const firstLine = words.slice(0, adjustedPerLine).join(" ");
      const secondLine = words.slice(adjustedPerLine).join(" ");
      
      // Check if this creates a better balance
      const firstLineRatio = firstLine.length / text.length;
      if (firstLineRatio > 0.35 && firstLineRatio < 0.65) {
        return [firstLine, secondLine];
      }
    }
  }

  const firstLine = words.slice(0, wordsPerLine).join(" ");
  const secondLine = words.slice(wordsPerLine).join(" ");

  return [firstLine, secondLine];
}
