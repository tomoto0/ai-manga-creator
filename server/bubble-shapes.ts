/**
 * 吹き出し形状のSVGを生成するモジュール
 * 日本語テキストに対応した装飾されたボックス形式
 * Sharp/libvipsでの正確なレンダリングのため、フォント指定を最適化
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
 * 日本語テキストを折り返す
 * 日本語は文字単位で折り返し、英語は単語単位で折り返す
 */
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  // 日本語文字の幅は約1em、英数字は約0.5em
  const lines: string[] = [];
  let currentLine = '';
  let currentWidth = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // 日本語文字かどうかを判定（CJK統合漢字、ひらがな、カタカナ）
    const isJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf]/.test(char);
    const charWidth = isJapanese ? fontSize : fontSize * 0.55;
    
    if (currentWidth + charWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
      currentWidth = charWidth;
    } else {
      currentLine += char;
      currentWidth += charWidth;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * 丸型吹き出しSVGを生成（角丸の装飾された四角形）
 * ユーザーの要望により、楕円形ではなく装飾された四角形を使用
 */
export function createRoundBubble(
  text: string,
  width: number,
  height: number,
  fontSize: number = 16,
  fontFamily: string = 'Noto Sans CJK JP'
): string {
  const padding = 15;
  const maxWidth = width - padding * 2;
  const lines = wrapText(text, maxWidth, fontSize);

  // 最大3行まで
  const displayLines = lines.slice(0, 3);
  if (lines.length > 3) {
    displayLines[2] = displayLines[2].slice(0, -1) + '…';
  }

  const lineHeight = fontSize * 1.4;
  const totalTextHeight = displayLines.length * lineHeight;
  const startY = (height - totalTextHeight) / 2 + fontSize;

  // SVGでのテキストレンダリング用に、フォント指定を明示的に行う
  const textElements = displayLines.map((line, i) => 
    `<text x="50%" y="${startY + i * lineHeight}" text-anchor="middle" 
           font-family="${fontFamily}" font-size="${fontSize}" font-weight="normal" 
           fill="#1a1a2e" dominant-baseline="middle">${escapeXml(line)}</text>`
  ).join('');

  // 装飾された角丸四角形ボックス
  const boxMargin = 8;
  const borderRadius = 15;
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <style type="text/css">
          text { font-family: '${fontFamily}', 'Arial', sans-serif; }
        </style>
      </defs>
      <!-- 影 -->
      <rect x="${boxMargin + 3}" y="${boxMargin + 3}" 
            width="${width - boxMargin * 2}" height="${height - boxMargin * 2}" 
            fill="rgba(0,0,0,0.15)" rx="${borderRadius}" ry="${borderRadius}"/>
      <!-- メインボックス -->
      <rect x="${boxMargin}" y="${boxMargin}" 
            width="${width - boxMargin * 2}" height="${height - boxMargin * 2}" 
            fill="#ffffff" stroke="#6b21a8" stroke-width="2.5" 
            rx="${borderRadius}" ry="${borderRadius}"/>
      <!-- 内側のハイライト -->
      <rect x="${boxMargin + 4}" y="${boxMargin + 4}" 
            width="${width - boxMargin * 2 - 8}" height="${height - boxMargin * 2 - 8}" 
            fill="none" stroke="rgba(107, 33, 168, 0.2)" stroke-width="1" 
            rx="${borderRadius - 2}" ry="${borderRadius - 2}"/>
      <!-- テキスト -->
      ${textElements}
    </svg>
  `;
}

/**
 * 角型吹き出しSVGを生成（直角の装飾されたボックス）
 */
export function createSquareBubble(
  text: string,
  width: number,
  height: number,
  fontSize: number = 16,
  fontFamily: string = 'Noto Sans CJK JP'
): string {
  const padding = 15;
  const maxWidth = width - padding * 2;
  const lines = wrapText(text, maxWidth, fontSize);

  // 最大3行まで
  const displayLines = lines.slice(0, 3);
  if (lines.length > 3) {
    displayLines[2] = displayLines[2].slice(0, -1) + '…';
  }

  const lineHeight = fontSize * 1.4;
  const totalTextHeight = displayLines.length * lineHeight;
  const startY = (height - totalTextHeight) / 2 + fontSize;

  const textElements = displayLines.map((line, i) => 
    `<text x="50%" y="${startY + i * lineHeight}" text-anchor="middle" 
           font-family="${fontFamily}" font-size="${fontSize}" font-weight="normal" 
           fill="#1a1a2e" dominant-baseline="middle">${escapeXml(line)}</text>`
  ).join('');

  // 装飾された直角ボックス（漫画風の角）
  const boxMargin = 8;
  const cornerSize = 8;
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <style type="text/css">
          text { font-family: '${fontFamily}', 'Arial', sans-serif; }
        </style>
      </defs>
      <!-- 影 -->
      <rect x="${boxMargin + 3}" y="${boxMargin + 3}" 
            width="${width - boxMargin * 2}" height="${height - boxMargin * 2}" 
            fill="rgba(0,0,0,0.15)" rx="3" ry="3"/>
      <!-- メインボックス -->
      <rect x="${boxMargin}" y="${boxMargin}" 
            width="${width - boxMargin * 2}" height="${height - boxMargin * 2}" 
            fill="#ffffff" stroke="#1a1a2e" stroke-width="2.5" 
            rx="3" ry="3"/>
      <!-- 角の装飾（左上） -->
      <path d="M ${boxMargin} ${boxMargin + cornerSize} L ${boxMargin} ${boxMargin} L ${boxMargin + cornerSize} ${boxMargin}" 
            fill="none" stroke="#6b21a8" stroke-width="3"/>
      <!-- 角の装飾（右上） -->
      <path d="M ${width - boxMargin - cornerSize} ${boxMargin} L ${width - boxMargin} ${boxMargin} L ${width - boxMargin} ${boxMargin + cornerSize}" 
            fill="none" stroke="#6b21a8" stroke-width="3"/>
      <!-- 角の装飾（左下） -->
      <path d="M ${boxMargin} ${height - boxMargin - cornerSize} L ${boxMargin} ${height - boxMargin} L ${boxMargin + cornerSize} ${height - boxMargin}" 
            fill="none" stroke="#6b21a8" stroke-width="3"/>
      <!-- 角の装飾（右下） -->
      <path d="M ${width - boxMargin - cornerSize} ${height - boxMargin} L ${width - boxMargin} ${height - boxMargin} L ${width - boxMargin} ${height - boxMargin - cornerSize}" 
            fill="none" stroke="#6b21a8" stroke-width="3"/>
      <!-- テキスト -->
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
  fontSize: number = 16,
  fontFamily: string = 'Noto Sans CJK JP'
): string {
  const padding = 20;
  const maxWidth = width - padding * 2;
  const lines = wrapText(text, maxWidth, fontSize);

  // 最大3行まで
  const displayLines = lines.slice(0, 3);
  if (lines.length > 3) {
    displayLines[2] = displayLines[2].slice(0, -1) + '…';
  }

  const lineHeight = fontSize * 1.4;
  const totalTextHeight = displayLines.length * lineHeight;
  const startY = (height - totalTextHeight) / 2 + fontSize;

  const textElements = displayLines.map((line, i) => 
    `<text x="50%" y="${startY + i * lineHeight}" text-anchor="middle" 
           font-family="${fontFamily}" font-size="${fontSize}" font-weight="bold" 
           fill="#1a1a2e" dominant-baseline="middle">${escapeXml(line)}</text>`
  ).join('');

  // ギザギザのパスを生成（爆発風）
  const margin = 10;
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadiusX = (width / 2) - margin;
  const outerRadiusY = (height / 2) - margin;
  const innerRadiusX = outerRadiusX * 0.75;
  const innerRadiusY = outerRadiusY * 0.75;
  const spikes = 16;
  
  let path = '';
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
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
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <style type="text/css">
          text { font-family: '${fontFamily}', 'Arial', sans-serif; }
        </style>
      </defs>
      <!-- 影 -->
      <path d="${path}" fill="rgba(0,0,0,0.15)" transform="translate(3, 3)"/>
      <!-- メインの爆発形 -->
      <path d="${path}" fill="#fff5e6" stroke="#e63946" stroke-width="2.5"/>
      <!-- 内側のハイライト -->
      <ellipse cx="${centerX}" cy="${centerY}" rx="${innerRadiusX * 0.85}" ry="${innerRadiusY * 0.85}" 
               fill="none" stroke="rgba(230, 57, 70, 0.2)" stroke-width="1"/>
      <!-- テキスト -->
      ${textElements}
    </svg>
  `;
}
