import { describe, it, expect } from 'vitest';
import { createRoundBubble, createSquareBubble, createJaggedBubble } from './bubble-shapes';

describe('Bubble Shapes', () => {
  describe('createRoundBubble', () => {
    it('should generate valid SVG with rect element (not ellipse)', () => {
      const svg = createRoundBubble('テストメッセージ', 400, 80, 16);
      
      // SVGが生成されていることを確認
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      
      // 楕円形ではなく四角形（rect）を使用していることを確認
      expect(svg).toContain('<rect');
      expect(svg).not.toContain('<ellipse');
      
      // テキストが含まれていることを確認
      expect(svg).toContain('テストメッセージ');
      
      // 角丸が設定されていることを確認
      expect(svg).toContain('rx=');
      expect(svg).toContain('ry=');
    });

    it('should handle Japanese text correctly', () => {
      const svg = createRoundBubble('日本語のテキストです', 400, 80, 16);
      
      expect(svg).toContain('日本語のテキストです');
      expect(svg).toContain('Noto Sans CJK JP');
    });

    it('should handle long text with wrapping', () => {
      const longText = 'これはとても長いテキストで、複数行に折り返される必要があります。';
      const svg = createRoundBubble(longText, 200, 80, 16);
      
      // 複数のtextタグが生成されていることを確認（折り返し）
      const textMatches = svg.match(/<text/g);
      expect(textMatches).toBeTruthy();
      expect(textMatches!.length).toBeGreaterThanOrEqual(1);
    });

    it('should include shadow and decoration elements', () => {
      const svg = createRoundBubble('Test', 400, 80, 16);
      
      // 影が含まれていることを確認
      expect(svg).toContain('rgba(0,0,0,0.15)');
      
      // 装飾色（紫）が含まれていることを確認
      expect(svg).toContain('#6b21a8');
    });
  });

  describe('createSquareBubble', () => {
    it('should generate valid SVG with square corners decoration', () => {
      const svg = createSquareBubble('角型テスト', 400, 80, 16);
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('<rect');
      
      // 角の装飾（path）が含まれていることを確認
      expect(svg).toContain('<path');
      expect(svg).toContain('角型テスト');
    });

    it('should have corner decorations', () => {
      const svg = createSquareBubble('Test', 400, 80, 16);
      
      // 4つの角の装飾があることを確認
      const pathMatches = svg.match(/<path/g);
      expect(pathMatches).toBeTruthy();
      expect(pathMatches!.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('createJaggedBubble', () => {
    it('should generate valid SVG with jagged/explosion shape', () => {
      const svg = createJaggedBubble('叫び！', 400, 80, 16);
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      
      // ギザギザのパスが含まれていることを確認
      expect(svg).toContain('<path');
      expect(svg).toContain('叫び！');
      
      // 強調用の赤色が含まれていることを確認
      expect(svg).toContain('#e63946');
    });

    it('should use bold font for emphasis', () => {
      const svg = createJaggedBubble('強調テキスト', 400, 80, 16);
      
      expect(svg).toContain('font-weight="bold"');
    });
  });

  describe('XML escaping', () => {
    it('should escape special characters in text', () => {
      const svg = createRoundBubble('<script>alert("test")</script>', 400, 80, 16);
      
      // 特殊文字がエスケープされていることを確認
      expect(svg).toContain('&lt;script&gt;');
      expect(svg).toContain('&quot;');
      expect(svg).not.toContain('<script>');
    });

    it('should escape ampersand', () => {
      const svg = createRoundBubble('A & B', 400, 80, 16);
      
      expect(svg).toContain('A &amp; B');
    });
  });
});
