import { useEffect, useState } from 'react';
import { Award, TrendingUp, Target, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Certificate, TestResult } from '../lib/supabase';

export function Dashboard() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [recentResults, setRecentResults] = useState<TestResult[]>([]);
  const [stats, setStats] = useState({
    totalTests: 0,
    passedTests: 0,
    averageScore: 0
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  async function loadDashboardData() {
    if (!user) return;

    const [certsResult, resultsResult] = await Promise.all([
      supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false }),
      supabase
        .from('test_results')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5)
    ]);

    if (certsResult.data) {
      setCertificates(certsResult.data);
    }

    if (resultsResult.data) {
      setRecentResults(resultsResult.data);

      const totalTests = resultsResult.data.length;
      const passedTests = resultsResult.data.filter(r => r.passed).length;
      const averageScore = totalTests > 0
        ? Math.round(resultsResult.data.reduce((sum, r) => sum + r.percentage, 0) / totalTests)
        : 0;

      setStats({ totalTests, passedTests, averageScore });
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  const levelProgress = (user.points % 100) / 100 * 100;
  const nextLevelPoints = (user.level * 100) - user.points;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-blue-100 text-sm">@{user.username || 'пользователь'}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
              <span className="text-2xl font-bold">{user.level}</span>
            </div>
            <p className="text-xs text-blue-100">Уровень</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blue-100">Прогресс до {user.level + 1} уровня</span>
            <span className="font-semibold">{user.points} баллов</span>
          </div>
          <div className="h-2 bg-blue-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <p className="text-xs text-blue-100">
            Ещё {nextLevelPoints} баллов до следующего уровня
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{certificates.length}</p>
          <p className="text-xs text-slate-500">Сертификатов</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.passedTests}</p>
          <p className="text-xs text-slate-500">Тестов пройдено</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.averageScore}%</p>
          <p className="text-xs text-slate-500">Средний балл</p>
        </div>
      </div>

      {recentResults.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Последние результаты</h2>
          <div className="space-y-3">
            {recentResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    Тест по курсу
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(result.completed_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {result.percentage}%
                  </p>
                  <p className="text-xs text-slate-500">
                    {result.score}/{result.total_questions}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {certificates.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Мои сертификаты</h2>
          <div className="space-y-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200"
              >
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Сертификат</p>
                  <p className="text-xs text-slate-500">№ {cert.certificate_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    {new Date(cert.issued_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
