
import React, { useState } from 'react';
import { Project, ServiceStatus, ThemeMode } from '../types';

interface ProjectListProps {
  projects: Project[];
  onToggle: (id: string) => void;
  onToggleTunnel: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onViewLogs: (p: Project) => void;
  addLog: (msg: string, level?: any) => void;
  theme: ThemeMode;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onToggle, onToggleTunnel, onAdd, onDelete, onViewLogs, theme }) => {
  const [filter, setFilter] = useState('');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase()) || 
    p.domain.toLowerCase().includes(filter.toLowerCase())
  );

  const getCardClasses = () => {
    switch (theme) {
      case 'white': return 'bg-white border-slate-200 shadow-sm';
      case 'middle': return 'bg-slate-800/60 border-slate-700 shadow-lg';
      default: return 'bg-slate-900 border-slate-800 shadow-xl';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL이 클립보드에 복사되었습니다.');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
          <input 
            type="text" 
            placeholder="프로젝트명, 도메인 검색..." 
            className={`w-full pl-12 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
              theme === 'white' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/50 border-slate-800 text-slate-200'
            }`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <button 
          onClick={onAdd}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
        >
          <i className="fas fa-plus"></i>
          프로젝트 등록
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className={`${getCardClasses()} border rounded-[2rem] p-6 hover:border-blue-500/50 transition-all group flex flex-col`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                  theme === 'white' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
                } group-hover:scale-110 group-hover:rotate-3`}>
                  <i className={`fas ${
                    project.type === 'node' ? 'fa-brands fa-node-js text-emerald-400' :
                    project.type === 'python' ? 'fa-brands fa-python text-blue-400' :
                    'fa-code text-indigo-400'
                  } text-xl`}></i>
                </div>
                <div>
                  <h4 className={`font-bold text-base ${theme === 'white' ? 'text-slate-900' : 'text-white'}`}>{project.name}</h4>
                  <p className="text-slate-500 text-[10px] font-mono opacity-60">ID: {project.id}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 ${
                  project.status === ServiceStatus.RUNNING 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-slate-500/10 text-slate-500'
                }`}>
                  {project.status === ServiceStatus.RUNNING && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                  {project.status === ServiceStatus.RUNNING ? 'ONLINE' : 'OFFLINE'}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3 mb-6 flex-1">
              <div className={`p-4 rounded-2xl border transition-all ${theme === 'white' ? 'bg-slate-50 border-slate-100' : 'bg-black/20 border-slate-800/50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Network info</span>
                  <button onClick={() => copyToClipboard(`http://${project.domain}`)} className="text-[10px] text-blue-400 hover:text-blue-300">
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
                <div className={`text-sm font-mono truncate ${theme === 'white' ? 'text-slate-700' : 'text-slate-300'}`}>
                  {project.domain}
                </div>
              </div>

              {project.publicUrl && (
                <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 animate-fadeIn">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase flex items-center gap-1">
                      <i className="fas fa-globe"></i> Public URL
                    </span>
                    <button onClick={() => copyToClipboard(project.publicUrl!)} className="text-[10px] text-indigo-400 hover:text-indigo-300">
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-indigo-300 truncate">
                    {project.publicUrl}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 mt-auto">
              <div className="flex gap-2">
                <button 
                  onClick={() => onToggle(project.id)}
                  className={`flex-1 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                    project.status === ServiceStatus.RUNNING 
                      ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' 
                      : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                  }`}
                >
                  <i className={`fas ${project.status === ServiceStatus.RUNNING ? 'fa-stop' : 'fa-play'}`}></i>
                  {project.status === ServiceStatus.RUNNING ? 'STOP' : 'START'}
                </button>
                <button 
                  onClick={() => onToggleTunnel(project.id)}
                  disabled={project.status !== ServiceStatus.RUNNING}
                  className={`px-4 py-3 rounded-xl transition-all flex items-center justify-center ${
                    project.publicUrl 
                      ? 'bg-indigo-600 text-white' 
                      : project.status === ServiceStatus.RUNNING 
                        ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' 
                        : 'opacity-30 grayscale cursor-not-allowed'
                  }`}
                  title="외부 공유 (Tunneling)"
                >
                  <i className="fas fa-share-nodes"></i>
                </button>
              </div>
              
              <div className="flex items-center justify-between px-1">
                <div className="flex gap-4">
                  <button onClick={() => onViewLogs(project)} className="text-[10px] font-bold text-slate-500 hover:text-blue-400 transition-colors uppercase">Logs</button>
                  <button className="text-[10px] font-bold text-slate-500 hover:text-blue-400 transition-colors uppercase">Stats</button>
                </div>
                <button onClick={() => onDelete(project.id)} className="text-[10px] font-bold text-rose-500/50 hover:text-rose-500 transition-colors uppercase">Remove</button>
              </div>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30">
            <i className="fas fa-ghost text-5xl mb-4"></i>
            <p className="font-bold">표시할 프로젝트가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
