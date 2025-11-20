import React from 'react';
import { AgentConfig, DebateSettings, DebateStatus } from '../types';
import { Settings, Users, MessageSquare, Play, RefreshCw } from 'lucide-react';

interface ConfigurationPanelProps {
  agents: AgentConfig[];
  settings: DebateSettings;
  status: DebateStatus;
  onUpdateAgent: (id: string, field: keyof AgentConfig, value: string) => void;
  onUpdateSettings: (field: keyof DebateSettings, value: string | number) => void;
  onStart: () => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  agents,
  settings,
  status,
  onUpdateAgent,
  onUpdateSettings,
  onStart,
}) => {
  const isLocked = status !== DebateStatus.IDLE && status !== DebateStatus.FINISHED && status !== DebateStatus.ERROR;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-500" />
          辩论设置
        </h2>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto flex-1">
        {/* Topic Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            辩论议题
          </label>
          <input
            type="text"
            value={settings.topic}
            onChange={(e) => onUpdateSettings('topic', e.target.value)}
            disabled={isLocked}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
            placeholder="例如：太空探索值得花费巨资吗？"
          />
        </div>

        {/* Rounds Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            每位选手的轮次 ({settings.rounds})
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={settings.rounds}
            onChange={(e) => onUpdateSettings('rounds', parseInt(e.target.value))}
            disabled={isLocked}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>1 轮</span>
            <span>5 轮</span>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            辩手与人设
          </label>
          <div className="grid grid-cols-1 gap-4">
            {agents.map((agent) => (
              <div 
                key={agent.id} 
                className={`p-3 rounded-lg border border-l-4 transition-colors ${isLocked ? 'opacity-75' : ''}`}
                style={{ borderLeftColor: `var(--color-${agent.color}-500)` }} 
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{agent.avatar}</span>
                  <span className={`font-bold text-sm text-${agent.color}-700`}>{agent.name}</span>
                </div>
                <textarea
                  value={agent.persona}
                  onChange={(e) => onUpdateAgent(agent.id, 'persona', e.target.value)}
                  disabled={isLocked}
                  rows={2}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-300 outline-none resize-none text-slate-600"
                  placeholder="定义该模型的性格与立场..."
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 border-t border-slate-100 bg-slate-50">
        <button
          onClick={onStart}
          disabled={isLocked || !settings.topic.trim()}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-medium transition-all transform active:scale-95 ${
            isLocked || !settings.topic.trim()
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
          }`}
        >
          {status === DebateStatus.DEBATING ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              辩论进行中...
            </>
          ) : status === DebateStatus.JUDGING ? (
            <>
              <Users className="w-5 h-5 animate-pulse" />
              正在裁决...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              开始辩论
            </>
          )}
        </button>
      </div>
    </div>
  );
};