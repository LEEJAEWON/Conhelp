
import React, { useState, useEffect, useRef } from 'react';
import { Project, ThemeMode } from '../types';

interface LogViewerModalProps {
  project: Project;
  onClose: () => void;
  theme: ThemeMode;
}

const LogViewerModal: React.FC<LogViewerModalProps> = ({ project, onClose, theme }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear logs on open
    setLogs([]);

    const handleLog = (data: { projectId: string, msg: string }) => {
      // Check if log belongs to this project
      // Note: IPC sends projectId, but here we might not be filtering? 
      // The IPC backend broadcasts to all windows. We should check ID.
      if (typeof data === 'object' && data.projectId === project.id) {
        setLogs(prev => [...prev, data.msg].slice(-200));
      } else if (typeof data === 'string') {
        // Fallback or system log
        setLogs(prev => [...prev, data].slice(-200));
      }
    };

    // Subscribing to log
    // @ts-ignore
    window.api.onLog(handleLog);

    return () => {
      // @ts-ignore
      window.api.removeLogListener();
    };
  }, [project.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const modalBg = theme === 'white' ? 'bg-white' : 'bg-slate-950';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className={`${modalBg} w-full max-w-3xl h-[600px] rounded-[2.5rem] shadow-2xl border border-slate-800 flex flex-col overflow-hidden`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
              <i className="fas fa-terminal text-blue-400"></i>
            </div>
            <div>
              <h3 className="font-black">{project.name} 실시간 로그</h3>
              <p className="text-[10px] text-slate-500 font-mono">{project.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-800 transition-colors flex items-center justify-center">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 p-6 font-mono text-xs space-y-1 overflow-y-auto bg-black/40 custom-scrollbar"
        >
          {logs.map((log, i) => (
            <div key={i} className="flex gap-4 group">
              <span className="text-slate-700 shrink-0 select-none">{i + 1}</span>
              <span className={`break-words whitespace-pre-wrap ${theme === 'white' ? 'text-slate-700' : 'text-slate-300'}`}>
                {log}
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Streaming Active
          </div>
          <button onClick={() => setLogs([])} className="text-[10px] font-bold uppercase text-slate-500 hover:text-white transition-colors">Clear Console</button>
        </div>
      </div>
    </div>
  );
};

export default LogViewerModal;
