import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  xAccessToken: text("xAccessToken"), // X API access token for sharing
  xRefreshToken: text("xRefreshToken"), // X API refresh token
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 制作中の漫画プロジェクト
 */
export const mangaProjects = mysqlTable("manga_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectTitle: varchar("projectTitle", { length: 255 }).notNull(),
  sourceNewsUrl: text("sourceNewsUrl").notNull(),
  newsContent: text("newsContent"), // キャッシュされたニュース内容
  plotDescription: text("plotDescription"), // AIが生成したプロット説明
  status: mysqlEnum("status", ["draft", "in_progress", "completed"]).default("draft").notNull(),
  styleSettings: text("styleSettings"), // JSON形式のスタイル設定
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MangaProject = typeof mangaProjects.$inferSelect;
export type InsertMangaProject = typeof mangaProjects.$inferInsert;

/**
 * 各コマのデータ
 */
export const mangaPanels = mysqlTable("manga_panels", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  panelNumber: int("panelNumber").notNull(), // コマの順序
  imagePrompt: text("imagePrompt").notNull(), // 画像生成用プロンプト
  generatedImageUrl: text("generatedImageUrl"), // 生成された画像のURL
  dialogueText: text("dialogueText"), // キャラクターのセリフ
  dialoguePosition: varchar("dialoguePosition", { length: 50 }).default("top"), // 吹き出しの位置
  finalImageUrl: text("finalImageUrl"), // セリフが合成された最終画像
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MangaPanel = typeof mangaPanels.$inferSelect;
export type InsertMangaPanel = typeof mangaPanels.$inferInsert;

/**
 * 完成・アーカイブされた漫画
 */
export const completedManga = mysqlTable("completed_manga", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  sourceNewsUrl: text("sourceNewsUrl").notNull(),
  finalImageUrl: text("finalImageUrl").notNull(), // 完成した漫画の画像
  xPostId: varchar("xPostId", { length: 100 }), // X投稿ID
  xSharedAt: timestamp("xSharedAt"), // X共有日時
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompletedManga = typeof completedManga.$inferSelect;
export type InsertCompletedManga = typeof completedManga.$inferInsert;

/**
 * リレーション定義
 */
export const usersRelations = relations(users, ({ many }) => ({
  mangaProjects: many(mangaProjects),
  completedManga: many(completedManga),
}));

export const mangaProjectsRelations = relations(mangaProjects, ({ one, many }) => ({
  user: one(users, {
    fields: [mangaProjects.userId],
    references: [users.id],
  }),
  panels: many(mangaPanels),
}));

export const mangaPanelsRelations = relations(mangaPanels, ({ one }) => ({
  project: one(mangaProjects, {
    fields: [mangaPanels.projectId],
    references: [mangaProjects.id],
  }),
}));

export const completedMangaRelations = relations(completedManga, ({ one }) => ({
  user: one(users, {
    fields: [completedManga.userId],
    references: [users.id],
  }),
  project: one(mangaProjects, {
    fields: [completedManga.projectId],
    references: [mangaProjects.id],
  }),
}));
