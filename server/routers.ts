import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { aiRouter } from "./ai-router";
import { generateMangaJPEG } from "./jpeg-generator";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  ai: aiRouter,

  manga: router({
    // プロジェクト関連
    createProject: protectedProcedure
      .input(z.object({
        projectTitle: z.string().min(1),
        sourceNewsUrl: z.string().url(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createMangaProject({
          userId: ctx.user.id,
          projectTitle: input.projectTitle,
          sourceNewsUrl: input.sourceNewsUrl,
          status: "draft",
        });
      }),

    getProject: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getMangaProject(input.id);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return project;
      }),

    updateProject: protectedProcedure
      .input(z.object({
        id: z.number(),
        projectTitle: z.string().optional(),
        status: z.enum(["draft", "in_progress", "completed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getMangaProject(input.id);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const { id, ...updateData } = input;
        return db.updateMangaProject(id, updateData);
      }),

    // パネル関連
    createPanel: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        panelNumber: z.number(),
        imagePrompt: z.string(),
        dialogueText: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getMangaProject(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return db.createMangaPanel({
          projectId: input.projectId,
          panelNumber: input.panelNumber,
          imagePrompt: input.imagePrompt,
          dialogueText: input.dialogueText,
        });
      }),

    getProjectPanels: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getMangaProject(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return db.getProjectPanels(input.projectId);
      }),

    updatePanel: protectedProcedure
      .input(z.object({
        id: z.number(),
        projectId: z.number(),
        generatedImageUrl: z.string().optional(),
        dialogueText: z.string().optional(),
        dialoguePosition: z.string().optional(),
        finalImageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getMangaProject(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const { id, projectId, ...updateData } = input;
        return db.updateMangaPanel(id, updateData);
      }),

    // 完成漫画関連
    completeManga: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string().min(1),
        sourceNewsUrl: z.string().url(),
        finalImageUrl: z.string().url(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getMangaProject(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        // プロジェクトを完了状態に更新
        await db.updateMangaProject(input.projectId, { status: "completed" });
        // 完成漫画を作成
        return db.createCompletedManga({
          projectId: input.projectId,
          userId: ctx.user.id,
          title: input.title,
          sourceNewsUrl: input.sourceNewsUrl,
          finalImageUrl: input.finalImageUrl,
        });
      }),

    getGallery: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserCompletedManga(ctx.user.id);
      }),

    publishManga: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        panels: z.array(z.object({
          panelNumber: z.number(),
          sceneDescription: z.string(),
          imageUrl: z.string(),
          dialogue: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getMangaProject(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        // プロジェクトを完了状態に更新
        await db.updateMangaProject(input.projectId, { status: "completed" });
        // 完成漫画を作成
        return db.createCompletedManga({
          projectId: input.projectId,
          userId: ctx.user.id,
          title: project.projectTitle,
          sourceNewsUrl: project.sourceNewsUrl,
          finalImageUrl: input.panels[0]?.imageUrl || "",
        });
      }),

    shareToX: protectedProcedure
      .input(z.object({
        completedMangaId: z.number(),
        xPostId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const manga = await db.getCompletedManga(input.completedMangaId);
        if (!manga || manga.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return db.updateCompletedManga(input.completedMangaId, {
          xPostId: input.xPostId,
          xSharedAt: new Date(),
        });
      }),

    generateJPEG: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string().min(1),
        panels: z.array(z.object({
          panelNumber: z.number(),
          imageUrl: z.string().optional(),
          dialogue: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getMangaProject(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        try {
          const jpegBuffer = await generateMangaJPEG(input.panels, input.title);
          const jpegKey = `manga-jpegs/${ctx.user.id}/${input.projectId}/${Date.now()}.jpg`;
          const { url } = await storagePut(jpegKey, jpegBuffer, "image/jpeg");
          return { url, success: true };
        } catch (error) {
          console.error("JPEG generation failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "漫画生成に失敗しました" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
