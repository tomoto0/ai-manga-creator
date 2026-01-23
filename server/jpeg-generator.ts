/**
 * JPEG形式で漫画を生成するモジュール
 * sharpを使用して複数のパネルを1枚のJPEG画像に合成
 */

import sharp from 'sharp';

interface PanelData {
  panelNumber: number;
  imageUrl?: string;
  dialogue: string;
}

/**
 * URLから画像をダウンロードしてバッファを取得
 */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${url}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.warn(`Error fetching image: ${url}`, error);
    return null;
  }
}

/**
 * プレースホルダー画像を生成
 */
async function createPlaceholder(width: number, height: number, text: string): Promise<Buffer> {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e0e0e0"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
            font-family="sans-serif" font-size="16" fill="#666666">${text}</text>
    </svg>
  `;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * テキストをSVGとして生成
 */
function createTextSvg(text: string, width: number, height: number, options: {
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  padding?: number;
  fontFamily?: string;
} = {}): string {
  const {
    fontSize = 14,
    fontWeight = 'normal',
    color = '#1a1a2e',
    textAlign = 'middle',
    backgroundColor = 'transparent',
    borderColor,
    borderRadius = 0,
    padding = 10,
    fontFamily = 'Noto Sans CJK JP, sans-serif',
  } = options;

  // テキストを折り返し
  const maxCharsPerLine = Math.floor((width - padding * 2) / (fontSize * 0.6));
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
    `<text x="50%" y="${startY + i * lineHeight}" text-anchor="${textAlign}" 
           font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" 
           fill="${color}">${escapeXml(line)}</text>`
  ).join('');

  let background = '';
  if (backgroundColor !== 'transparent' || borderColor) {
    background = `<rect x="0" y="0" width="${width}" height="${height}" 
                        fill="${backgroundColor}" 
                        ${borderColor ? `stroke="${borderColor}" stroke-width="2"` : ''}
                        ${borderRadius ? `rx="${borderRadius}" ry="${borderRadius}"` : ''}/>`;
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${background}
      ${textElements}
    </svg>
  `;
}

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
 * 漫画パネルをJPEG形式で生成
 * sharpを使用して画像を合成
 */
export async function generateMangaJPEG(
  panels: PanelData[],
  title: string
): Promise<Buffer> {
  // レイアウト設定
  const panelCount = panels.length;
  const cols = panelCount <= 4 ? 2 : 3;
  const rows = Math.ceil(panelCount / cols);
  
  const panelWidth = 400;
  const panelHeight = 400;
  const dialogueHeight = 80;
  const padding = 20;
  const titleHeight = 60;
  const panelNumberHeight = 25;
  
  const canvasWidth = cols * panelWidth + (cols + 1) * padding;
  const canvasHeight = titleHeight + rows * (panelHeight + dialogueHeight + panelNumberHeight) + (rows + 1) * padding;
  
  // 合成する画像のリスト
  const compositeImages: sharp.OverlayOptions[] = [];
  
  // タイトルを追加
  const titleSvg = createTextSvg(title, canvasWidth, titleHeight, {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
  });
  compositeImages.push({
    input: Buffer.from(titleSvg),
    top: 0,
    left: 0,
  });
  
  // 各パネルを処理
  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    const x = padding + col * (panelWidth + padding);
    const y = titleHeight + padding + row * (panelHeight + dialogueHeight + panelNumberHeight + padding);
    
    // パネル番号を追加
    const numberSvg = createTextSvg(`#${panel.panelNumber}`, 50, panelNumberHeight, {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#6b21a8',
    });
    compositeImages.push({
      input: Buffer.from(numberSvg),
      top: y,
      left: x,
    });
    
    // パネル画像を追加
    const panelY = y + panelNumberHeight;
    let panelImage: Buffer;
    
    if (panel.imageUrl) {
      const imageBuffer = await fetchImageBuffer(panel.imageUrl);
      if (imageBuffer) {
        // 画像をリサイズして枠を追加
        panelImage = await sharp(imageBuffer)
          .resize(panelWidth - 6, panelHeight - 6, { fit: 'cover' })
          .extend({
            top: 3,
            bottom: 3,
            left: 3,
            right: 3,
            background: { r: 26, g: 26, b: 46, alpha: 1 },
          })
          .png()
          .toBuffer();
      } else {
        panelImage = await createPlaceholder(panelWidth, panelHeight, 'Image Error');
      }
    } else {
      panelImage = await createPlaceholder(panelWidth, panelHeight, 'No Image');
    }
    
    compositeImages.push({
      input: panelImage,
      top: panelY,
      left: x,
    });
    
    // セリフボックスを追加
    const cleanDialogue = (panel.dialogue || '').replace(/^["']|["']$/g, '').trim();
    const dialogueSvg = createTextSvg(cleanDialogue || 'No dialogue', panelWidth, dialogueHeight, {
      fontSize: 14,
      color: '#1a1a2e',
      backgroundColor: '#f8f8f8',
      borderColor: '#1a1a2e',
      borderRadius: 10,
      padding: 10,
    });
    
    compositeImages.push({
      input: Buffer.from(dialogueSvg),
      top: panelY + panelHeight + 5,
      left: x,
    });
  }
  
  // 白い背景を作成して合成
  const result = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(compositeImages)
    .jpeg({ quality: 90 })
    .toBuffer();
  
  return result;
}
