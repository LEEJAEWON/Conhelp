
import React from 'react';
import { ThemeMode } from '../types';

interface SidebarProps {
  activeTab: 'dashboard' | 'projects' | 'config';
  setActiveTab: (tab: 'dashboard' | 'projects' | 'config') => void;
  theme: ThemeMode;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, theme }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-chart-line', label: '대시보드' },
    { id: 'projects', icon: 'fa-cubes', label: '프로젝트' },
    { id: 'config', icon: 'fa-wand-magic-sparkles', label: 'AI 헬퍼' },
  ];

  const getSidebarClasses = () => {
    switch (theme) {
      case 'white': return 'bg-slate-100 border-slate-200 text-slate-800';
      case 'middle': return 'bg-slate-800 border-slate-700 text-slate-100';
      case 'dark': default: return 'bg-slate-900 border-slate-800 text-slate-100';
    }
  };

  const getButtonClasses = (isActive: boolean) => {
    if (isActive) {
      return 'bg-blue-600/10 text-blue-500 border border-blue-600/20';
    }
    return theme === 'white' 
      ? 'text-slate-600 hover:bg-slate-200 hover:text-slate-900' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200';
  };

  return (
    <aside className={`w-64 border-r flex flex-col transition-colors duration-300 ${getSidebarClasses()}`}>
      {/* 높이를 h-16으로 고정하여 헤더의 구분선과 높이를 일치시킴 */}
      <div className={`h-16 px-6 flex items-center gap-3 border-b transition-colors duration-300 ${theme === 'white' ? 'border-slate-200' : 'border-slate-800'}`}>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
          <i className="fas fa-network-wired text-white text-base"></i>
        </div>
        <span className="font-bold text-lg tracking-tight">CONN_HELP</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${getButtonClasses(activeTab === item.id)}`}
          >
            <i className={`fas ${item.icon} w-5`}></i>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className={`rounded-2xl p-4 border transition-colors duration-300 ${
          theme === 'white' ? 'bg-white border-slate-200' : 'bg-slate-800/50 border-slate-700/50'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <i className="fas fa-brain text-indigo-400 text-sm"></i>
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${theme === 'white' ? 'text-slate-600' : 'text-slate-300'}`}>Gemini 통합</span>
          </div>
          <p className={`text-[10px] leading-relaxed ${theme === 'white' ? 'text-slate-500' : 'text-slate-500'}`}>
            AI 기반 구성 및 문제 해결 기능이 모든 연결된 프로젝트에 대해 활성화되어 있습니다.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3 px-4 py-2 opacity-50">
          <span className="text-[10px] font-mono">v1.1.0-STABLE</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
