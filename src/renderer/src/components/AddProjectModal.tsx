
import React, { useState } from 'react';
import { Project, ThemeMode } from '../types';

interface AddProjectModalProps {
  onClose: () => void;
  onSubmit: (project: Omit<Project, 'id' | 'status'>) => void;
  theme: ThemeMode;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ onClose, onSubmit, theme }) => {
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    type: 'node' as any,
    internalPort: 3000,
    domain: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.domain) return;
    onSubmit({
      ...formData,
      domain: formData.domain.endsWith('.local') ? formData.domain : `${formData.domain}.local`
    });
  };

  const modalBg = theme === 'white' ? 'bg-white' : 'bg-slate-900';
  const inputBg = theme === 'white' ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`${modalBg} w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-700/50 overflow-hidden`}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black">프로젝트 등록</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block ml-1">Project Name</label>
              <input
                autoFocus
                type="text"
                className={`w-full px-5 py-3 rounded-2xl border outline-none focus:border-blue-500 transition-all ${inputBg}`}
                placeholder="내 멋진 쇼핑몰"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block ml-1">Type</label>
                <select
                  className={`w-full px-5 py-3 rounded-2xl border outline-none focus:border-blue-500 transition-all ${inputBg}`}
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="node">Node.js</option>
                  <option value="python">Python</option>
                  <option value="go">Golang</option>
                  <option value="static">Static HTML</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block ml-1">Port</label>
                <input
                  type="number"
                  className={`w-full px-5 py-3 rounded-2xl border outline-none focus:border-blue-500 transition-all ${inputBg}`}
                  placeholder="3000"
                  value={formData.internalPort}
                  onChange={e => setFormData({ ...formData, internalPort: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block ml-1">Domain (.local)</label>
              <div className="relative">
                <input
                  type="text"
                  className={`w-full px-5 py-3 rounded-2xl border outline-none focus:border-blue-500 transition-all ${inputBg}`}
                  placeholder="myshop"
                  value={formData.domain}
                  onChange={e => setFormData({ ...formData, domain: e.target.value })}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">.local</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block ml-1">Source Path</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className={`flex-1 px-5 py-3 rounded-2xl border text-xs ${inputBg}`}
                  placeholder="/absolute/path/to/project"
                  value={formData.path}
                  onChange={e => setFormData({ ...formData, path: e.target.value })}
                />

              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-blue-900/30 transition-all active:scale-95"
            >
              프로젝트 생성 및 배포
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProjectModal;
