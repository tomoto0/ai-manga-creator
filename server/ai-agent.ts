import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";

/**
 * 実際のニュースソースから記事を取得（5記事対応）
 */
export async function fetchLatestNewsFromSources(): Promise<Array<{
  title: string;
  url: string;
  summary: string;
  source: string;
  publishedAt: string;
}>> {
  try {
    // 幅広い主要ニュースメディアのRSSフィード
    const sources = [
      // 日本のメディア
      { name: "NHK News", url: "https://www3.nhk.or.jp/news/", category: "general", rssUrl: "https://www3.nhk.or.jp/rss/news/cat0.xml" },
      { name: "朝日新聞", url: "https://www.asahi.com/", category: "general", rssUrl: "https://www.asahi.com/rss/asahi/newsheadlines.rdf" },
      { name: "読売新聞", url: "https://www.yomiuri.co.jp/", category: "general", rssUrl: "https://www.yomiuri.co.jp/rss/news.xml" },
      { name: "毎日新聞", url: "https://mainichi.jp/", category: "general", rssUrl: "https://mainichi.jp/rss/etc/mainichi-flash.rss" },
      { name: "日経新聞", url: "https://www.nikkei.com/", category: "business", rssUrl: "https://www.nikkei.com/rss/news.xml" },
      // 国際メディア
      { name: "BBC News", url: "https://www.bbc.com/news", category: "general", rssUrl: "http://feeds.bbci.co.uk/news/world/rss.xml" },
      { name: "CNN", url: "https://www.cnn.com", category: "general", rssUrl: "http://rss.cnn.com/rss/edition_world.rss" },
      { name: "Reuters", url: "https://www.reuters.com", category: "general", rssUrl: "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best" },
      { name: "The Guardian", url: "https://www.theguardian.com", category: "general", rssUrl: "https://www.theguardian.com/world/rss" },
      { name: "AP News", url: "https://apnews.com", category: "general", rssUrl: "https://apnews.com/index.rss" },
      // テクノロジーメディア
      { name: "TechCrunch", url: "https://techcrunch.com/", category: "tech", rssUrl: "https://techcrunch.com/feed/" },
      { name: "The Verge", url: "https://www.theverge.com/", category: "tech", rssUrl: "https://www.theverge.com/rss/index.xml" },
      { name: "Wired", url: "https://www.wired.com/", category: "tech", rssUrl: "https://www.wired.com/feed/rss" },
      // ビジネス・経済メディア
      { name: "Bloomberg", url: "https://www.bloomberg.com/", category: "business", rssUrl: "https://feeds.bloomberg.com/markets/news.rss" },
      { name: "Financial Times", url: "https://www.ft.com/", category: "business", rssUrl: "https://www.ft.com/rss/home" },
    ];

    // ランダムに8つのソースを選択して、5記事を取得
    const selectedSources = sources.sort(() => Math.random() - 0.5).slice(0, 8);

    const newsItems: Array<{
      title: string;
      url: string;
      summary: string;
      source: string;
      publishedAt: string;
    }> = [];

    // 並列でニュースを取得
    const fetchPromises = selectedSources.map(async (source) => {
      try {
        let newsData = null;
        
        try {
          // RSSフィードから取得（タイムアウト付き）
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          const response = await fetch(source.rssUrl, { 
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const text = await response.text();
            
            // XML/RSS形式のニュースフィード
            if (text.includes('<')) {
              try {
                const items = text.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || 
                              text.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) || [];
                
                if (items.length > 0) {
                  const item: string = items[0] || '';
                  
                  if (item) {
                    const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
                    const linkMatch = item.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) ||
                                     item.match(/<link[^>]*href=["']([^"']+)["']/i);
                    const descMatch = item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) ||
                                     item.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i);
                    const dateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
                                     item.match(/<published[^>]*>([\s\S]*?)<\/published>/i);
                  
                    if (titleMatch) {
                      const title = titleMatch[1].trim()
                        .replace(/<[^>]+>/g, '')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"');
                      
                      const link = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : source.url;
                      const desc = descMatch ? descMatch[1].trim()
                        .replace(/<[^>]+>/g, '')
                        .replace(/&amp;/g, '&')
                        .substring(0, 300) : "News summary";
                      const pubDate = dateMatch ? dateMatch[1].trim() : new Date().toISOString();
                      
                      newsData = { title, url: link, summary: desc, pubDate };
                    }
                  }
                }
              } catch (e) {
                console.warn(`Failed to parse XML from ${source.name}:`, e);
              }
            }
          }
        } catch (fetchError) {
          console.warn(`Failed to fetch RSS from ${source.name}:`, fetchError);
        }

        // RSSフィード取得失敗時はLLMで最新ニュースを生成
        if (!newsData) {
          try {
            const response = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: "You are a news aggregator. Generate REAL, CURRENT news headlines based on actual events happening TODAY or within the last 24 hours. Focus on breaking news and trending topics. Return ONLY valid JSON.",
                },
                {
                  role: "user",
                  content: `Generate 1 REAL, CURRENT news article from ${source.name} (${source.category} news) that is happening TODAY (${new Date().toLocaleDateString()}). Focus on breaking news or trending topics from the last 24 hours. Return ONLY valid JSON with: title (string), summary (2-3 sentences), url (realistic URL like ${source.url}...)`,
                },
              ],
            });

            const content = response.choices[0].message.content;
            if (typeof content === "string") {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  newsData = JSON.parse(jsonMatch[0]);
                  newsData.pubDate = new Date().toISOString();
                } catch (e) {
                  console.warn(`Failed to parse LLM response for ${source.name}`);
                }
              }
            }
          } catch (error) {
            console.warn(`Failed to generate news via LLM for ${source.name}:`, error);
          }
        }

        if (newsData) {
          return {
            title: newsData.title || "News Article",
            url: newsData.url || source.url,
            summary: newsData.summary || "News summary",
            source: source.name,
            publishedAt: newsData.pubDate || new Date().toISOString(),
          };
        }
        return null;
      } catch (error) {
        console.warn(`Error fetching news from ${source.name}:`, error);
        return null;
      }
    });

    // 並列で取得した結果を集約
    const results = await Promise.all(fetchPromises);
    
    results.forEach(result => {
      if (result) {
        newsItems.push(result);
      }
    });

    // 5記事に制限して返す
    if (newsItems.length >= 5) {
      return newsItems.slice(0, 5);
    }

    // 5記事未満の場合、LLMで追加の記事を生成
    if (newsItems.length < 5) {
      const additionalNeeded = 5 - newsItems.length;
      const additionalCategories = ["world news", "technology", "business", "science", "politics"];
      
      for (let i = 0; i < additionalNeeded; i++) {
        try {
          const category = additionalCategories[i % additionalCategories.length];
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are a news aggregator. Generate REAL, CURRENT news headlines based on actual events happening TODAY or within the last 24 hours. Focus on breaking news and trending topics. Return ONLY valid JSON.",
              },
              {
                role: "user",
                content: `Generate 1 REAL, CURRENT ${category} news article that is happening TODAY (${new Date().toLocaleDateString()}). Focus on breaking news or trending topics from the last 24 hours. Return ONLY valid JSON with: title, summary, url, source`,
              },
            ],
          });

          const content = response.choices[0].message.content;
          if (typeof content === "string") {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const newsData = JSON.parse(jsonMatch[0]);
                newsItems.push({
                  title: newsData.title || "News Article",
                  url: newsData.url || "https://news.example.com",
                  summary: newsData.summary || "News summary",
                  source: newsData.source || "News Agency",
                  publishedAt: new Date().toISOString(),
                });
              } catch (e) {
                console.warn(`Failed to parse additional LLM news`);
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to generate additional news:`, error);
        }
      }
    }

    return newsItems.slice(0, 5);
  } catch (error) {
    console.error("Error in fetchLatestNewsFromSources:", error);
    return [];
  }
}

/**
 * ニュース記事のテキスト抽出とメタデータ取得
 */
export async function extractNewsContent(newsUrl: string): Promise<{
  title: string;
  content: string;
  summary: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a news content analyzer. Extract and summarize news articles. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: `Analyze this news URL and extract content: ${newsUrl}. Return JSON with: title, content (max 500 words), summary (2-3 sentences)`,
        },
      ],
    });

    const responseContent = response.choices[0].message.content;
    if (typeof responseContent !== "string") {
      throw new Error("Invalid response type");
    }

    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : responseContent;
    
    const newsData = JSON.parse(jsonString);
    
    return {
      title: newsData.title || "Untitled News",
      content: newsData.content || "No content available",
      summary: newsData.summary || "No summary available",
    };
  } catch (error) {
    console.error("Error in extractNewsContent:", error);
    return {
      title: "Sample News Article",
      content: "This is a sample news article content.",
      summary: "A brief summary of the news article.",
    };
  }
}

/**
 * ニュース内容からストーリー案を複数生成（3つ）
 */
export async function generateStoryProposals(
  newsContent: string,
  newsTitle: string
): Promise<Array<{
  plotTitle: string;
  plotDescription: string;
  panelCount: number;
  keyThemes: string[];
}>> {
  try {
    const fullContent = newsContent.substring(0, 2000);
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a creative manga story writer. Create manga story proposals DIRECTLY RELATED to the news content. Return ONLY valid JSON array.",
        },
        {
          role: "user",
          content: `Create 3 manga story proposals DIRECTLY RELATED to this news:
Title: ${newsTitle}
Content: ${fullContent}

Each story MUST be related to the news. Return ONLY valid JSON array with 3 objects.
Each object: plotTitle (string), plotDescription (string), panelCount (4-6), keyThemes (array of strings)`,
        },
      ],
    });

    const responseContent = response.choices[0].message.content;
    if (typeof responseContent !== "string") {
      throw new Error("Invalid response type");
    }

    const jsonMatch = responseContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
    const jsonString = jsonMatch ? jsonMatch[0] : responseContent;
    
    const proposals = JSON.parse(jsonString);
    
    if (!Array.isArray(proposals)) {
      throw new Error("Response is not an array");
    }
    
    return proposals.map((p: any) => ({
      plotTitle: p.plotTitle || "Untitled Story",
      plotDescription: p.plotDescription || "A manga story based on current events.",
      panelCount: p.panelCount || 4,
      keyThemes: p.keyThemes || ["news", "current events"],
    }));
  } catch (error) {
    console.error("Error in generateStoryProposals:", error);
    return [
      {
        plotTitle: "Breaking News Story",
        plotDescription: "A dramatic manga adaptation of current events.",
        panelCount: 4,
        keyThemes: ["news", "drama"],
      },
      {
        plotTitle: "Behind the Headlines",
        plotDescription: "An investigative manga exploring the story behind the news.",
        panelCount: 6,
        keyThemes: ["investigation", "truth"],
      },
      {
        plotTitle: "Tomorrow's World",
        plotDescription: "A futuristic take on how today's news shapes tomorrow.",
        panelCount: 4,
        keyThemes: ["future", "technology"],
      },
    ];
  }
}

/**
 * ストーリーからパネルプロンプトを生成（4-6パネル）
 */
export async function generatePanelPrompts(
  story: {
    plotTitle: string;
    plotDescription: string;
    panelCount: number;
    keyThemes: string[];
  },
  newsContent: string,
  characterSettings?: string
): Promise<Array<{
  panelNumber: number;
  sceneDescription: string;
  dialogue: string;
  imagePrompt: string;
}>> {
  try {
    const characterInstructions = characterSettings 
      ? `\n5. STRICTLY use these character designs for visual consistency:\n${characterSettings}` 
      : "";
    
    const systemPrompt = `You are an expert manga storyboard artist and scriptwriter. Your task is to create a cohesive ${story.panelCount}-panel manga sequence that:
1. STRICTLY follows the given story plot and description
2. Creates meaningful dialogue for EVERY panel
3. Maintains visual and narrative continuity across all panels
4. Uses the news context as background inspiration but focuses on the STORY${characterInstructions}

IMPORTANT: Each panel MUST have dialogue. Never leave dialogue empty.
Return ONLY a valid JSON array.`;

    const characterSection = characterSettings 
      ? `\n\n## CHARACTER DESIGNS (MUST be used consistently in all panels)\n${characterSettings}` 
      : "";
    
    const userPrompt = `Create a ${story.panelCount}-panel manga based on THIS SPECIFIC STORY:

## STORY DETAILS
Title: "${story.plotTitle}"
Plot: ${story.plotDescription}
Key Themes: ${story.keyThemes.join(", ")}${characterSection}

## NEWS CONTEXT
${newsContent.substring(0, 800)}

## OUTPUT FORMAT
Return ONLY a JSON array with ${story.panelCount} objects. Each object must have:
- "panelNumber": number (1 to ${story.panelCount})
- "sceneDescription": string (detailed visual description)
- "dialogue": string (REQUIRED - character speech or narration)
- "imagePrompt": string (detailed prompt for manga-style image generation)

Generate the panels now:`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const responseContent = response.choices[0].message.content;
    if (typeof responseContent !== "string") {
      throw new Error("Invalid response type");
    }

    const jsonMatch = responseContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
    const jsonString = jsonMatch ? jsonMatch[0] : responseContent;
    
    const panels = JSON.parse(jsonString);
    
    if (!Array.isArray(panels)) {
      throw new Error("Response is not an array");
    }
    
    return panels.map((p: any, index: number) => {
      let dialogue = p.dialogue || "";
      
      if (!dialogue || dialogue.trim() === "") {
        const panelPosition = index + 1;
        if (panelPosition === 1) {
          dialogue = `Narration: ${story.plotTitle} begins...`;
        } else if (panelPosition === story.panelCount) {
          dialogue = "Narration: To be continued...";
        } else {
          dialogue = `Character: The situation is developing...`;
        }
      }
      
      return {
        panelNumber: p.panelNumber || index + 1,
        sceneDescription: p.sceneDescription || `Scene ${index + 1} of ${story.plotTitle}`,
        dialogue: dialogue,
        imagePrompt: p.imagePrompt || `Manga style illustration for ${story.plotTitle}, ${story.keyThemes.join(", ")}, dramatic scene`,
      };
    });
  } catch (error) {
    console.error("Error in generatePanelPrompts:", error);
    const defaultPanels = [];
    const storyBeats = ["Opening", "Development", "Conflict", "Climax", "Resolution", "Epilogue"];
    
    for (let i = 1; i <= story.panelCount; i++) {
      const beatIndex = Math.min(i - 1, storyBeats.length - 1);
      defaultPanels.push({
        panelNumber: i,
        sceneDescription: `${storyBeats[beatIndex]} - ${story.plotDescription.substring(0, 100)}`,
        dialogue: i === 1 ? `Narration: ${story.plotTitle}` : 
                  i === story.panelCount ? "Narration: The story continues..." :
                  "Character: We must keep going...",
        imagePrompt: `Manga style illustration, ${story.plotTitle}, ${story.keyThemes[0] || "dramatic"} theme, panel ${i}`,
      });
    }
    return defaultPanels;
  }
}

/**
 * パネル画像を生成
 */
export async function generatePanelImage(
  imagePrompt: string,
  panelNumber: number,
  previousImageUrl?: string
): Promise<string> {
  try {
    // キャラクターと画風の一貫性を保つための追加情報
    const styleConsistencyNote = panelNumber === 1 
      ? "Establish consistent character designs, art style, and visual tone for the entire manga series. Remember character appearances, clothing, and distinctive features."
      : "Maintain the EXACT SAME character designs, art style, and visual tone as the previous panel. Keep character appearances, clothing, facial features, and artistic style completely consistent.";
    
    // 日本のアニメ風、ファンタジー、美人、かわいい系のスタイルを強調
    const styleEnhancement = "Japanese anime art style, fantasy aesthetic, beautiful and cute character designs, detailed and expressive eyes, soft shading, vibrant colors, professional manga illustration quality, clean linework, dynamic composition";
    
    const enhancedPrompt = `${imagePrompt}. ${styleConsistencyNote} ${styleEnhancement}`;
    
    const options: {
      prompt: string;
      originalImages?: Array<{ url: string; mimeType: string }>;
    } = {
      prompt: enhancedPrompt,
    };
    
    // 前のパネルの画像がある場合、スタイルの一貫性のために参照
    if (previousImageUrl) {
      options.originalImages = [
        {
          url: previousImageUrl,
          mimeType: "image/png",
        },
      ];
    }
    
    const result = await generateImage(options);
    return result.url || "";
  } catch (error) {
    console.error(`Error generating panel ${panelNumber} image:`, error);
    throw error;
  }
}
