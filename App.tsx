import React, { useState, useCallback } from 'react';
import { 
  AgentConfig, 
  DebateSettings, 
  DebateStatus, 
  Message 
} from './types';
import { DEFAULT_AGENTS, DEFAULT_ROUNDS, DEFAULT_TOPIC, JUDGE_AGENT } from './constants';
import { generateDebateTurn, generateJudgeVerdict } from './services/geminiService';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { DebateArea } from './components/DebateArea';
import { Swords, BookOpen, ChevronRight, X } from 'lucide-react';

const App: React.FC = () => {
  const [agents, setAgents] = useState<AgentConfig[]>(DEFAULT_AGENTS);
  const [settings, setSettings] = useState<DebateSettings>({
    topic: DEFAULT_TOPIC,
    rounds: DEFAULT_ROUNDS,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<DebateStatus>(DebateStatus.IDLE);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const handleUpdateAgent = (id: string, field: keyof AgentConfig, value: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === id ? { ...agent, [field]: value } : agent
    ));
  };

  const handleUpdateSettings = (field: keyof DebateSettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const startDebate = useCallback(async () => {
    if (!process.env.API_KEY) {
      alert("环境变量中缺少 API Key。");
      return;
    }

    setMessages([]); 
    setStatus(DebateStatus.DEBATING);
    const currentHistory: Message[] = [];

    try {
      // Debate Loop
      for (let round = 1; round <= settings.rounds; round++) {
        for (const agent of agents) {
          setCurrentSpeakerId(agent.id);
          
          const { text, attachments, groundingSources } = await generateDebateTurn(
            agent,
            settings.topic,
            currentHistory,
            round,
            settings.rounds
          );

          const newMessage: Message = {
            id: crypto.randomUUID(),
            agentId: agent.id,
            agentName: agent.name,
            content: text,
            timestamp: Date.now(),
            round: round,
            attachments,
            groundingSources
          };

          currentHistory.push(newMessage);
          setMessages(prev => [...prev, newMessage]);
        }
      }

      // Judge Phase
      setCurrentSpeakerId('judge');
      setStatus(DebateStatus.JUDGING);
      
      const { text: verdictText } = await generateJudgeVerdict(
        JUDGE_AGENT,
        settings.topic,
        currentHistory
      );

      const verdictMessage: Message = {
        id: crypto.randomUUID(),
        agentId: JUDGE_AGENT.id,
        agentName: JUDGE_AGENT.name,
        content: verdictText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, verdictMessage]);
      setStatus(DebateStatus.FINISHED);

    } catch (error) {
      console.error("Debate error:", error);
      setStatus(DebateStatus.ERROR);
      const errorMessage: Message = {
         id: 'error',
         agentId: 'system',
         agentName: 'System',
         content: "辩论过程中发生错误。请检查您的 API Key 并重试。",
         timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setCurrentSpeakerId(undefined);
    }
  }, [agents, settings]);

  return (
    <div className="h-screen bg-slate-100 text-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-3 px-6 flex items-center justify-between h-[70px] shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg text-white">
            <Swords size={24} />
          </div>
          <div>
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-purple-700 hidden md:block">
              AI 辩论竞技场
            </h1>
            <h1 className="text-lg font-bold md:hidden">AI Debate</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
             <span className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-full text-slate-500 border border-slate-200">
               Gemini 2.5 • Nano Banana • Veo
             </span>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${showHistory ? 'bg-slate-200 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
          >
            <BookOpen size={18} className="text-slate-600" />
            <span className="text-sm font-medium text-slate-700 hidden sm:inline">
              {showHistory ? '隐藏记录' : '辩论记录'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Config */}
        <div className={`w-full md:w-[350px] border-r border-slate-200 bg-white flex-shrink-0 transition-all duration-300 ${status !== DebateStatus.IDLE && status !== DebateStatus.FINISHED ? 'hidden md:block' : 'block'} ${showHistory ? 'hidden lg:block' : ''} overflow-hidden`}>
          <ConfigurationPanel 
            agents={agents}
            settings={settings}
            status={status}
            onUpdateAgent={handleUpdateAgent}
            onUpdateSettings={handleUpdateSettings}
            onStart={startDebate}
          />
        </div>

        {/* Middle Panel: Live Debate (Flexible width) */}
        <div className="flex-1 min-w-0 bg-slate-100 p-0 md:p-4 overflow-hidden flex flex-col">
          <DebateArea 
            messages={messages} 
            status={status}
            currentSpeakerId={currentSpeakerId}
            agents={agents}
          />
        </div>

        {/* Right Panel: History Log (Collapsible) */}
        <div 
          className={`bg-white border-l border-slate-200 transition-all duration-300 ease-in-out transform ${showHistory ? 'w-full md:w-[400px] translate-x-0' : 'w-0 translate-x-full'} flex flex-col absolute md:relative right-0 h-full z-40 shadow-xl md:shadow-none`}
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 h-[60px] shrink-0">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <BookOpen className="w-4 h-4" />
               完整记录
             </h3>
             <button onClick={() => setShowHistory(false)} className="md:hidden p-1 hover:bg-slate-200 rounded">
                <X className="w-5 h-5" />
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-6 bg-white">
             {messages.length === 0 ? (
               <p className="text-slate-400 text-center mt-10">暂无记录...</p>
             ) : (
               messages.map((msg) => (
                 <div key={msg.id} className="pb-4 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800">{msg.agentName}</span>
                      <span className="text-xs text-slate-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-600 whitespace-pre-wrap">{msg.content}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                       <p className="text-xs text-blue-500 mt-1 italic">[包含 {msg.attachments.length} 个媒体文件]</p>
                    )}
                 </div>
               ))
             )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;