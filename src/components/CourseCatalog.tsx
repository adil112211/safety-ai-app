import { useEffect, useState } from 'react';
import { Search, Filter, BookOpen, Clock, Award } from 'lucide-react';
import { supabase, Course } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CourseCatalogProps {
  onSelectCourse: (course: Course) => void;
}

export function CourseCatalog({ onSelectCourse }: CourseCatalogProps) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const categories = ['all', 'general', 'electrical', 'chemical', 'construction', 'fire'];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  const categoryLabels: Record<string, string> = {
    all: 'Все',
    general: 'Общая',
    electrical: 'Электробезопасность',
    chemical: 'Химическая безопасность',
    construction: 'Строительная',
    fire: 'Пожарная безопасность'
  };

  const difficultyLabels: Record<string, string> = {
    all: 'Все',
    beginner: 'Начальный',
    intermediate: 'Средний',
    advanced: 'Продвинутый'
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchQuery, selectedCategory, selectedDifficulty]);

  async function loadCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterCourses() {
    let filtered = [...courses];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        course =>
          course.title.toLowerCase().includes(query) ||
          course.description?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(course => course.difficulty === selectedDifficulty);
    }

    setFilteredCourses(filtered);
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка курсов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Каталог курсов</h1>
        <p className="text-slate-600">Выберите курс для изучения и тестирования</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск курсов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Категория
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Сложность
            </label>
            <div className="flex flex-wrap gap-2">
              {difficulties.map(diff => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedDifficulty === diff
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {difficultyLabels[diff]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Курсы не найдены</p>
          </div>
        ) : (
          filteredCourses.map(course => (
            <div
              key={course.id}
              onClick={() => onSelectCourse(course)}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex gap-4">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-1">{course.title}</h3>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {course.description || 'Курс по технике безопасности'}
                  </p>

                  <div className="flex items-center gap-3">
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}
