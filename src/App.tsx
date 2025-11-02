import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CourseCatalog } from './components/CourseCatalog';
import { CourseDetail } from './components/CourseDetail';
import { TestInterface } from './components/TestInterface';
import { Achievements } from './components/Achievements';
import { Profile } from './components/Profile';
import { SafetyAI } from './components/SafetyAI';
import { Course } from './lib/supabase';
import { AlertCircle } from 'lucide-react';

type Page = 'dashboard' | 'courses' | 'achievements' | 'profile' | 'ai-chat' | 'course-detail' | 'test';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  function handleSelectCourse(course: Course) {
    setSelectedCourse(course);
    setCurrentPage('course-detail');
  }

  function handleStartTest() {
    setCurrentPage('test');
  }

  function handleTestComplete() {
    setSelectedCourse(null);
    setCurrentPage('dashboard');
  }

  function handleBackToCatalog() {
    setSelectedCourse(null);
    setCurrentPage('courses');
  }

  function handleNavigate(page: 'dashboard' | 'courses' | 'achievements' | 'profile' | 'ai-chat') {
    setSelectedCourse(null);
    setCurrentPage(page);
  }

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'courses':
        return <CourseCatalog onSelectCourse={handleSelectCourse} />;
      case 'course-detail':
        return selectedCourse ? (
          <CourseDetail
            course={selectedCourse}
            onBack={handleBackToCatalog}
            onStartTest={handleStartTest}
          />
        ) : null;
      case 'test':
        return selectedCourse ? (
          <TestInterface
            course={selectedCourse}
            onComplete={handleTestComplete}
            onBack={handleBackToCatalog}
          />
        ) : null;
      case 'achievements':
        return <Achievements />;
      case 'profile':
        return <Profile />;
      case 'ai-chat':
        return <SafetyAI />;
      default:
        return <Dashboard />;
    }
  }

  const mainPageMap: Record<Page, 'dashboard' | 'courses' | 'achievements' | 'profile' | 'ai-chat'> = {
    dashboard: 'dashboard',
    courses: 'courses',
    'course-detail': 'courses',
    test: 'courses',
    achievements: 'achievements',
    profile: 'profile',
    'ai-chat': 'ai-chat'
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Telegram Mini App</h1>
          <p className="text-slate-600 mb-4">
            Это приложение работает только внутри Telegram через Mini Apps.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm font-medium text-blue-900 mb-2">Как открыть:</p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Откройте Telegram</li>
              <li>Найдите бота с этим приложением</li>
              <li>Нажмите на кнопку запуска Mini App</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout currentPage={mainPageMap[currentPage]} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
