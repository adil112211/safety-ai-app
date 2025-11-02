import { useEffect, useState } from 'react';
import { Trophy, Lock, Star, Target, Award, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Achievement, UserAchievement } from '../lib/supabase';

export function Achievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  async function loadAchievements() {
    if (!user) return;

    try {
      const [achievementsResult, userAchievementsResult] = await Promise.all([
        supabase.from('achievements').select('*'),
        supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (achievementsResult.data) {
        if (achievementsResult.data.length === 0) {
          await createDefaultAchievements();
          await loadAchievements();
          return;
        }
        setAchievements(achievementsResult.data);
      }

      if (userAchievementsResult.data) {
        setUserAchievements(userAchievementsResult.data);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createDefaultAchievements() {
    const defaultAchievements = [
      {
        name: 'Первые шаги',
        description: 'Пройдите первый тест',
        icon: 'star',
        condition: { type: 'tests_completed', value: 1 },
        points: 10
      },
      {
        name: 'Ученик',
        description: 'Наберите 100 баллов',
        icon: 'target',
        condition: { type: 'points', value: 100 },
        points: 20
      },
      {
        name: 'Перфекционист',
        description: 'Получите 100% в любом тесте',
        icon: 'award',
        condition: { type: 'perfect_score', value: 1 },
        points: 50
      },
      {
        name: 'Знаток',
        description: 'Пройдите 5 курсов',
        icon: 'trophy',
        condition: { type: 'courses_completed', value: 5 },
        points: 30
      },
      {
        name: 'Эксперт',
        description: 'Наберите 500 баллов',
        icon: 'zap',
        condition: { type: 'points', value: 500 },
        points: 50
      },
      {
        name: 'Марафонец',
        description: 'Пройдите 10 курсов',
        icon: 'trophy',
        condition: { type: 'courses_completed', value: 10 },
        points: 100
      }
    ];

    await supabase.from('achievements').insert(defaultAchievements);
  }

  function isAchievementEarned(achievementId: string): boolean {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  }

  function getIconComponent(iconName?: string) {
    switch (iconName) {
      case 'star':
        return Star;
      case 'target':
        return Target;
      case 'award':
        return Award;
      case 'zap':
        return Zap;
      default:
        return Trophy;
    }
  }

  const earnedCount = userAchievements.length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка достижений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Достижения</h1>
        <p className="text-slate-600">Собирайте достижения за успехи в обучении</p>
      </div>

      <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-purple-100 text-sm mb-1">Прогресс</p>
            <p className="text-3xl font-bold">
              {earnedCount} / {totalCount}
            </p>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-full">
            <Trophy className="w-8 h-8" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-purple-100">Получено достижений</span>
            <span className="font-semibold">{completionPercentage}%</span>
          </div>
          <div className="h-2 bg-purple-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {achievements.map(achievement => {
          const earned = isAchievementEarned(achievement.id);
          const Icon = getIconComponent(achievement.icon);

          return (
            <div
              key={achievement.id}
              className={`rounded-xl p-5 shadow-sm border transition-all ${
                earned
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                  : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl ${
                    earned
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                      : 'bg-slate-200'
                  }`}
                >
                  {earned ? (
                    <Icon className="w-7 h-7 text-white" />
                  ) : (
                    <Lock className="w-7 h-7 text-slate-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3
                      className={`font-bold ${
                        earned ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {achievement.name}
                    </h3>
                    {earned && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        +{achievement.points} баллов
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-sm mb-2 ${
                      earned ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {achievement.description}
                  </p>

                  {earned && (
                    <div className="flex items-center gap-2 text-xs text-amber-700">
                      <Award className="w-4 h-4" />
                      <span>Достижение получено</span>
                    </div>
                  )}

                  {!earned && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Lock className="w-4 h-4" />
                      <span>Заблокировано</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
