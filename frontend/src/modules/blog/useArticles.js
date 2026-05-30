/**
 * useArticles.js
 * Vite dynamic article loader.
 * Scans every .jsx file in the articles/ folder at build time.
 * Drop a new article JSX file → it automatically appears everywhere.
 */

const modules = import.meta.glob("./articles/*.jsx", { eager: true });

/**
 * Returns an array of { metadata, Component } for every article file.
 * Articles with missing or invalid metadata are silently skipped.
 */
export function getAllArticles() {
  return Object.values(modules)
    .filter((mod) => mod.metadata && mod.default)
    .map((mod) => ({
      metadata:  mod.metadata,
      Component: mod.default,
    }))
    .sort((a, b) => new Date(b.metadata.date) - new Date(a.metadata.date));
}

/**
 * Returns { metadata, Component } for a single article by slug.
 * Returns null if not found.
 */
export function getArticleBySlug(slug) {
  return (
    getAllArticles().find((a) => a.metadata.slug === slug) || null
  );
}

/**
 * Returns a de-duplicated, sorted list of all tags across all articles.
 */
export function getAllTags() {
  const tagSet = new Set();
  getAllArticles().forEach((a) =>
    (a.metadata.tags || []).forEach((t) => tagSet.add(t))
  );
  return Array.from(tagSet).sort();
}

/**
 * Returns the N most recent articles (default 3).
 */
export function getRecentArticles(n = 3) {
  return getAllArticles().slice(0, n);
}
