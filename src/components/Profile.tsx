import { useEffect, useState } from 'react';
import { User as UserIcon, Award, BookOpen, TrendingUp, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Certificate } from '../lib/supabase';

export function Profile() {
  const { user, telegramUser } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalTests: 0,
    averageScore: 0
  });

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  async function loadProfileData() {
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
    ]);

    if (certsResult.data) {
      setCertificates(certsResult.data);
    }

    if (resultsResult.data) {
      const uniqueCourses = new Set(resultsResult.data.map(r => r.course_id));
      const totalTests = resultsResult.data.length;
      const averageScore = totalTests > 0
        ? Math.round(resultsResult.data.reduce((sum, r) => sum + r.percentage, 0) / totalTests)
        : 0;

      setStats({
        totalCourses: uniqueCourses.size,
        totalTests,
        averageScore
      });
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  const memberSince = new Date(user.created_at).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Профиль</h1>
        <p className="text-slate-600">Ваши данные и статистика</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <UserIcon className="w-10 h-10 text-white" />
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {user.first_name} {user.last_name}
            </h2>
            {user.username && (
              <p className="text-slate-600 mb-2">@{user.username}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>Участник с {memberSince}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{user.level}</p>
            <p className="text-sm text-slate-600">Уровень</p>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{user.points}</p>
            <p className="text-sm text-slate-600">Баллов</p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">Статистика обучения</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-slate-600" />
                </div>
                <span className="text-slate-700">Пройдено курсов</span>
              </div>
              <span className="font-bold text-slate-900">{stats.totalCourses}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-slate-600" />
                </div>
                <span className="text-slate-700">Пройдено тестов</span>
              </div>
              <span className="font-bold text-slate-900">{stats.totalTests}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Award className="w-5 h-5 text-slate-600" />
                </div>
                <span className="text-slate-700">Средний балл</span>
              </div>
              <span className="font-bold text-slate-900">{stats.averageScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {certificates.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">
            Сертификаты ({certificates.length})
          </h3>
          <div className="space-y-3">
            {certificates.map(cert => (
              <div
                key={cert.id}
                className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      Сертификат о прохождении курса
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      № {cert.certificate_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {new Date(cert.issued_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-2">О системе уровней</h3>
        <p className="text-sm text-blue-700 mb-3">
          Зарабатывайте баллы за прохождение тестов и повышайте свой уровень. Каждые 100
          баллов повышают ваш уровень на 1.
        </p>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex items-center justify-between">
            <span>Правильный ответ (лёгкий)</span>
            <span className="font-semibold">+10 баллов</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Правильный ответ (средний)</span>
            <span className="font-semibold">+20 баллов</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Правильный ответ (сложный)</span>
            <span className="font-semibold">+30 баллов</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Прохождение теста (≥75%)</span>
            <span className="font-semibold">+50 баллов</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Идеальный результат (100%)</span>
            <span className="font-semibold">+100 баллов</span>
          </div>
        </div>
      </div>
    </div>
  );
}
