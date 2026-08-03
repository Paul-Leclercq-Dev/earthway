import React from 'react';
import { NewsArticle, NewsTheme } from '../types/news';

interface NewsCardProps {
  article: NewsArticle;
}

const THEME_LABELS: Record<NewsTheme, string> = {
  [NewsTheme.REFORESTATION]: 'Reforestation',
  [NewsTheme.OCEANS]: 'Océans & Coraux',
  [NewsTheme.POLLINATORS]: 'Pollinisateurs',
  [NewsTheme.INNOVATIONS]: 'Innovations',
  [NewsTheme.GENERAL]: 'Général',
};

const THEME_COLORS: Record<NewsTheme, string> = {
  [NewsTheme.REFORESTATION]: 'bg-lime-100 text-lime-700',
  [NewsTheme.OCEANS]: 'bg-blue-100 text-blue-700',
  [NewsTheme.POLLINATORS]: 'bg-amber-100 text-amber-700',
  [NewsTheme.INNOVATIONS]: 'bg-purple-100 text-purple-700',
  [NewsTheme.GENERAL]: 'bg-gray-100 text-gray-700',
};

const NewsCard: React.FC<NewsCardProps> = ({ article }) => {
  const formattedDate = new Date(article.publishedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {article.imageUrl && (
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${THEME_COLORS[article.theme]}`}>
            {THEME_LABELS[article.theme]}
          </span>
          <span className="text-xs text-gray-400">{formattedDate}</span>
        </div>

        <h3 className="text-base font-semibold text-gray-800 mb-2 line-clamp-2 leading-snug">
          {article.title}
        </h3>

        <p className="text-sm text-gray-600 line-clamp-3 flex-grow mb-3">
          {article.description || article.summary}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400 truncate max-w-[50%]">{article.source}</span>
          <a
            href={article.url || article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Lire l'article →
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
