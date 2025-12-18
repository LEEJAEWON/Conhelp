
import React from 'react';
import { SystemState, LogEntry, ServiceStatus, ThemeMode } from '../types';

interface DashboardProps {
  state: SystemState;
  logs: LogEntry[];
  theme: ThemeMode;
  onScan: () => void;
  isScanning: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ state, logs, theme, onScan, isScanning }) => {
  const stats = [
    { label: '활성 프로젝트', value: state.projects.filter(p => p.status === ServiceStatus.RUNNING).length, icon: 'fa-rocket', color: 'blue' },
    { label: '전체 서비스', value: state.projects.length + 1, icon: 'fa-server', color: 'indigo' },
    { label: '80 포트 상태', value: state.traefik.port80Available ? '개방됨' : '차단됨', icon: 'fa-door-open', color: state.traefik.port80Available ? 'emerald' : 'rose' },
    { label: 'IP 주소', value: '192.168.1.15', icon: 'fa-globe', color: 'slate' },
  ];

  const getCardClasses = () => {
    switch (theme) {
      case 'white': return 'bg-white border-slate-200 text-slate-900';
      case 'middle': return 'bg-slate-800 border-slate-700 text-slate-100';
      case 'dark': default: return 'bg-slate-900 border-slate-800 text-slate-100';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className={`${getCardClasses()} border p-6 rounded-3xl shadow-sm hover:border-blue-500/50 transition-all`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                <i className={`fas ${stat.icon} text-${stat.color}-400 text-lg`}></i>
              </div>
              <span className={`px-2 py-1 rounded-md bg-${stat.color}-500/10 text-${stat.color}-400 text-[10px] font-bold uppercase`}>실시간</span>
            </div>
            <div className={`text-2xl font-bold mb-1 ${theme === 'white' ? 'text-slate-900' : 'text-white'}`}>{stat.value}</div>
            <div className={`${theme === 'white' ? 'text-slate-500' : 'text-slate-400'} text-sm`}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className={`${getCardClasses()} border rounded-3xl overflow-hidden flex flex-col h-[500px]`}>
            <div className={`p-6 border-b flex items-center justify-between ${theme === 'white' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800'}`}>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <i className={`fas fa-terminal ${isScanning ? 'animate-pulse text-blue-400' : 'text-slate-500'}`}></i>
                시스템 로그
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={onScan}
                  disabled={isScanning}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                    theme === 'white' ? 'bg-slate-200 hover:bg-slate-300' : 'bg-slate-800 hover:bg-slate-700'
                  } ${isScanning ? 'opacity-50' : ''}`}
                >
                  <i className={`fas fa-sync-alt ${isScanning ? 'animate-spin' : ''}`}></i>
                  재검사
                </button>
              </div>
            </div>
            <div className={`flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm custom-scrollbar ${theme === 'white' ? 'bg-slate-50/50' : 'bg-black/40'}`}>
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4 group animate-in slide-in-from-left-2 duration-300">
                  <span className={`${theme === 'white' ? 'text-slate-400' : 'text-slate-600'} shrink-0`}>{log.timestamp}</span>
                  <span className={`
                    ${log.level === 'error' ? 'text-rose-400' : ''}
                    ${log.level === 'warn' ? 'text-amber-400' : ''}
                    ${log.level === 'success' ? 'text-emerald-400' : ''}
                    ${log.level === 'info' ? 'text-blue-400' : ''}
                    break-all
                  `}>
                    <span className="mr-2 font-bold opacity-70">[{log.level.toUpperCase()}]</span>
                    {log.message}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-slate-600 italic text-center py-12">기록된 시스템 활동이 없습니다...</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${getCardClasses()} border p-6 rounded-3xl`}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <i className="fas fa-shield-halved text-blue-400"></i>
              게이트웨이 상태
            </h3>
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${theme === 'white' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/50 border-slate-700/50'}`}>
                <span className={`text-sm ${theme === 'white' ? 'text-slate-600' : 'text-slate-400'}`}>리버스 프록시</span>
                <span className={`px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-2`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  활성
                </span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${theme === 'white' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/50 border-slate-700/50'}`}>
                <span className={`text-sm ${theme === 'white' ? 'text-slate-600' : 'text-slate-400'}`}>API 대시보드</span>
                <a href={state.traefik.dashboardUrl} target="_blank" rel="noreferrer" className="text-blue-400 text-xs hover:underline flex items-center gap-1">
                  8080 <i className="fas fa-external-link-alt scale-75"></i>
                </a>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${theme === 'white' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/50 border-slate-700/50'}`}>
                <span className={`text-sm ${theme === 'white' ? 'text-slate-600' : 'text-slate-400'}`}>DNS 리졸버</span>
                <span className={`text-xs font-mono ${theme === 'white' ? 'text-slate-700' : 'text-slate-200'}`}>Internal-DNS</span>
              </div>
            </div>
            <button className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 group">
              <i className="fas fa-redo-alt group-hover:rotate-180 transition-transform duration-500"></i>
              게이트웨이 재시작
            </button>
          </div>

          <div className={`border p-6 rounded-3xl relative overflow-hidden group transition-colors ${
            theme === 'white' ? 'bg-indigo-50 border-indigo-200' : 'bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-500/20'
          }`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <i className="fas fa-brain text-6xl"></i>
            </div>
            <h3 className={`font-bold text-lg mb-2 relative z-10 ${theme === 'white' ? 'text-indigo-900' : 'text-white'}`}>지능형 분석</h3>
            <p className={`text-sm mb-4 relative z-10 ${theme === 'white' ? 'text-indigo-700' : 'text-indigo-300/80'}`}>
              Gemini가 프로젝트 분포를 분석했습니다. 라우팅 효율성이 98%입니다.
            </p>
            <button className="text-indigo-500 text-sm font-bold flex items-center gap-2 relative z-10 hover:text-indigo-600 transition-colors">
              권장 사항 읽기 <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
