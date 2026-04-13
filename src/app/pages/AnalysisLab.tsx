import { useEffect, useRef, useState } from "react";
import { Upload, Send, Table2, BarChart3, FileText, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { LoadingAnimation } from "../components/LoadingAnimation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

type Message = {
  role: 'user' | 'ai';
  content: string;
  actions?: Array<{ label: string; onClick: () => void }>;
};

type ChartRow = {
  category: string;
  value: number;
  std?: number;
  raw_mean?: number;
};

type TableRow = {
  name: string;
  dtype: string;
  missing: number;
  unique?: number;
  mean?: number;
};

type AnalyzeResponse = {
  status: string;
  recommended_method: string;
  explanation: string;
  insights: string[];
  chart_data: ChartRow[];
  table_data: TableRow[];
  evidence?: Record<string, unknown>;
  summary?: {
    row_count: number;
    column_count: number;
    missing_total: number;
  };
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [summary, setSummary] = useState<AnalyzeResponse['summary']>();
  const [recommendedMethod, setRecommendedMethod] = useState("-");
  const [explanation, setExplanation] = useState("");
  const [progress, setProgress] = useState(0);
  const [evidence, setEvidence] = useState<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<number | null>(null);
  const progressStartRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  const startProgress = () => {
    progressStartRef.current = Date.now();
    setProgress(1);
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
    }
    progressTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - progressStartRef.current;
      let target = 5;

      if (elapsed < 8000) {
        target = 5 + (elapsed / 8000) * 85; // 5 -> 90
      } else if (elapsed < 18000) {
        target = 90 + ((elapsed - 8000) / 10000) * 8; // 90 -> 98
      } else {
        target = 98 + Math.min((elapsed - 18000) / 5000, 1); // 98 -> 99
      }

      setProgress((prev) => Math.max(prev, Math.min(target, 99)));
    }, 250);
  };

  const finishProgress = async () => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgress(100);
    await new Promise((resolve) => window.setTimeout(resolve, 350));
  };

  const runAnalyze = async (file: File, questionText: string) => {
    setIsLoading(true);
    startProgress();
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("question", questionText || "데이터 핵심 인사이트를 설명해줘");

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "분석 요청 실패");
      }

      const data = (await response.json()) as AnalyzeResponse;
      setChartData(data.chart_data || []);
      setTableData(data.table_data || []);
      setInsights(data.insights || []);
      setSummary(data.summary);
      setEvidence(data.evidence || null);
      setRecommendedMethod(data.recommended_method || "-");
      setExplanation(data.explanation || "");

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content:
            `분석이 완료되었습니다. 추천 기법: ${data.recommended_method}\n\n${data.explanation}`,
        },
      ]);
      setActiveTab('insight');
    } catch (error) {
      const detail = error instanceof Error ? error.message : "알 수 없는 오류";
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `분석 중 오류가 발생했습니다.\n${detail}`,
        },
      ]);
    } finally {
      await finishProgress();
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setFileUploaded(true);
    setMessages((prev) => [
      ...prev,
      { role: 'ai', content: `파일 업로드 완료: ${file.name}\n기본 분석을 시작합니다.` },
    ]);
    await runAnalyze(file, input);
  };

  const handleAnalysisAction = async (type: string) => {
    if (!selectedFile) {
      setMessages((prev) => [...prev, { role: 'ai', content: '먼저 파일을 업로드해 주세요.' }]);
      return;
    }
    const query = `${type} 중심으로 분석해줘`;
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    await runAnalyze(selectedFile, query);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const question = input;
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setInput("");

    if (!selectedFile) {
      setMessages((prev) => [...prev, { role: 'ai', content: '파일 업로드 후 질문해 주세요.' }]);
      return;
    }

    await runAnalyze(selectedFile, question);
  };

  const evidenceCount = Object.values(evidence || {}).filter((v) => v).length;
  const analysisTechniqueCount = evidenceCount > 0 ? evidenceCount : (recommendedMethod !== "-" ? 1 : 0);
  const today = new Date().toLocaleDateString("ko-KR");

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
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleFileUpload(file);
                }
                e.currentTarget.value = "";
              }}
            />
            <Upload className={`mx-auto mb-3 ${fileUploaded ? 'text-accent' : 'text-muted-foreground'}`} size={32} />
            <h3 className="font-semibold text-foreground mb-1">
              {fileUploaded ? '✓ 데이터 업로드 완료' : '파일을 드래그하거나 클릭하세요'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {fileUploaded && selectedFile ? selectedFile.name : 'Excel (.xlsx) 또는 CSV 파일 지원'}
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
              <div className="bg-secondary p-4 rounded-2xl min-w-[220px]">
                <LoadingAnimation />
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-1">분석 진행률 {progress.toFixed(1)}%</div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
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
                <p className="text-sm text-muted-foreground mt-1">
                  업로드된 데이터의 변수 정보입니다
                  {summary ? ` · ${summary.row_count}행 / ${summary.column_count}열 / 결측 ${summary.missing_total}개` : ''}
                </p>
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
                    {tableData.map((row, idx) => (
                      <tr key={`${row.name}-${idx}`} className="border-t border-border hover:bg-secondary/50">
                        <td className="px-6 py-4 text-foreground font-medium">{row.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            row.dtype.includes('float') || row.dtype.includes('int')
                              ? 'bg-accent/10 text-accent' 
                              : 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
                          }`}>
                            {row.dtype}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{row.missing}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {typeof row.mean === 'number' ? `평균: ${row.mean}` : `고유값: ${row.unique ?? 0}개`}
                        </td>
                      </tr>
                    ))}
                    {tableData.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-muted-foreground" colSpan={4}>아직 분석 데이터가 없습니다.</td>
                      </tr>
                    )}
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
                  <BarChart data={chartData}>
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
                    <Bar dataKey="value" fill="#14B8A6" name="표준화 값(0-100)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">추세 분석</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
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
                    <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={3} name="표준화 값" />
                    <Line type="monotone" dataKey="std" stroke="#F59E0B" strokeWidth={2} name="보조지표" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'insight' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-card rounded-xl border border-border p-8">
                <h2 className="text-3xl font-bold text-foreground">고객 만족도 설문 통계 분석 리포트</h2>
                <p className="text-muted-foreground mt-2">{today} · {recommendedMethod}</p>
              </div>

              <div className="bg-gradient-to-br from-primary to-accent/80 rounded-xl p-6 text-primary-foreground">
                <h3 className="text-xl font-bold mb-4">분석 요약</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm opacity-80">데이터 행 수</p>
                    <p className="text-2xl font-bold">{summary?.row_count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">변수 개수</p>
                    <p className="text-2xl font-bold">{summary?.column_count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">결측치</p>
                    <p className="text-2xl font-bold">{summary?.missing_total ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">통계 기법</p>
                    <p className="text-2xl font-bold">{analysisTechniqueCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h3 className="text-2xl font-bold text-foreground">1. 그룹별 지표 비교 분석</h3>
                <p className="text-muted-foreground">
                  추천 기법: {recommendedMethod}. 서로 단위가 다른 지표를 비교하기 위해 차트는 표준화(0~100) 값으로 표시했습니다.
                </p>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
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
                <div className="p-4 bg-accent/10 border-l-4 border-accent rounded-r-lg">
                  <h4 className="font-semibold text-foreground mb-2">주요 발견사항</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {explanation || "분석 설명이 아직 없습니다."}
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h3 className="text-2xl font-bold text-foreground">2. 변수 간 관계 분석</h3>
                <p className="text-muted-foreground">차트와 통계 근거를 함께 검토해 상관 구조를 해석합니다.</p>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
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
                    <Line type="monotone" dataKey="std" stroke="#F59E0B" strokeWidth={2} name="보조지표" />
                  </LineChart>
                </ResponsiveContainer>

                {evidence && (
                  <div className="p-4 bg-secondary rounded-r-lg">
                    <h4 className="font-semibold text-foreground mb-2">통계 근거 요약</h4>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                      {JSON.stringify(evidence, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="space-y-3">
                  {insights.map((insight, idx) => (
                    <div key={idx} className="p-4 bg-[#8B5CF6]/10 border-l-4 border-[#8B5CF6] rounded-r-lg">
                      <h4 className="font-semibold text-foreground mb-2">실무적 시사점 {idx + 1}</h4>
                      <p className="text-sm text-muted-foreground">{insight}</p>
                    </div>
                  ))}
                  {insights.length === 0 && (
                    <div className="p-4 bg-secondary rounded-r-lg">
                      <p className="text-sm text-muted-foreground">아직 인사이트가 없습니다. 파일 업로드 후 분석을 실행해 주세요.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                <h3 className="text-2xl font-bold text-foreground">결론 및 권장사항</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {explanation || "결론을 생성하려면 파일을 업로드하고 분석을 실행해 주세요."}
                </p>
                <p className="text-sm text-muted-foreground">
                  다음 단계: 상위 영향 변수를 기준으로 추가 실험 또는 세분화 분석을 권장합니다.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}