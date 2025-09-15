import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { KnowledgeArticle, KnowledgeArticleSchema } from "../domain/types.js";
import { logger } from "../utils/logger.js";

export class KnowledgeBaseService {
  private cache: KnowledgeArticle[] | null = null;

  constructor(private readonly dataPath: string) {}

  private loadFromDisk(): KnowledgeArticle[] {
    const absolutePath = resolve(process.cwd(), this.dataPath);
    const raw = readFileSync(absolutePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;

    const result = KnowledgeArticleSchema.array().safeParse(parsed);

    if (!result.success) {
      logger.error({ issues: result.error.issues }, "Failed to load knowledge base articles");
      throw new Error("Knowledge base validation failed");
    }

    logger.debug({ count: result.data.length }, "Loaded knowledge base articles");
    return result.data;
  }

  private ensureCache(): KnowledgeArticle[] {
    if (!this.cache) {
      this.cache = this.loadFromDisk();
    }

    return this.cache;
  }

  public search(query: string, limit = 5): KnowledgeArticle[] {
    const articles = this.ensureCache();
    const terms = query.toLowerCase().split(/\W+/).filter(Boolean);

    const scored = articles
      .map((article) => {
        const haystack = `${article.title} ${article.body} ${article.tags.join(" ")}`.toLowerCase();
        const score = terms.reduce((acc, term) => (haystack.includes(term) ? acc + 1 : acc), 0);
        return { article, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.article);

    return scored;
  }
}
