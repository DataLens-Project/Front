import { FileDown, Calendar, TrendingUp, BarChart3, CheckCircle2, Info } from "lucide-react";
import { motion } from "motion/react";
import { useParams, Link } from "react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useEffect, useMemo, useState } from "react";

type ChartRow = {
  category: string;
  value: number;
  raw_mean?: number;
};

type ReportResponse = {
  id: number;
  file_name: string;
  question: string;
  recommended_method: string;
  explanation: string;
  insights: string[];
  chart_data: ChartRow[];
  summary: {
    row_count: number;
    column_count: number;
    missing_total: number;
  };
  evidence: Record<string, unknown>;
  created_at: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://datalens-alb-363062243.ap-northeast-2.elb.amazonaws.com:8000";

function methodListFromEvidence(evidence: Record<string, unknown> | undefined, fallback: string): string {
  if (!evidence) return fallback;
  const mapping: Record<string, string> = {
    t_test: "T-검정",
    correlation: "상관분석",
    anova: "ANOVA",
    regression: "회귀분석",
    chi_square: "교차분석",
  };
  const methods = Object.entries(mapping)
    .filter(([key]) => Boolean((evidence as Record<string, unknown>)[key]))
    .map(([, label]) => label);
  return methods.length > 0 ? methods.join(", ") : fallback;
}

export function InsightReport() {
  const { id } = useParams();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("리포트 ID가 없습니다.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE_URL}/reports/${id}`);
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "리포트를 불러오지 못했습니다.");
        }
        const data = (await res.json()) as ReportResponse;
        setReport(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const createdDate = useMemo(() => {
    if (!report?.created_at) return "-";
    return new Date(report.created_at).toLocaleDateString("ko-KR");
  }, [report?.created_at]);

  const missingRate = useMemo(() => {
    if (!report?.summary) return "0.0";
    const denom = Math.max(report.summary.row_count * report.summary.column_count, 1);
    return ((report.summary.missing_total / denom) * 100).toFixed(1);
  }, [report?.summary]);

  const methodSummary = useMemo(() => {
    return methodListFromEvidence(report?.evidence, report?.recommended_method || "기술통계");
  }, [report?.evidence, report?.recommended_method]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        리포트를 불러오는 중입니다...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-destructive">{error || "리포트를 찾을 수 없습니다."}</p>
        <Link to="/archive" className="text-accent hover:underline">보관함으로 이동</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← 대시보드로 돌아가기
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors">
            <FileDown size={18} />
            PDF로 내보내기
          </button>
        </div>
      </header>

      {/* Report Content */}
      <div className="max-w-5xl mx-auto px-8 py-12 space-y-12">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
            <CheckCircle2 size={16} />
            분석 완료
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            {report.file_name} 통계 분석 리포트
          </h1>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{createdDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} />
              <span>{methodSummary}</span>
            </div>
          </div>
        </motion.div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-primary to-accent/80 rounded-2xl p-8 text-primary-foreground"
        >
          <h2 className="text-2xl font-bold mb-4">분석 요약</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm opacity-80 mb-1">데이터 행 수</p>
              <p className="text-3xl font-bold">{report.summary?.row_count ?? 0}</p>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">변수 개수</p>
              <p className="text-3xl font-bold">{report.summary?.column_count ?? 0}</p>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">결측치</p>
              <p className="text-3xl font-bold">{missingRate}%</p>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">통계 기법</p>
              <p className="text-3xl font-bold">{methodSummary.split(",").length}개</p>
            </div>
          </div>
        </motion.div>

        {/* Analysis Section 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">1. 핵심 분석 결과</h2>
            <p className="text-muted-foreground">
              추천 기법은 {report.recommended_method}이며, 업로드된 데이터에서 계산한 요약 통계를 기반으로 결과를 정리했습니다.
            </p>
          </div>

          <div className="bg-background rounded-xl p-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={report.chart_data || []}>
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

          <div className="space-y-4">
            <div className="p-5 bg-accent/5 border-l-4 border-accent rounded-r-lg">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <TrendingUp size={18} className="text-accent" />
                주요 발견사항
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {report.explanation}
              </p>
            </div>

            <div className="p-5 bg-[#8B5CF6]/5 border-l-4 border-[#8B5CF6] rounded-r-lg">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Info size={18} className="text-[#8B5CF6]" />
                분석 질문
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {report.question}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Analysis Section 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">2. 인사이트 및 시사점</h2>
            <p className="text-muted-foreground">
              아래 항목은 이번 데이터에서 추출된 핵심 인사이트입니다.
            </p>
          </div>

          <div className="space-y-4">
            {(report.insights || []).map((insight, idx) => (
              <div key={idx} className="p-5 bg-accent/5 border-l-4 border-accent rounded-r-lg">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <TrendingUp size={18} className="text-accent" />
                  핵심 인사이트 {idx + 1}
                </h4>
                <p className="text-muted-foreground leading-relaxed">{insight}</p>
              </div>
            ))}

            {(report.insights || []).length === 0 && (
              <div className="p-5 bg-secondary rounded-r-lg">
                <p className="text-muted-foreground">저장된 인사이트가 없습니다.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Conclusion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-8 space-y-4"
        >
          <h2 className="text-2xl font-bold text-foreground">결론 및 권장사항</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              본 분석의 주요 결론은 {report.explanation}
            </p>
            <p>
              권장되는 우선 분석 기법은 {report.recommended_method}이며, 필요 시 보관함에서 동일 리포트 기준으로 후속 질문을 진행할 수 있습니다.
            </p>
            <p>
              다음 단계로는 영향력이 큰 변수 중심의 추가 분석과 데이터 수집 범위 확장을 권장합니다.
            </p>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground pt-8 border-t border-border"
        >
          <p>본 리포트는 Data Lens AI가 자동으로 생성했습니다.</p>
          <p className="mt-1">보고서 ID: {report.id} | 생성일: {createdDate}</p>
        </motion.div>
      </div>
    </div>
  );
}