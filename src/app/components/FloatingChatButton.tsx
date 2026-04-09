import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { LoadingAnimation } from "./LoadingAnimation";

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai', content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages([...messages, { role: 'user', content: input }]);
    setInput("");
    setIsLoading(true);

    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: '안녕하세요! 데이터 분석에 대해 무엇이든 물어보세요. 통계 검정, 시각화, 데이터 해석 등을 도와드릴 수 있습니다.' 
      }]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-card rounded-2xl shadow-2xl border border-border flex flex-col z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-primary text-primary-foreground rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <h3 className="font-semibold">AI 어시스턴트</h3>
                  <p className="text-xs opacity-80">언제든 질문하세요</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                  <p>AI에게 데이터 분석에 대해<br />궁금한 것을 물어보세요</p>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary p-3 rounded-2xl">
                    <LoadingAnimation />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={handleSend}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
                >
                  전송
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-accent-foreground rounded-full shadow-lg flex items-center justify-center z-40 hover:shadow-xl transition-shadow"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </>
  );
}
