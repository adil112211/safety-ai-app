import { ArrowLeft, Play, FileText, Award } from 'lucide-react';
import { Course } from '../lib/supabase';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
  onStartTest: () => void;
}

export function CourseDetail({ course, onBack, onStartTest }: CourseDetailProps) {
  const difficultyLabels: Record<string, string> = {
    beginner: 'Начальный',
    intermediate: 'Средний',
    advanced: 'Продвинутый'
  };

  const categoryLabels: Record<string, string> = {
    general: 'Общая безопасность',
    electrical: 'Электробезопасность',
    chemical: 'Химическая безопасность',
    construction: 'Строительная безопасность',
    fire: 'Пожарная безопасность'
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600 bg-green-100';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-100';
      case 'advanced':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Назад к каталогу
      </button>

      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <FileText className="w-20 h-20 text-white" />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {course.title}
              </h1>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                    course.difficulty
                  )}`}
                >
                  {difficultyLabels[course.difficulty]}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                  {categoryLabels[course.category]}
                </span>
              </div>
            </div>
          </div>

          <p className="text-slate-700 leading-relaxed mb-6">
            {course.description ||
              'Курс по технике безопасности включает теоретические материалы и практические тесты для проверки знаний. После успешного прохождения теста вы получите сертификат.'}
          </p>

          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-slate-900 mb-3">Что вы изучите:</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
                <span className="text-slate-700">
                  Основные правила техники безопасности
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
                <span className="text-slate-700">
                  Использование средств индивидуальной защиты
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
                <span className="text-slate-700">
                  Действия в чрезвычайных ситуациях
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
                <span className="text-slate-700">
                  Проверка и обслуживание оборудования
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Award className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">
                  Получите сертификат
                </h4>
                <p className="text-sm text-blue-700">
                  При прохождении теста на 75% и выше вы получите сертификат о прохождении
                  курса по технике безопасности.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onStartTest}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Play className="w-5 h-5" />
            Начать тестирование
          </button>
        </div>
      </div>
    </div>
  );
}
