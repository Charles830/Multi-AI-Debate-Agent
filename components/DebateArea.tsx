import React, { useEffect, useRef, useState } from 'react';
import { AgentConfig, Message, DebateStatus } from '../types';
import { JUDGE_AGENT } from '../constants';
import { Bot, Gavel, Globe, ImageIcon, Video, Mic } from 'lucide-react';

interface DebateAreaProps {
  messages: Message[];
  status: DebateStatus;
  currentSpeakerId?: string;
  agents: AgentConfig[];
}

export const DebateArea: React.FC<DebateAreaProps> = ({ 
  messages, 
  status, 
  currentSpeakerId,
  agents 
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track failed image loads to fallback to emoji
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, status, currentSpeakerId]);

  const getAgentById = (id: string) => {
    if (id === 'judge') return JUDGE_AGENT;
    return agents.find(a => a.id === id) || agents[0];
  };

  const handleImgError = (id: string) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  const getBubbleColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-900 border-blue-200',
      purple: 'bg-purple-50 text-purple-900 border-purple-200',
      teal: 'bg-teal-50 text-teal-900 border-teal-200',
      slate: 'bg-slate-100 text-slate-900 border-slate-200',
      amber: 'bg-amber-50 text-amber-900 border-amber-200',
    };
    return colors[color] || colors.slate;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden relative">
       
       {/* Debate Stage - Top Area */}
       <div className="relative bg-gradient-to-b from-slate-100 to-slate-200 border-b border-slate-300 shrink-0 overflow-hidden flex flex-col justify-end" style={{ height: '280px' }}>
          
          {/* Stage Label */}
          <div className="absolute top-3 left-4 text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 z-10 bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm">
            <Bot className="w-3 h-3" /> 辩论现场
          </div>

          {/* Background/Floor Elements */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #fff 0%, transparent 70%)' }}></div>
          
          {/* Characters Container (1x4 Horizontal) */}
          <div className="flex justify-center items-end w-full px-4 pb-0 h-full max-w-6xl mx-auto gap-2 md:gap-8 relative z-10">
            {agents.map((agent) => {
              const isSpeaking = currentSpeakerId === agent.id;
              const useFallback = !agent.imageUrl || imgErrors[agent.id];
              
              return (
                <div 
                  key={agent.id} 
                  className={`relative flex flex-col items-center justify-end transition-all duration-500 ease-out w-1/4 md:w-48 group`}
                >
                   {/* Speech Indicator Bubble */}
                   {isSpeaking && (
                     <div className={`absolute -top-12 animate-bounce bg-white border-2 border-${agent.color}-500 px-3 py-1.5 rounded-xl shadow-lg z-30 flex items-center gap-1.5 pointer-events-none`}>
                        <Mic className={`w-3 h-3 text-${agent.color}-600 fill-current`} />
                        <span className={`text-xs font-bold text-${agent.color}-700 whitespace-nowrap`}>发言中</span>
                        <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b-2 border-r-2 border-${agent.color}-500 rotate-45`}></div>
                     </div>
                   )}

                   {/* Avatar Image Area */}
                   <div 
                     className={`
                       relative w-full flex items-end justify-center transition-all duration-300 z-20
                       ${isSpeaking ? 'scale-110 -translate-y-2' : 'scale-100 hover:scale-105'}
                     `}
                     style={{ height: '180px' }}
                   >
                     {/* Spotlight/Glow Effect behind active speaker */}
                     {isSpeaking && (
                       <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-32 bg-${agent.color}-400/30 blur-3xl rounded-full`}></div>
                     )}

                     {!useFallback ? (
                       <img 
                         src={agent.imageUrl} 
                         alt={agent.name} 
                         onError={() => handleImgError(agent.id)}
                         referrerPolicy="no-referrer"
                         className={`
                           h-full w-auto object-contain drop-shadow-lg transition-all duration-300
                           ${isSpeaking ? 'drop-shadow-2xl brightness-110' : 'grayscale-[0.3] opacity-90 hover:grayscale-0 hover:opacity-100'}
                         `}
                       />
                     ) : (
                       // Fallback for no image or error
                       <div className={`w-24 h-32 rounded-t-2xl flex items-center justify-center bg-${agent.color}-100 border-2 border-${agent.color}-200 shadow-inner`}>
                         <span className="text-6xl drop-shadow-md filter grayscale-[0.2]">{agent.avatar}</span>
                       </div>
                     )}
                   </div>

                   {/* Podium/Nameplate */}
                   <div className={`
                      w-full h-10 flex items-center justify-center rounded-t-lg z-20 relative shadow-md border-t transition-colors duration-300
                      bg-gradient-to-b from-white to-slate-50
                      ${isSpeaking ? `border-${agent.color}-400 ring-2 ring-${agent.color}-200 ring-opacity-50` : 'border-slate-200'}
                   `}>
                     <div className={`
                        text-xs md:text-sm font-bold uppercase tracking-wide px-2 truncate
                        ${isSpeaking ? `text-${agent.color}-700` : 'text-slate-500'}
                     `}>
                       {agent.name}
                     </div>
                   </div>

                   {/* Podium Base (Visual anchor) */}
                   <div className={`w-[110%] h-2 rounded-full bg-slate-300/50 blur-sm absolute -bottom-1 z-0 ${isSpeaking ? 'scale-110 opacity-80' : 'opacity-50'}`}></div>
                </div>
              );
            })}
          </div>
       </div>

      {/* Scrollable Chat Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scroll-smooth"
      >
        {messages.map((msg) => {
          const agent = getAgentById(msg.agentId);
          const isJudge = msg.agentId === 'judge';
          
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col ${isJudge ? 'items-center my-8' : 'items-start'}`}
            >
              {!isJudge && (
                <div className="flex items-center gap-2 mb-2 ml-1">
                  {/* Chat Avatar (Small Circle) */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm ring-2 bg-white ring-${agent.color}-100 overflow-hidden border border-slate-100`}>
                    {agent.imageUrl && !imgErrors[agent.id] ? (
                       <img 
                        src={agent.imageUrl} 
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top" 
                       />
                    ) : (
                       agent.avatar
                    )}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wide text-${agent.color}-600`}>
                    {agent.name}
                  </span>
                  {msg.round && (
                     <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">R{msg.round}</span>
                  )}
                </div>
              )}

              {isJudge && (
                <div className="flex items-center gap-2 mb-3 animate-bounce-in">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <Gavel className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-amber-800 font-bold text-lg">最终裁决</span>
                </div>
              )}

              <div 
                className={`relative max-w-3xl px-5 py-4 rounded-2xl border ${getBubbleColor(agent.color)} ${isJudge ? 'shadow-xl border-amber-300 bg-amber-50' : 'shadow-sm rounded-tl-none'}`}
              >
                <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {msg.content}
                </p>

                {/* Attachments Grid */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {msg.attachments.map((att, idx) => (
                      <div key={idx} className="rounded-lg overflow-hidden border border-slate-200 bg-black/5 relative group shadow-md">
                        {att.type === 'image' ? (
                           <img src={att.url} alt={att.title} className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="relative w-full h-48 bg-black flex items-center justify-center">
                             <video src={att.url} controls className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                           <div className="flex items-center gap-1 text-white text-xs">
                              {att.type === 'image' ? <ImageIcon className="w-3 h-3"/> : <Video className="w-3 h-3"/>}
                              <span className="truncate">{att.title || 'Generated Media'}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Grounding Sources */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/50">
                     <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1 flex items-center gap-1">
                       <Globe className="w-3 h-3" /> 参考来源
                     </p>
                     <div className="flex flex-wrap gap-2">
                       {msg.groundingSources.map((source, idx) => (
                         <a 
                           key={idx}
                           href={source.uri}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-xs bg-white/50 hover:bg-white px-2 py-1 rounded border border-slate-200/50 truncate max-w-[200px] transition-colors"
                         >
                           {source.title}
                         </a>
                       ))}
                     </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {status === DebateStatus.DEBATING && currentSpeakerId && (
          <div className="flex items-start animate-pulse opacity-70 ml-1">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <div className="text-xs text-slate-400 ml-2">
                  {agents.find(a => a.id === currentSpeakerId)?.name || 'AI'} 正在思考与创作...
                </div>
             </div>
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>
    </div>
  );
};