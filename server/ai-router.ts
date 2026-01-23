import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as aiAgent from "./ai-agent";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";

export const aiRouter = router({
  /**
   * ニュースURLからコンテンツを抽出
   */
  extractNews: protectedProcedure
    .input(z.object({
      newsUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      try {
        const newsContent = await aiAgent.extractNewsContent(input.newsUrl);
        return newsContent;
      } catch (error) {
        console.error("Failed to extract news:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to extract news content",
        });
      }
    }),

  /**
   * ニュースからストーリー案を生成（3つ）
   */
  generateStoryProposals: protectedProcedure
    .input(z.object({
      newsContent: z.string().min(10),
      newsTitle: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      try {
        const proposals = await aiAgent.generateStoryProposals(
          input.newsContent,
          input.newsTitle
        );
        return proposals;
      } catch (error) {
        console.error("Failed to generate story proposals:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate story proposals",
        });
      }
    }),

  /**
   * ストーリーからパネルプロンプトを生成（4-6パネル）
   */
  generatePanelPrompts: protectedProcedure
    .input(z.object({
      plotTitle: z.string().min(1),
      plotDescription: z.string().min(10),
      panelCount: z.number().min(1).max(10),
      keyThemes: z.array(z.string()).optional(),
      newsContent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const story = {
          plotTitle: input.plotTitle,
          plotDescription: input.plotDescription,
          panelCount: input.panelCount,
          keyThemes: input.keyThemes || [],
        };
        const prompts = await aiAgent.generatePanelPrompts(
          story,
          input.newsContent || ""
        );
        return prompts;
      } catch (error) {
        console.error("Failed to generate panel prompts:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate panel prompts",
        });
      }
    }),

  /**
   * 画像を生成（前のコマの画像を参照して一貫性を確保）
   */
  generateImage: protectedProcedure
    .input(z.object({
      prompt: z.string().min(1),
      previousImageUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const generateOptions: any = {
          prompt: input.prompt,
        };

        if (input.previousImageUrl) {
          generateOptions.originalImages = [
            {
              url: input.previousImageUrl,
              mimeType: "image/jpeg",
            },
          ];
        }

        const { url: generatedImageUrl } = await generateImage(generateOptions);

        let finalUrl = generatedImageUrl;
        try {
          if (!generatedImageUrl) {
            throw new Error('No image URL returned from generateImage');
          }
          const imageResponse = await fetch(generatedImageUrl);
          if (imageResponse.ok) {
            const imageBuffer = await imageResponse.arrayBuffer();
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(7);
            const fileKey = `manga-panels/${ctx.user?.id || 'anonymous'}/${timestamp}-${randomSuffix}.jpg`;
            
            const { url: s3Url } = await storagePut(fileKey, Buffer.from(imageBuffer), 'image/jpeg');
            finalUrl = s3Url;
          }
        } catch (storageError) {
          console.warn('Failed to save image to S3, using original URL:', storageError);
          if (!finalUrl) {
            throw new Error('Failed to get image URL');
          }
        }

        return { url: finalUrl || generatedImageUrl };
      } catch (error) {
        console.error("Failed to generate image:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate image",
        });
      }
    }),

  /**
   * プロジェクトにパネルを一括作成
   */
  createPanelsFromPrompts: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      panelPrompts: z.array(z.object({
        panelNumber: z.number(),
        imagePrompt: z.string(),
        suggestedDialogue: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      try {
        const panels = [];
        for (const prompt of input.panelPrompts) {
          const result = await db.createMangaPanel({
            projectId: input.projectId,
            panelNumber: prompt.panelNumber,
            imagePrompt: prompt.imagePrompt,
            dialogueText: prompt.suggestedDialogue || "",
            generatedImageUrl: "",
          });
          panels.push(result);
        }
        return panels;
      } catch (error) {
        console.error("Failed to create panels:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create panels",
        });
      }
    }),

  /**
   * 最新ニュースを取得（5記事）
   */
  fetchLatestNews: protectedProcedure
    .input(z.object({}))
    .mutation(async () => {
      try {
        const newsItems = await aiAgent.fetchLatestNewsFromSources();
        return newsItems;
      } catch (error) {
        console.error("Failed to fetch latest news:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch latest news",
        });
      }
    }),

  /**
   * 画像をBase64で取得（CORS回避用プロキシ）
   */
  getImageAsBase64: protectedProcedure
    .input(z.object({
      imageUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(input.imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const contentType = response.headers.get('content-type') || 'image/png';
        return {
          base64: `data:${contentType};base64,${base64}`,
          contentType,
        };
      } catch (error) {
        console.error("Failed to fetch image as base64:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch image",
        });
      }
    }),
});
