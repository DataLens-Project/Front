import { useState } from "react";
import { Upload, Send, Table2, BarChart3, FileText, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { LoadingAnimation } from "../components/LoadingAnimation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

// Mock data for visualization
const mockChartData = [
  { id: 'a', category: "그룹 A", value: 45, std: 5.2 },
  { id: 'b', category: "그룹 B", value: 52, std: 4.8 },
  { id: 'c', category: "그룹 C", value: 38, std: 6.1 },
  { id: 'd', category: "그룹 D", value: 61, std: 3.9 },
];

const mockTableData = [
  { id: 1, name: "변수1", type: "연속형", missing: "0%", mean: "45.6" },
  { id: 2, name: "변수2", type: "범주형", missing: "2%", unique: "4" },
  { id: 3, name: "변수3", type: "연속형", missing: "0%", mean: "128.3" },
  { id: 4, name: "변수4", type: "범주형", missing: "5%", unique: "2" },
];

type Message = {
  role: 'user' | 'ai';
  content: string;
  actions?: Array<{ label: string; onClick: () => void }>;
};

export function AnalysisLab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: '안녕하세요! 데이터 분석을 도와드리겠습니다. 먼저 분석하실 엑셀 또는 CSV 파일을 업로드해주세요.',
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'chart' | 'insight'>('table');
  const [fileUploaded, setFileUploaded] = useState(false);

  const handleFileUpload = () => {
    setFileUploaded(true);
    setIsLoading(true);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '파일이 성공적으로 업로드되었습니다! 데이터를 분석한 결과:\n\n• 총 250개의 행과 4개의 변수가 있습니다.\n• 결측치가 일부(약 3.5%) 발견되었습니다.\n• 연속형 변수 2개, 범주형 변수 2개로 구성되어 있습니다.\n\n어떤 분석을 원하시나요?',
        actions: [
          { label: 'T-검정 실행하기', onClick: () => handleAnalysisAction('t-test') },
          { label: '상관분석 실행하기', onClick: () => handleAnalysisAction('correlation') },
          { label: '기술통계 보기', onClick: () => handleAnalysisAction('descriptive') },
        ],
      }]);
      setIsLoading(false);
    }, 2000);
  };

  const handleAnalysisAction = (type: string) => {
    setMessages(prev => [...prev, { role: 'user', content: `${type} 분석을 실행해주세요.` }]);
    setIsLoading(true);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `${type} 분석이 완료되었습니다! 우측 시각화 영역에서 결과를 확인하실 수 있습니다.\n\n주요 발견사항:\n• 그룹 간 유의미한 차이가 발견되었습니다 (p < 0.05)\n• 효과 크기(Effect Size)가 중간 수준입니다\n• 추가적인 후속 분석을 권장드립니다`,
      }]);
      setIsLoading(false);
      setActiveTab('chart');
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '질문 감사합니다. 데이터 분석에 대해 더 자세히 설명드리겠습니다. 통계적 유의성은 p-value가 0.05보다 작을 때 인정됩니다.',
      }]);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="h-screen flex">
      {/* Left Panel - Chat & Control */}
      <div className="w-[35%] border-r border-border flex flex-col bg-card">
        {/* Upload Area */}
        <div className="p-6 border-b border-border">
          <motion.div
            whileHover={{ scale: fileUploaded ? 1 : 1.02 }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              fileUploaded 
                ? 'border-accent bg-accent/5' 
                : 'border-border hover:border-accent hover:bg-accent/5'
            }`}
            onClick={!fileUploaded ? handleFileUpload : undefined}
          >
            <Upload className={`mx-auto mb-3 ${fileUploaded ? 'text-accent' : 'text-muted-foreground'}`} size={32} />
            <h3 className="font-semibold text-foreground mb-1">
              {fileUploaded ? '✓ 데이터 업로드 완료' : '파일을 드래그하거나 클릭하세요'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {fileUploaded ? '고객_만족도_설문_2024.xlsx' : 'Excel (.xlsx) 또는 CSV 파일 지원'}
            </p>
          </motion.div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'space-y-3'}`}>
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                      <Sparkles size={14} className="text-accent-foreground" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">AI 어시스턴트</span>
                  </div>
                )}
                
                <div className={`p-4 rounded-2xl whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {msg.content}
                </div>

                {msg.actions && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.actions.map((action, actionIdx) => (
                      <button
                        key={actionIdx}
                        onClick={action.onClick}
                        className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-secondary p-4 rounded-2xl">
                <LoadingAnimation />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="AI에게 질문하세요..."
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Visualization */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Tabs */}
        <div className="border-b border-border bg-card">
          <div className="flex px-6">
            {[
              { id: 'table' as const, label: '데이터 테이블', icon: Table2 },
              { id: 'chart' as const, label: '시각화 차트', icon: BarChart3 },
              { id: 'insight' as const, label: '인사이트 리포트', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'table' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <h3 className="text-xl font-bold text-foreground">데이터 메타정보</h3>
                <p className="text-sm text-muted-foreground mt-1">업로드된 데이터의 변수 정보입니다</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">변수명</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">데이터 타입</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">결측치</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">통계량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTableData.map((row) => (
                      <tr key={row.id} className="border-t border-border hover:bg-secondary/50">
                        <td className="px-6 py-4 text-foreground font-medium">{row.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            row.type === '연속형' 
                              ? 'bg-accent/10 text-accent' 
                              : 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{row.missing}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {row.mean ? `평균: ${row.mean}` : `고유값: ${row.unique}개`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'chart' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">그룹별 평균 비교</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="category" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#14B8A6" name="평균값" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">추세 분석</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="category" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={3} name="값" />
                    <Line type="monotone" dataKey="std" stroke="#F59E0B" strokeWidth={2} name="표준편차" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'insight' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-xl border border-border p-8 space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">통계 분석 인사이트</h2>
                <p className="text-muted-foreground">AI가 자동으로 생성한 분석 결과 해석입니다</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-accent/10 border-l-4 border-accent rounded-r-lg">
                  <h4 className="font-semibold text-foreground mb-2">📊 주요 발견사항</h4>
                  <p className="text-sm text-muted-foreground">
                    그룹 D가 가장 높은 평균값(61)을 보이며, 그룹 C가 가장 낮은 값(38)을 기록했습니다. 
                    통계적으로 유의미한 차이가 확인되었습니다 (p {'<'} 0.05).
                  </p>
                </div>

                <div className="p-4 bg-[#8B5CF6]/10 border-l-4 border-[#8B5CF6] rounded-r-lg">
                  <h4 className="font-semibold text-foreground mb-2">💡 해석 및 권장사항</h4>
                  <p className="text-sm text-muted-foreground">
                    그룹 간 차이가 명확하므로, 각 그룹의 특성을 개별적으로 분석하는 것을 권장드립니다. 
                    추가적인 사후 검정(Post-hoc test)을 통해 어느 그룹 간의 차이가 유의미한지 확인해보세요.
                  </p>
                </div>

                <div className="p-4 bg-[#F59E0B]/10 border-l-4 border-[#F59E0B] rounded-r-lg">
                  <h4 className="font-semibold text-foreground mb-2">⚠️ 유의사항</h4>
                  <p className="text-sm text-muted-foreground">
                    표본 크기가 충분한지 확인이 필요합니다. 
                    데이터에 결측치가 일부 있으므로, 완전 데이터 분석 결과와 차이가 있을 수 있습니다.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}