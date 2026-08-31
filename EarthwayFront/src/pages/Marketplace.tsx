import { useEffect, useState } from 'react';
import marketplaceService, { Product } from '../services/marketplaceService';
import ProductCard from '../components/ProductCard';
import AdSlot from '../components/AdSlot';

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const themeOptions = [
    { value: 'all', label: 'Tous les produits', icon: '🌍' },
    { value: 'reforestation', label: 'Reforestation', icon: '🌳' },
    { value: 'oceans', label: 'Océans', icon: '🌊' },
    { value: 'zero_waste', label: 'Zéro déchet', icon: '♻️' },
    { value: 'renewable_energy', label: 'Énergie renouvelable', icon: '⚡' },
  ];

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await marketplaceService.fetchProducts();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedTheme === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter((p) => p.theme === selectedTheme));
    }
  }, [selectedTheme, products]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Marketplace éco-responsable 🛒
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Découvrez notre sélection de produits écologiques et durables.
          Chaque achat soutient des projets environnementaux via nos liens partenaires.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedTheme(option.value)}
              className={`px-5 py-2.5 rounded-lg font-medium transition ${
                selectedTheme === option.value
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-emerald-500 hover:text-emerald-600'
              }`}
            >
              <span className="mr-2">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-6 text-center">
        {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
      </p>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">Aucun produit trouvé pour ce filtre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <AdSlot placement="marketplace_footer" />

      {/* Info banner */}
      <div className="mt-12 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <p className="text-sm text-emerald-800">
          💚 Les liens d'achat sont affiliés : chaque commande génère une petite commission
          qui finance nos projets environnementaux sans coût supplémentaire pour vous.
        </p>
      </div>
    </div>
  );
}
