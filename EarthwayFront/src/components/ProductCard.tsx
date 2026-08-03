import { Product } from '../services/marketplaceService';
import AffiliateLinkButton from './AffiliateLinkButton';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const themeLabels: Record<string, string> = {
    reforestation: '🌳 Reforestation',
    oceans: '🌊 Océans',
    zero_waste: '♻️ Zéro déchet',
    renewable_energy: '⚡ Énergie renouvelable',
  };

  const themeColors: Record<string, string> = {
    reforestation: 'bg-green-100 text-green-700',
    oceans: 'bg-blue-100 text-blue-700',
    zero_waste: 'bg-emerald-100 text-emerald-700',
    renewable_energy: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition group">
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <span
          className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${themeColors[product.theme] || 'bg-gray-100 text-gray-700'}`}
        >
          {themeLabels[product.theme] || product.theme}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Brand */}
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {product.brandName}
        </p>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-2xl font-bold text-emerald-600">
            {product.price.toFixed(2)} {product.currency}
          </span>
          <AffiliateLinkButton
            slug={product.affiliateLink?.slug}
            fallbackUrl={product.affiliateUrl}
            affiliateInfo={product.affiliateLink}
          />
        </div>
      </div>
    </div>
  );
}
