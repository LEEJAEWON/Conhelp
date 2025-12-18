
import React, { useState } from 'react';
import { Project, ThemeMode } from '../types';
import { generateDockerConfig } from '../services/geminiService';

interface ConfigGeneratorProps {
  projects: Project[];
  addLog: (msg: string, level?: any) => void;
  theme: ThemeMode;
}

const ConfigGenerator: React.FC<ConfigGeneratorProps> = ({ projects, addLog, theme }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [config, setConfig] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return;

    setLoading(true);
    addLog(`${project.name}을(를) 위한 전문 Docker/Traefik 설정을 생성하는 중...`, 'info');
    
    try {
      const result = await generateDockerConfig(project);
      setConfig(result || '');
      addLog(`${project.name}에 대한 설정이 생성되었습니다.`, 'success');
    } catch (err) {
      addLog('설정 생성에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(config);
    addLog('설정이 클립보드에 복사되었습니다.', 'success');
  };

  const getCardClasses = () => {
    switch (theme) {
      case 'white': return 'bg-white border-slate-200 text-slate-900';
      case 'middle': return 'bg-slate-800 border-slate-700 text-slate-100';
      case 'dark': default: return 'bg-slate-900 border-slate-800 text-slate-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className={`${getCardClasses()} border rounded-3xl p-8 relative overflow-hidden transition-colors`}>
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <i className="fas fa-wand-magic-sparkles text-8xl"></i>
        </div>
        
        <div className="relative z-10">
          <h2 className={`text-2xl font-bold mb-2 ${theme === 'white' ? 'text-slate-900' : 'text-white'}`}>AI 구성 어시스턴트</h2>
          <p className={`${theme === 'white' ? 'text-slate-600' : 'text-slate-400'} mb-8 max-w-xl`}>
            프로젝트를 선택하여 Traefik 라벨이 통합된 최적의 <code className="text-blue-500 font-bold">docker-compose.yml</code> 파일을 생성하세요.
          </p>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <select 
              className={`flex-1 border rounded-2xl px-6 py-3 focus:outline-none focus:border-blue-500 transition-all ${
                theme === 'white' ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">프로젝트 선택...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.domain})</option>
              ))}
            </select>
            <button 
              onClick={handleGenerate}
              disabled={!selectedProjectId || loading}
              className={`px-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                !selectedProjectId || loading 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20'
              }`}
            >
              {loading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
              {loading ? '생성 중...' : '설정 생성'}
            </button>
          </div>

          {config && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">생성된 결과</h4>
                <button 
                  onClick={copyToClipboard}
                  className="text-xs text-blue-500 hover:text-blue-400 font-bold flex items-center gap-2"
                >
                  <i className="fas fa-copy"></i> 코드 복사
                </button>
              </div>
              <div className={`border rounded-2xl p-6 overflow-x-auto ${theme === 'white' ? 'bg-slate-50 border-slate-200' : 'bg-black/50 border-slate-800'}`}>
                <pre className="font-mono text-sm text-emerald-500 leading-relaxed">
                  {config}
                </pre>
              </div>
              <div className={`p-4 border rounded-2xl flex gap-3 ${theme === 'white' ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'}`}>
                <i className="fas fa-lightbulb text-amber-500 mt-1"></i>
                <p className={`text-xs leading-relaxed ${theme === 'white' ? 'text-amber-800' : 'text-amber-200/80'}`}>
                  <strong>도움말:</strong> 이 파일을 프로젝트 루트에 저장하고 <code className="bg-black/20 px-1 rounded">docker compose up -d</code>를 실행하세요.
                  게이트웨이가 자동으로 새 라벨을 감지하여 라우팅을 업데이트합니다.
                </p>
              </div>
            </div>
          )}

          {!config && !loading && (
            <div className={`py-20 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center ${theme === 'white' ? 'border-slate-200 text-slate-400' : 'border-slate-800 text-slate-600'}`}>
              <i className="fas fa-code text-4xl mb-4 opacity-20"></i>
              <p>시작하려면 위에서 프로젝트를 선택해 주세요.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${getCardClasses()} border p-6 rounded-3xl transition-colors`}>
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <i className="fas fa-question-circle text-blue-400"></i>
            작동 원리
          </h4>
          <ul className={`space-y-3 text-sm ${theme === 'white' ? 'text-slate-600' : 'text-slate-400'}`}>
            <li className="flex gap-3">
              <span className="w-5 h-5 shrink-0 bg-blue-500/10 text-blue-400 rounded flex items-center justify-center text-[10px] font-bold">1</span>
              Gemini가 프로젝트 유형과 네트워킹 요구사항을 분석합니다.
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 shrink-0 bg-blue-500/10 text-blue-400 rounded flex items-center justify-center text-[10px] font-bold">2</span>
              표준 Traefik v2.10 라벨이 무설정 라우팅을 위해 주입됩니다.
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 shrink-0 bg-blue-500/10 text-blue-400 rounded flex items-center justify-center text-[10px] font-bold">3</span>
              핫 리로드 볼륨이 프로젝트 경로를 기반으로 자동 맵핑됩니다.
            </li>
          </ul>
        </div>
        <div className={`${getCardClasses()} border p-6 rounded-3xl transition-colors`}>
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <i className="fas fa-bolt text-amber-400"></i>
            자주 사용하는 명령어
          </h4>
          <div className="space-y-2">
            {[
              { cmd: 'docker compose logs -f', desc: '모든 로그 스트리밍' },
              { cmd: 'docker system prune -a', desc: 'Docker 전체 정리' },
              { cmd: 'docker network ls', desc: '네트워크 목록 확인' }
            ].map(item => (
              <div key={item.cmd} className={`flex items-center justify-between p-2 rounded-lg group transition-colors ${theme === 'white' ? 'hover:bg-slate-100' : 'hover:bg-slate-800/50'}`}>
                <code className="text-[10px] font-mono text-emerald-500 font-bold">{item.cmd}</code>
                <span className={`text-[10px] ${theme === 'white' ? 'text-slate-500' : 'text-slate-500'}`}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigGenerator;
