/**
 * JPEG形式で漫画を生成するモジュール
 * 複数のパネルを1枚のJPEG画像に合成
 */

interface PanelData {
  panelNumber: number;
  imageUrl?: string;
  dialogue: string;
}

/**
 * 漫画パネルをJPEG形式で生成
 * サーバーサイドでCanvasを使用して画像を合成
 */
export async function generateMangaJPEG(
  panels: PanelData[],
  title: string
): Promise<Buffer> {
  // 動的にcanvasをインポート
  const { createCanvas, loadImage } = await import('canvas');
  
  // レイアウト設定
  const panelCount = panels.length;
  const cols = panelCount <= 4 ? 2 : 3;
  const rows = Math.ceil(panelCount / cols);
  
  const panelWidth = 400;
  const panelHeight = 400;
  const dialogueHeight = 80;
  const padding = 20;
  const titleHeight = 60;
  
  const canvasWidth = cols * panelWidth + (cols + 1) * padding;
  const canvasHeight = titleHeight + rows * (panelHeight + dialogueHeight) + (rows + 1) * padding;
  
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  
  // 背景を白で塗りつぶし
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // タイトルを描画
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, canvasWidth / 2, titleHeight - 15);
  
  // 各パネルを描画
  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    const x = padding + col * (panelWidth + padding);
    const y = titleHeight + padding + row * (panelHeight + dialogueHeight + padding);
    
    // パネル番号を描画
    ctx.fillStyle = '#6b21a8';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`#${panel.panelNumber}`, x + 5, y - 5);
    
    // パネル枠を描画
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, panelWidth, panelHeight);
    
    // 画像を読み込んで描画
    if (panel.imageUrl) {
      try {
        const img = await loadImage(panel.imageUrl);
        ctx.drawImage(img, x, y, panelWidth, panelHeight);
      } catch (error) {
        console.warn(`Failed to load image for panel ${panel.panelNumber}:`, error);
        // プレースホルダーを描画
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x, y, panelWidth, panelHeight);
        ctx.fillStyle = '#666666';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Image', x + panelWidth / 2, y + panelHeight / 2);
      }
    } else {
      // プレースホルダーを描画
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x, y, panelWidth, panelHeight);
      ctx.fillStyle = '#666666';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No Image', x + panelWidth / 2, y + panelHeight / 2);
    }
    
    // セリフボックスを描画
    const dialogueY = y + panelHeight + 5;
    
    // 吹き出し背景
    ctx.fillStyle = '#f8f8f8';
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    
    // 角丸の吹き出し
    const radius = 10;
    ctx.beginPath();
    ctx.moveTo(x + radius, dialogueY);
    ctx.lineTo(x + panelWidth - radius, dialogueY);
    ctx.quadraticCurveTo(x + panelWidth, dialogueY, x + panelWidth, dialogueY + radius);
    ctx.lineTo(x + panelWidth, dialogueY + dialogueHeight - radius);
    ctx.quadraticCurveTo(x + panelWidth, dialogueY + dialogueHeight, x + panelWidth - radius, dialogueY + dialogueHeight);
    ctx.lineTo(x + radius, dialogueY + dialogueHeight);
    ctx.quadraticCurveTo(x, dialogueY + dialogueHeight, x, dialogueY + dialogueHeight - radius);
    ctx.lineTo(x, dialogueY + radius);
    ctx.quadraticCurveTo(x, dialogueY, x + radius, dialogueY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // セリフテキストを描画（引用符を削除）
    const cleanDialogue = (panel.dialogue || '').replace(/^["']|["']$/g, '').trim();
    ctx.fillStyle = '#1a1a2e';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    
    // テキストを折り返し
    const maxWidth = panelWidth - 20;
    const words = cleanDialogue.split(' ');
    let line = '';
    let lineY = dialogueY + 25;
    const lineHeight = 18;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line.trim(), x + panelWidth / 2, lineY);
        line = word + ' ';
        lineY += lineHeight;
        if (lineY > dialogueY + dialogueHeight - 10) break;
      } else {
        line = testLine;
      }
    }
    if (lineY <= dialogueY + dialogueHeight - 10) {
      ctx.fillText(line.trim(), x + panelWidth / 2, lineY);
    }
  }
  
  // JPEGバッファを返す
  return canvas.toBuffer('image/jpeg', { quality: 0.9 });
}
