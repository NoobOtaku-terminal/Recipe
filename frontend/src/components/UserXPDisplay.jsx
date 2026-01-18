import { Trophy, Star, TrendingUp, Award } from 'lucide-react';

const UserXPDisplay = ({ user }) => {
  const levels = [
    { level: 1, name: 'Beginner', minXP: 0, maxXP: 99, color: 'gray' },
    { level: 2, name: 'Intermediate', minXP: 100, maxXP: 299, color: 'green' },
    { level: 3, name: 'Advanced', minXP: 300, maxXP: 599, color: 'blue' },
    { level: 4, name: 'Expert', minXP: 600, maxXP: 999, color: 'purple' },
    { level: 5, name: 'Master', minXP: 1000, maxXP: 1499, color: 'orange' },
    { level: 6, name: 'Grandmaster', minXP: 1500, maxXP: 999999, color: 'amber' }
  ];

  const currentLevel = levels.find(l => l.level === user.level) || levels[0];
  const xp = user.experience_points || 0;
  const xpInLevel = xp - currentLevel.minXP;
  const xpNeededForNext = currentLevel.maxXP - currentLevel.minXP + 1;
  const progress = Math.min(100, Math.round((xpInLevel / xpNeededForNext) * 100));

  const colorClasses = {
    gray: {
      bg: 'bg-gray-100',
      border: 'border-gray-300',
      text: 'text-gray-700',
      progress: 'bg-gray-500'
    },
    green: {
      bg: 'bg-green-100',
      border: 'border-green-300',
      text: 'text-green-700',
      progress: 'bg-green-500'
    },
    blue: {
      bg: 'bg-blue-100',
      border: 'border-blue-300',
      text: 'text-blue-700',
      progress: 'bg-blue-500'
    },
    purple: {
      bg: 'bg-purple-100',
      border: 'border-purple-300',
      text: 'text-purple-700',
      progress: 'bg-purple-500'
    },
    orange: {
      bg: 'bg-orange-100',
      border: 'border-orange-300',
      text: 'text-orange-700',
      progress: 'bg-orange-500'
    },
    amber: {
      bg: 'bg-amber-100',
      border: 'border-amber-300',
      text: 'text-amber-700',
      progress: 'bg-amber-500'
    }
  };

  const colors = colorClasses[currentLevel.color];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 ${colors.bg} rounded-lg`}>
            <Trophy className={`w-6 h-6 ${colors.text}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Level {user.level}</h3>
            <p className={`text-sm font-medium ${colors.text}`}>{currentLevel.name}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{xp}</div>
          <div className="text-xs text-gray-600">Total XP</div>
        </div>
      </div>

      {/* Progress Bar */}
      {user.level < 6 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress to Level {user.level + 1}</span>
            <span className="text-sm font-semibold text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full ${colors.progress} transition-all duration-500 rounded-full`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">{xpInLevel} XP</span>
            <span className="text-xs text-gray-500">{xpNeededForNext} XP needed</span>
          </div>
        </div>
      )}

      {user.level === 6 && (
        <div className="mb-6 text-center py-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
          <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-amber-900">Max Level Achieved!</p>
          <p className="text-xs text-amber-700">You're a Grandmaster 🎉</p>
        </div>
      )}

      {/* XP Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Star className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-gray-600">Recipes</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {user.recipes_created || 0}
          </div>
          <div className="text-xs text-gray-500">+10 XP each</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Trophy className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-gray-600">Battles</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {user.battles_entered || 0}
          </div>
          <div className="text-xs text-gray-500">+15 XP entry</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">Votes Received</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {user.votes_received || 0}
          </div>
          <div className="text-xs text-gray-500">+5 XP each</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Award className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-600">Comments</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {user.comments_received || 0}
          </div>
          <div className="text-xs text-gray-500">+3 XP each</div>
        </div>
      </div>

      {/* Perks */}
      {user.level >= 4 && (
        <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-indigo-900 mb-2">🎁 Level Perks:</h4>
          <ul className="text-xs text-indigo-800 space-y-1">
            <li>✓ Auto-approved battle proof videos</li>
            <li>✓ Higher vote weight in battles</li>
            <li>✓ Access to exclusive challenges</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserXPDisplay;
