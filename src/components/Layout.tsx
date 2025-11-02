import { ReactNode } from 'react';
import { Home, BookOpen, Trophy, User, Bot } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: 'dashboard' | 'courses' | 'achievements' | 'profile' | 'ai-chat';
  onNavigate: (page: 'dashboard' | 'courses' | 'achievements' | 'profile' | 'ai-chat') => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const navItems = [
    { id: 'dashboard' as const, icon: Home, label: 'Главная' },
    { id: 'courses' as const, icon: BookOpen, label: 'Курсы' },
    { id: 'ai-chat' as const, icon: Bot, label: 'AI-помощник' },
    { id: 'achievements' as const, icon: Trophy, label: 'Награды' },
    { id: 'profile' as const, icon: User, label: 'Профиль' }
  ];

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-hidden">
      <main className="flex-1 w-full px-3 py-4 overflow-y-auto">
        {children}
      </main>

      <nav className="w-full bg-white border-t border-slate-200 shadow-lg flex-shrink-0 safe-area-bottom">
        <div className="w-full">
          <div className="flex justify-around items-center h-14">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-slate-500 active:text-slate-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
