import React from 'react';

interface ProgressionBarProps {
  level: number;
  levelTitle: string;
  currentXP: number;
  nextLevelXP: number | null;
  progress: number; // 0-100
  className?: string;
}

/**
 * Accessible progression bar component following WCAG guidelines
 * Shows user level, XP progress, and next level information
 */
const ProgressionBar: React.FC<ProgressionBarProps> = ({
  level,
  levelTitle,
  currentXP,
  nextLevelXP,
  progress,
  className = '',
}) => {
  const isMaxLevel = nextLevelXP === null;
  const xpToNextLevel = nextLevelXP ? nextLevelXP - currentXP : 0;
  const progressPercentage = Math.min(100, Math.max(0, progress));

  // Color scheme based on level ranges
  const getColorScheme = (lvl: number) => {
    if (lvl >= 12) return { bg: 'bg-purple-100', bar: 'bg-purple-600', text: 'text-purple-700' };
    if (lvl >= 8) return { bg: 'bg-blue-100', bar: 'bg-blue-600', text: 'text-blue-700' };
    if (lvl >= 4) return { bg: 'bg-emerald-100', bar: 'bg-emerald-600', text: 'text-emerald-700' };
    return { bg: 'bg-green-100', bar: 'bg-green-500', text: 'text-green-700' };
  };

  const colors = getColorScheme(level);

  return (
    <div className={`${className}`} role="region" aria-label="Progression de l'utilisateur">
      {/* Level Badge and Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Level Badge - using semantic heading */}
          <div
            className={`flex items-center justify-center w-14 h-14 rounded-full ${colors.bg} ${colors.text} font-bold text-xl shadow-md`}
            aria-hidden="true"
          >
            {level}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Niveau {level}
            </h3>
            <p className={`text-sm font-medium ${colors.text}`} id="level-title">
              {levelTitle}
            </p>
          </div>
        </div>

        {/* XP Display */}
        <div className="text-right" aria-live="polite">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            <span className="sr-only">Expérience actuelle :</span>
            {currentXP.toLocaleString()} XP
          </p>
          {!isMaxLevel && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="sr-only">Encore</span>
              {xpToNextLevel.toLocaleString()} <span className="sr-only">points d'expérience</span> jusqu'au niveau {level + 1}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar - following WCAG progressbar role */}
      {!isMaxLevel ? (
        <div className="relative">
          {/* Label for screen readers */}
          <label htmlFor="xp-progress" className="sr-only">
            Progression vers le niveau {level + 1}: {progressPercentage}%
          </label>
          
          {/* Progress bar container */}
          <div
            className={`w-full h-3 ${colors.bg} rounded-full overflow-hidden shadow-inner`}
            aria-hidden="true"
          >
            {/* Progress fill with smooth animation */}
            <div
              className={`h-full ${colors.bar} transition-all duration-500 ease-out rounded-full`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* ARIA progressbar for accessibility */}
          <div
            id="xp-progress"
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-labelledby="level-title"
            className="sr-only"
          >
            {progressPercentage}% vers le niveau {level + 1}
          </div>

          {/* Visual percentage indicator */}
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {progressPercentage}%
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Niveau {level + 1}
            </span>
          </div>
        </div>
      ) : (
        // Max level reached
        <div
          className="text-center py-3 px-4 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg border-2 border-yellow-400"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-amber-900 flex items-center justify-center gap-2">
            <span aria-hidden="true">👑</span>
            <span>Niveau maximum atteint ! Vous êtes un Sage de l'environnement.</span>
          </p>
        </div>
      )}

      {/* Achievement hint */}
      {!isMaxLevel && progressPercentage >= 80 && (
        <p
          className="mt-3 text-xs text-center text-gray-600 dark:text-gray-400 italic"
          role="status"
          aria-live="polite"
        >
          Plus que {xpToNextLevel} XP pour passer au niveau supérieur !
        </p>
      )}
    </div>
  );
};

export default ProgressionBar;
