/**
 * JPEG形式で漫画を生成するモジュール
 * sharpを使用して複数のパネルを1枚のJPEG画像に合成
 */

import sharp from 'sharp';
import { createRoundBubble, createSquareBubble, createJaggedBubble } from './bubble-shapes';

interface PanelData {
  panelNumber: number;
  imageUrl?: string;
  dialogue: string;
  dialoguePosition?: "top" | "middle" | "bottom";
  bubbleShape?: "round" | "square" | "jagged";
}

type LayoutType = "2x2" | "2x3" | "3x2" | "1-column";

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
 * プレースホルダー画像を生成（SVGの代わりにPNGで直接生成）
 */
async function createPlaceholder(width: number, height: number, text: string): Promise<Buffer> {
  // SVGの代わりに、sharpで直接PNG画像を作成
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          text { font-family: 'Noto Sans CJK JP', 'Arial', sans-serif; }
        </style>
      </defs>
      <rect width="100%" height="100%" fill="#e0e0e0"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
            font-size="16" fill="#666666">${escapeXml(text)}</text>
    </svg>
  `;
  
  try {
    return await sharp(Buffer.from(svg), { density: 150 })
      .png()
      .toBuffer();
  } catch (error) {
    console.error('Error creating placeholder:', error);
    // フォールバック：単色画像を返す
    return await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 224, g: 224, b: 224 },
      },
    })
      .png()
      .toBuffer();
  }
}

/**
 * XMLエスケープ処理
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
 * テキストをSVGとして生成
 */
function createTextSvg(text: string, width: number, height: number, options: {
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: string;
  backgroundColor?: string;
  borderColor?: string;
} = {}): Buffer {
  const {
    fontSize = 16,
    fontWeight = 'normal',
    color = '#1a1a2e',
    backgroundColor = '#ffffff',
    borderColor = '#cccccc',
  } = options;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          text { font-family: 'Noto Sans CJK JP', 'Arial', sans-serif; }
        </style>
      </defs>
      <rect width="100%" height="100%" fill="${backgroundColor}" stroke="${borderColor}" stroke-width="1"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
            font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}">${escapeXml(text)}</text>
    </svg>
  `;

  return Buffer.from(svg);
}

/**
 * セリフボックスを生成
 */
async function createDialogueSvg(
  dialogue: string,
  width: number,
  height: number,
  bubbleShape: "round" | "square" | "jagged" = "square"
): Promise<Buffer> {
  let bubbleSvg: string;

  switch (bubbleShape) {
    case "round":
      bubbleSvg = createRoundBubble(dialogue, width, height);
      break;
    case "jagged":
      bubbleSvg = createJaggedBubble(dialogue, width, height);
      break;
    case "square":
    default:
      bubbleSvg = createSquareBubble(dialogue, width, height);
      break;
  }

  return Buffer.from(bubbleSvg);
}

/**
 * 漫画パネルをJPEG形式で生成
 * sharpを使用して画像を合成
 */
export async function generateMangaJPEG(
  panels: PanelData[],
  title: string,
  layout: LayoutType = "2x3"
): Promise<Buffer> {
  // レイアウト設定
  const panelCount = panels.length;
  let cols: number;
  let rows: number;
  
  switch (layout) {
    case "2x2":
      cols = 2;
      rows = Math.ceil(panelCount / 2);
      break;
    case "2x3":
      cols = 2;
      rows = Math.ceil(panelCount / 2);
      break;
    case "3x2":
      cols = 3;
      rows = Math.ceil(panelCount / 3);
      break;
    case "1-column":
      cols = 1;
      rows = panelCount;
      break;
    default:
      cols = panelCount <= 4 ? 2 : 3;
      rows = Math.ceil(panelCount / cols);
  }
  
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
  
  try {
    const titleBuffer = await sharp(titleSvg, { density: 150 })
      .png()
      .toBuffer();
    compositeImages.push({
      input: titleBuffer,
      top: 0,
      left: 0,
    });
  } catch (error) {
    console.error('Error rendering title:', error);
  }
  
  // パネルを処理
  for (let i = 0; i < panelCount; i++) {
    const panel = panels[i];
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    const x = padding + col * (panelWidth + padding);
    const y = titleHeight + padding + row * (panelHeight + dialogueHeight + panelNumberHeight + padding);
    
    // パネル画像を取得またはプレースホルダーを作成
    let panelImageBuffer: Buffer;
    
    if (panel.imageUrl) {
      const fetchedBuffer = await fetchImageBuffer(panel.imageUrl);
      if (fetchedBuffer) {
        try {
          panelImageBuffer = await sharp(fetchedBuffer)
            .resize(panelWidth, panelHeight, {
              fit: 'cover',
              position: 'center',
            })
            .png()
            .toBuffer();
        } catch (error) {
          console.error(`Error processing panel image ${i}:`, error);
          panelImageBuffer = await createPlaceholder(panelWidth, panelHeight, `Panel ${i + 1}`);
        }
      } else {
        panelImageBuffer = await createPlaceholder(panelWidth, panelHeight, `Panel ${i + 1}`);
      }
    } else {
      panelImageBuffer = await createPlaceholder(panelWidth, panelHeight, `Panel ${i + 1}`);
    }
    
    compositeImages.push({
      input: panelImageBuffer,
      top: y,
      left: x,
    });
    
    // パネル番号を追加
    const panelNumberSvg = createTextSvg(`Panel ${i + 1}`, panelWidth, panelNumberHeight, {
      fontSize: 12,
      color: '#666666',
    });
    
    try {
      const panelNumberBuffer = await sharp(panelNumberSvg, { density: 150 })
        .png()
        .toBuffer();
      compositeImages.push({
        input: panelNumberBuffer,
        top: y + panelHeight + 5,
        left: x,
      });
    } catch (error) {
      console.error(`Error rendering panel number ${i}:`, error);
    }
    
    // セリフボックスを追加
    if (panel.dialogue && panel.dialogue.trim()) {
      const dialogueTop = y + panelHeight + panelNumberHeight + 5;
      
      try {
        const dialogueSvgBuffer = await createDialogueSvg(
          panel.dialogue,
          panelWidth,
          dialogueHeight,
          panel.bubbleShape || 'square'
        );
        
        const dialogueBuffer = await sharp(dialogueSvgBuffer, { density: 150 })
          .png()
          .toBuffer();
        
        compositeImages.push({
          input: dialogueBuffer,
          top: Math.max(titleHeight + padding, dialogueTop),
          left: x,
        });
      } catch (error) {
        console.error(`Error rendering dialogue ${i}:`, error);
      }
    }
  }
  
  // 白い背景を作成して合成
  try {
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
  } catch (error) {
    console.error('Error compositing final image:', error);
    throw new Error(`Failed to generate JPEG: ${error instanceof Error ? error.message : String(error)}`);
  }
}
