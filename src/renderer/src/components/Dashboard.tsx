
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
      case 'white': return 'bg-white border-gray-200 text-gray-900';
      case 'middle': return 'bg-slate-900 border-slate-800 text-slate-100';
      case 'dark': default: return 'bg-[#0f1419] border-slate-800/50 text-slate-100';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`${getCardClasses()} border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                <i className={`fas ${stat.icon} text-${stat.color}-500 text-base`}></i>
              </div>
            </div>
            <div className={`text-2xl font-bold mb-1 ${theme === 'white' ? 'text-gray-900' : 'text-white'}`}>{stat.value}</div>
            <div className={`${theme === 'white' ? 'text-gray-500' : 'text-slate-400'} text-xs font-medium`}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={`${getCardClasses()} border rounded-2xl overflow-hidden flex flex-col h-[480px]`}>
            <div className={`p-4 border-b flex items-center justify-between ${theme === 'white' ? 'bg-gray-50/50 border-gray-200' : 'bg-slate-900/30 border-slate-800/50'}`}>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <i className={`fas fa-terminal text-xs ${isScanning ? 'animate-pulse text-blue-500' : theme === 'white' ? 'text-gray-400' : 'text-slate-500'}`}></i>
                System Logs
              </h3>
              <button 
                onClick={onScan}
                disabled={isScanning}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2 ${
                  theme === 'white' ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-slate-800/50 hover:bg-slate-700 text-slate-300'
                } ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <i className={`fas fa-sync-alt text-xs ${isScanning ? 'animate-spin' : ''}`}></i>
                Refresh
              </button>
            </div>
            <div className={`flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-xs custom-scrollbar ${theme === 'white' ? 'bg-gray-50/30' : 'bg-black/20'}`}>
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 group">
                  <span className={`${theme === 'white' ? 'text-gray-400' : 'text-slate-600'} shrink-0 text-[10px]`}>{log.timestamp}</span>
                  <span className={`
                    ${log.level === 'error' ? 'text-rose-500' : ''}
                    ${log.level === 'warn' ? 'text-amber-500' : ''}
                    ${log.level === 'success' ? 'text-emerald-500' : ''}
                    ${log.level === 'info' ? 'text-blue-500' : ''}
                    break-all text-[11px]
                  `}>
                    <span className="mr-2 font-semibold opacity-60">[{log.level.toUpperCase()}]</span>
                    {log.message}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className={`${theme === 'white' ? 'text-gray-400' : 'text-slate-600'} text-center py-16 text-xs`}>No system activity recorded</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${getCardClasses()} border p-5 rounded-2xl`}>
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <i className="fas fa-shield-halved text-blue-500 text-xs"></i>
              Gateway Status
            </h3>
            <div className="space-y-2.5">
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${theme === 'white' ? 'bg-gray-50 border-gray-200' : 'bg-slate-800/30 border-slate-700/50'}`}>
                <span className={`text-xs ${theme === 'white' ? 'text-gray-600' : 'text-slate-400'}`}>Reverse Proxy</span>
                <span className={`px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold rounded-full flex items-center gap-1.5`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${theme === 'white' ? 'bg-gray-50 border-gray-200' : 'bg-slate-800/30 border-slate-700/50'}`}>
                <span className={`text-xs ${theme === 'white' ? 'text-gray-600' : 'text-slate-400'}`}>Dashboard</span>
                <a href={state.traefik.dashboardUrl} target="_blank" rel="noreferrer" className="text-blue-500 text-[10px] hover:underline flex items-center gap-1 font-medium">
                  :8080 <i className="fas fa-external-link-alt text-[8px]"></i>
                </a>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${theme === 'white' ? 'bg-gray-50 border-gray-200' : 'bg-slate-800/30 border-slate-700/50'}`}>
                <span className={`text-xs ${theme === 'white' ? 'text-gray-600' : 'text-slate-400'}`}>DNS Resolver</span>
                <span className={`text-[10px] font-mono ${theme === 'white' ? 'text-gray-700' : 'text-slate-300'}`}>Internal</span>
              </div>
            </div>
            <button className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group">
              <i className="fas fa-redo-alt text-xs group-hover:rotate-180 transition-transform duration-500"></i>
              Restart Gateway
            </button>
          </div>

          <div className={`border p-5 rounded-2xl relative overflow-hidden group transition-colors ${
            theme === 'white' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/10'
          }`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <i className="fas fa-sparkles text-5xl"></i>
            </div>
            <h3 className={`font-semibold text-sm mb-2 relative z-10 ${theme === 'white' ? 'text-gray-900' : 'text-white'}`}>AI Insights</h3>
            <p className={`text-xs mb-3 relative z-10 leading-relaxed ${theme === 'white' ? 'text-gray-600' : 'text-slate-400'}`}>
              Gemini analyzed your project distribution. Routing efficiency is at 98%.
            </p>
            <button className={`text-xs font-semibold flex items-center gap-1.5 relative z-10 transition-colors ${
              theme === 'white' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
            }`}>
              View recommendations <i className="fas fa-arrow-right text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
