import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { LoadingAnimation } from "./LoadingAnimation";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://datalens-alb-363062243.ap-northeast-2.elb.amazonaws.com:8000";
const LAST_REPORT_ID_KEY = "datalens_last_report_id";

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai', content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    const question = input.trim();
    if (!question) return;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput("");
    setIsLoading(true);

    const reportIdRaw = window.localStorage.getItem(LAST_REPORT_ID_KEY);
    const reportId = reportIdRaw ? Number(reportIdRaw) : NaN;

    if (!Number.isFinite(reportId) || reportId <= 0) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: '현재 연결된 분석 리포트가 없습니다. 먼저 분석실에서 파일 업로드 후 분석을 실행해 주세요.',
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/assistant/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: reportId, question }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "어시스턴트 응답 실패");
      }

      const data = (await res.json()) as { answer?: string };
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: data.answer || '답변을 생성하지 못했습니다.',
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `질문 처리 중 오류가 발생했습니다.\n${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
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
                  onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={() => void handleSend()}
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
