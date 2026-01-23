/**
 * 吹き出し形状のSVGを生成するモジュール
 */

/**
 * XMLエスケープ
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 丸型吹き出しSVGを生成
 */
export function createRoundBubble(
  text: string,
  width: number,
  height: number,
  fontSize: number = 14,
  fontFamily: string = 'Noto Sans CJK JP, sans-serif'
): string {
  // テキストを折り返し
  const maxCharsPerLine = Math.floor((width - 40) / (fontSize * 0.6));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  // 最大3行まで
  const displayLines = lines.slice(0, 3);
  if (lines.length > 3) {
    displayLines[2] = displayLines[2].slice(0, -3) + '...';
  }

  const lineHeight = fontSize * 1.3;
  const totalTextHeight = displayLines.length * lineHeight;
  const startY = (height - totalTextHeight) / 2 + fontSize;

  const textElements = displayLines.map((line, i) => 
    `<text x="50%" y="${startY + i * lineHeight}" text-anchor="middle" 
           font-family="${fontFamily}" font-size="${fontSize}" font-weight="normal" 
           fill="#1a1a2e">${escapeXml(line)}</text>`
  ).join('');

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${width/2}" cy="${height/2}" rx="${width/2 - 5}" ry="${height/2 - 5}" 
               fill="#f8f8f8" stroke="#1a1a2e" stroke-width="2"/>
      ${textElements}
    </svg>
  `;
}

/**
 * 角型吹き出しSVGを生成
 */
export function createSquareBubble(
  text: string,
  width: number,
  height: number,
  fontSize: number = 14,
  fontFamily: string = 'Noto Sans CJK JP, sans-serif'
): string {
  // テキストを折り返し
  const maxCharsPerLine = Math.floor((width - 40) / (fontSize * 0.6));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  // 最大3行まで
  const displayLines = lines.slice(0, 3);
  if (lines.length > 3) {
    displayLines[2] = displayLines[2].slice(0, -3) + '...';
  }

  const lineHeight = fontSize * 1.3;
  const totalTextHeight = displayLines.length * lineHeight;
  const startY = (height - totalTextHeight) / 2 + fontSize;

  const textElements = displayLines.map((line, i) => 
    `<text x="50%" y="${startY + i * lineHeight}" text-anchor="middle" 
           font-family="${fontFamily}" font-size="${fontSize}" font-weight="normal" 
           fill="#1a1a2e">${escapeXml(line)}</text>`
  ).join('');

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="${width - 10}" height="${height - 10}" 
            fill="#f8f8f8" stroke="#1a1a2e" stroke-width="2" rx="5" ry="5"/>
      ${textElements}
    </svg>
  `;
}

/**
 * ギザギザ吹き出しSVGを生成（強調・叫び用）
 */
export function createJaggedBubble(
  text: string,
  width: number,
  height: number,
  fontSize: number = 14,
  fontFamily: string = 'Noto Sans CJK JP, sans-serif'
): string {
  // テキストを折り返し
  const maxCharsPerLine = Math.floor((width - 40) / (fontSize * 0.6));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  // 最大3行まで
  const displayLines = lines.slice(0, 3);
  if (lines.length > 3) {
    displayLines[2] = displayLines[2].slice(0, -3) + '...';
  }

  const lineHeight = fontSize * 1.3;
  const totalTextHeight = displayLines.length * lineHeight;
  const startY = (height - totalTextHeight) / 2 + fontSize;

  const textElements = displayLines.map((line, i) => 
    `<text x="50%" y="${startY + i * lineHeight}" text-anchor="middle" 
           font-family="${fontFamily}" font-size="${fontSize}" font-weight="bold" 
           fill="#1a1a2e">${escapeXml(line)}</text>`
  ).join('');

  // ギザギザのパスを生成
  const spikes = 12;
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadiusX = width / 2 - 5;
  const outerRadiusY = height / 2 - 5;
  const innerRadiusX = outerRadiusX * 0.85;
  const innerRadiusY = outerRadiusY * 0.85;
  
  let path = '';
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes;
    const isOuter = i % 2 === 0;
    const radiusX = isOuter ? outerRadiusX : innerRadiusX;
    const radiusY = isOuter ? outerRadiusY : innerRadiusY;
    const x = centerX + radiusX * Math.cos(angle);
    const y = centerY + radiusY * Math.sin(angle);
    
    if (i === 0) {
      path += `M ${x} ${y}`;
    } else {
      path += ` L ${x} ${y}`;
    }
  }
  path += ' Z';

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <path d="${path}" fill="#fff5e6" stroke="#1a1a2e" stroke-width="2"/>
      ${textElements}
    </svg>
  `;
}
