
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
      case 'white': return 'bg-white border-gray-200 text-gray-900';
      case 'middle': return 'bg-slate-900 border-slate-800 text-slate-100';
      case 'dark': default: return 'bg-[#0f1419] border-slate-800/50 text-slate-100';
    }
  };

  const getButtonClasses = (isActive: boolean) => {
    if (isActive) {
      return theme === 'white'
        ? 'bg-blue-50 text-blue-600 font-medium'
        : 'bg-blue-500/10 text-blue-400 font-medium';
    }
    return theme === 'white' 
      ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' 
      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200';
  };

  return (
    <aside className={`w-64 border-r flex flex-col transition-colors duration-300 ${getSidebarClasses()}`}>
      <div className={`h-16 px-5 flex items-center gap-3 border-b transition-colors duration-300 ${theme === 'white' ? 'border-gray-200' : 'border-slate-800/50'}`}>
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <i className="fas fa-network-wired text-white text-sm"></i>
        </div>
        <span className="font-bold text-base tracking-tight">ConHelper</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${getButtonClasses(activeTab === item.id)}`}
          >
            <i className={`fas ${item.icon} w-4 text-sm`}></i>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-3 mt-auto space-y-3">
        <div className={`rounded-xl p-3 border transition-colors duration-300 ${
          theme === 'white' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100' : 'bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/10'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <i className="fas fa-sparkles text-blue-500 text-xs"></i>
            </div>
            <span className={`text-xs font-semibold ${theme === 'white' ? 'text-gray-700' : 'text-slate-300'}`}>AI Powered</span>
          </div>
          <p className={`text-[10px] leading-relaxed ${theme === 'white' ? 'text-gray-600' : 'text-slate-400'}`}>
            Gemini AI로 구성 자동화 및 문제 해결
          </p>
        </div>
        <div className={`px-3 py-2 text-[10px] font-mono ${theme === 'white' ? 'text-gray-400' : 'text-slate-600'}`}>
          v1.1.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
