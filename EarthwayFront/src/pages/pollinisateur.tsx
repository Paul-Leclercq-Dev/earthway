import { useEffect, useState } from "react"
import { NavLink } from "react-router-dom";
import NewsCard from "../components/NewsCard";
import { fetchNews } from "../services/newsService";
import { NewsArticle, NewsTheme } from "../types/news";
import pollinisateursImg from "../assets/image/accueil/pollinisateurs.png";
import ModalAbo from "../components/modalAbo";

const eduFacts = [
  { icon: '🐝', stat: '75%', label: 'des cultures alimentaires dépendent des pollinisateurs' },
  { icon: '🌸', stat: '300 000', label: 'espèces végétales pollinisées par les insectes' },
  { icon: '📉', stat: '-40%', label: 'de déclin des populations d\'abeilles en 20 ans' },
  { icon: '💶', stat: '153 Mrd€', label: 'de valeur économique annuelle de la pollinisation' },
];

export default function Pollinisateurs() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await fetchNews({
          theme: NewsTheme.POLLINATORS,
          search: search || undefined,
          page,
          limit: 12,
        });
        setArticles(data.data);
        setTotalPages(data.meta.totalPages);
      } catch {
        setError('Impossible de charger les articles. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    loadArticles();
  }, [search, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pt-16">
      {/* Hero éducatif */}
      <section className="relative">
        <img src={pollinisateursImg} alt="Pollinisateurs" className="w-full h-72 md:h-96 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/70 to-transparent flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            <span className="text-amber-200 text-sm font-medium uppercase tracking-wide">Thématique</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-1">Pollinisateurs</h1>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Intro pédagogique */}
        <section className="py-10 max-w-3xl">
          <p className="text-lg text-gray-700 leading-relaxed">
            Les pollinisateurs — abeilles, papillons, bourdons, syrphes — sont des acteurs 
            <strong> indispensables</strong> de nos écosystèmes. Sans eux, la reproduction de la majorité 
            des plantes à fleurs serait impossible, menaçant directement notre agriculture et notre biodiversité.
          </p>
          <p className="text-gray-600 mt-4 leading-relaxed">
            Pesticides, perte d'habitat, maladies, changement climatique : les pollinisateurs font face à 
            de multiples menaces. Leur déclin rapide est l'un des signaux les plus préoccupants de la 
            dégradation de notre environnement.
          </p>
        </section>

        {/* Chiffres clés */}
        <section className="py-6 border-t border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Chiffres clés</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {eduFacts.map((fact) => (
              <div key={fact.stat} className="bg-amber-50 rounded-xl p-4 text-center">
                <span className="text-2xl">{fact.icon}</span>
                <p className="text-xl font-bold text-amber-700 mt-1">{fact.stat}</p>
                <p className="text-xs text-gray-600 mt-1 leading-tight">{fact.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Actualités */}
        <section className="py-6 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🐝 Actualités Pollinisateurs</h2>

          {/* Barre de recherche */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-md">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher un article..."
              className="flex-grow text-sm border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-400 shadow-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              Rechercher
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </form>

          {/* Chargement */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Erreur */}
          {error && (
            <p className="text-center text-gray-500 py-10">{error}</p>
          )}

          {/* Articles */}
          {!loading && !error && articles.length === 0 && (
            <p className="text-center text-gray-500 py-10">Aucun article trouvé pour ces critères.</p>
          )}

          {!loading && !error && articles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:border-amber-400 hover:text-amber-600 transition-colors"
              >
                ← Précédent
              </button>
              <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:border-amber-400 hover:text-amber-600 transition-colors"
              >
                Suivant →
              </button>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="py-10 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-start">
          <NavLink
            to="/subscriptions"
            className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg shadow hover:bg-amber-700 transition-colors"
          >
            🐝 Protéger les pollinisateurs
          </NavLink>
          <NavLink
            to="/donations"
            className="px-6 py-3 bg-white text-amber-600 font-semibold rounded-lg border-2 border-amber-600 hover:bg-amber-50 transition-colors"
          >
            Faire un don
          </NavLink>
        </section>
      </div>

      <ModalAbo
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onDonate={() => setModalOpen(false)}
        onSubscribe={() => setModalOpen(false)}
        onManage={() => setModalOpen(false)}
      />
    </div>
  );
}

