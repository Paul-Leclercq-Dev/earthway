import React, { useState, useEffect, useCallback } from 'react';
import NewsCard from '../components/NewsCard';
import AdSlot from '../components/AdSlot';
import { fetchNews } from '../services/newsService';
import { NewsArticle, NewsTheme } from '../types/news';

const THEMES: { value: NewsTheme | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: NewsTheme.REFORESTATION, label: '🌳 Reforestation' },
  { value: NewsTheme.OCEANS, label: '🌊 Océans' },
  { value: NewsTheme.POLLINATORS, label: '🐝 Pollinisateurs' },
  { value: NewsTheme.INNOVATIONS, label: '💡 Innovations' },
  { value: NewsTheme.GENERAL, label: '🌍 Général' },
];

const News: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTheme, setActiveTheme] = useState<NewsTheme | 'all'>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchNews({
        theme: activeTheme === 'all' ? undefined : activeTheme,
        search: search || undefined,
        page,
        limit: 12,
      });
      setArticles(data.data);
      setTotal(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch {
      setError('Impossible de charger les actualités. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [activeTheme, search, page]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [activeTheme, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pt-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          🌿 Actualités environnementales
        </h1>
        <p className="text-gray-600 mb-6">
          Les dernières nouvelles sur la biodiversité, le climat et les initiatives écologiques.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-lg">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher un article..."
            className="flex-grow text-sm border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-400 shadow-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Rechercher
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </form>

        {/* Theme filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {THEMES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveTheme(value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTheme === value
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!loading && !error && (
          <p className="text-sm text-gray-500 mb-4">
            {total} article{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}
          </p>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={loadNews}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-4/5" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Articles grid */}
        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-gray-500 text-lg">Aucun article trouvé pour ces critères.</p>
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, index) => (
                <React.Fragment key={article.id}>
                  <NewsCard article={article} />
                  {(index + 1) % 5 === 0 && index + 1 < articles.length && (
                    <div className="sm:col-span-2 lg:col-span-3">
                      <AdSlot placement="news_feed" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {articles.length < 5 && <AdSlot placement="news_feed" />}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
            >
              ← Précédent
            </button>
            <span className="text-sm text-gray-600">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
