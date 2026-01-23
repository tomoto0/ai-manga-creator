import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, mangaProjects, mangaPanels, completedManga, mangaTemplates, InsertMangaProject, InsertMangaPanel, InsertCompletedManga, InsertMangaTemplate } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Manga Projects
export async function createMangaProject(data: InsertMangaProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(mangaProjects).values(data);
  // 挿入後、作成されたプロジェクトを取得
  const projects = await db.select().from(mangaProjects).where(eq(mangaProjects.userId, data.userId)).orderBy(desc(mangaProjects.id)).limit(1);
  return projects.length > 0 ? projects[0] : { id: 0, ...data, createdAt: new Date(), updatedAt: new Date() };
}

export async function getMangaProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(mangaProjects).where(eq(mangaProjects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserMangaProjects(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(mangaProjects).where(eq(mangaProjects.userId, userId)).orderBy(desc(mangaProjects.createdAt));
}

export async function updateMangaProject(id: number, data: Partial<InsertMangaProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(mangaProjects).set({ ...data, updatedAt: new Date() }).where(eq(mangaProjects.id, id));
}

// Manga Panels
export async function createMangaPanel(data: InsertMangaPanel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(mangaPanels).values(data);
  return data;
}

export async function getProjectPanels(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(mangaPanels).where(eq(mangaPanels.projectId, projectId)).orderBy(mangaPanels.panelNumber);
}

export async function updateMangaPanel(id: number, data: Partial<InsertMangaPanel>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(mangaPanels).set({ ...data, updatedAt: new Date() }).where(eq(mangaPanels.id, id));
}

// Completed Manga
export async function createCompletedManga(data: InsertCompletedManga) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(completedManga).values(data);
  // 挿入後、作成された漫画を取得
  const manga = await db.select().from(completedManga).where(eq(completedManga.userId, data.userId)).orderBy(desc(completedManga.id)).limit(1);
  return manga.length > 0 ? manga[0] : { id: 0, ...data, createdAt: new Date(), updatedAt: new Date() };
}

export async function getUserCompletedManga(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(completedManga).where(eq(completedManga.userId, userId)).orderBy(desc(completedManga.createdAt));
}

export async function getCompletedManga(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(completedManga).where(eq(completedManga.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCompletedManga(id: number, data: Partial<InsertCompletedManga>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(completedManga).set({ ...data, updatedAt: new Date() }).where(eq(completedManga.id, id));
}

// Template operations
export async function createTemplate(data: InsertMangaTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mangaTemplates).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function getUserTemplates(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(mangaTemplates).where(eq(mangaTemplates.userId, userId)).orderBy(desc(mangaTemplates.createdAt));
}

export async function getPublicTemplates() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(mangaTemplates).where(eq(mangaTemplates.isPublic, true)).orderBy(desc(mangaTemplates.usageCount));
}

export async function getTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(mangaTemplates).where(eq(mangaTemplates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTemplate(id: number, data: Partial<InsertMangaTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(mangaTemplates).set({ ...data, updatedAt: new Date() }).where(eq(mangaTemplates.id, id));
}

export async function deleteTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(mangaTemplates).where(eq(mangaTemplates.id, id));
}

export async function incrementTemplateUsage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const template = await getTemplate(id);
  if (template) {
    return db.update(mangaTemplates).set({ usageCount: (template.usageCount || 0) + 1 }).where(eq(mangaTemplates.id, id));
  }
}
