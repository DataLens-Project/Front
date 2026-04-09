import { FileDown, Calendar, TrendingUp, BarChart3, CheckCircle2, Info } from "lucide-react";
import { motion } from "motion/react";
import { useParams, Link } from "react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";

const mockChartData = [
  { id: 'a', category: "그룹 A", value: 45, count: 62 },
  { id: 'b', category: "그룹 B", value: 52, count: 58 },
  { id: 'c', category: "그룹 C", value: 38, count: 65 },
  { id: 'd', category: "그룹 D", value: 61, count: 65 },
];

const mockScatterData = [
  { id: 1, x: 23, y: 45 },
  { id: 2, x: 34, y: 52 },
  { id: 3, x: 28, y: 38 },
  { id: 4, x: 41, y: 61 },
  { id: 5, x: 36, y: 55 },
  { id: 6, x: 29, y: 42 },
  { id: 7, x: 38, y: 58 },
];

export function InsightReport() {
  const { id } = useParams();

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
            고객 만족도 설문 통계 분석 리포트
          </h1>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>2026년 4월 1일</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} />
              <span>T-검정, 상관분석</span>
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
              <p className="text-3xl font-bold">250</p>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">변수 개수</p>
              <p className="text-3xl font-bold">4</p>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">결측치</p>
              <p className="text-3xl font-bold">3.5%</p>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">통계 기법</p>
              <p className="text-3xl font-bold">2개</p>
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
            <h2 className="text-2xl font-bold text-foreground mb-2">1. 그룹별 만족도 비교 분석</h2>
            <p className="text-muted-foreground">
              T-검정(Independent Samples t-test)을 활용하여 그룹 간 만족도 점수의 차이를 분석했습니다.
            </p>
          </div>

          <div className="bg-background rounded-xl p-6">
            <ResponsiveContainer width="100%" height={350}>
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
                <Bar dataKey="value" fill="#14B8A6" name="평균 만족도" radius={[8, 8, 0, 0]} />
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
                그룹 D의 만족도가 평균 61점으로 가장 높으며, 그룹 C는 38점으로 가장 낮은 수치를 기록했습니다. 
                통계적으로 유의미한 차이가 확인되었습니다 (t = 3.45, p = 0.001).
              </p>
            </div>

            <div className="p-5 bg-[#8B5CF6]/5 border-l-4 border-[#8B5CF6] rounded-r-lg">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Info size={18} className="text-[#8B5CF6]" />
                통계적 해석
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                효과 크기(Cohen's d = 0.68)는 중간 수준으로, 그룹 간 차이가 실질적으로 의미 있는 수준임을 나타냅니다. 
                신뢰구간 95% 기준으로 그룹 D와 그룹 C의 차이는 18~28점 범위에 있습니다.
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
            <h2 className="text-2xl font-bold text-foreground mb-2">2. 변수 간 상관관계 분석</h2>
            <p className="text-muted-foreground">
              피어슨 상관계수(Pearson Correlation)를 이용하여 변수 간의 선형 관계를 분석했습니다.
            </p>
          </div>

          <div className="bg-background rounded-xl p-6">
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="x" name="변수 X" stroke="#64748B" />
                <YAxis dataKey="y" name="변수 Y" stroke="#64748B" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Scatter name="데이터 포인트" data={mockScatterData} fill="#8B5CF6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-accent/5 border-l-4 border-accent rounded-r-lg">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <TrendingUp size={18} className="text-accent" />
                상관계수 해석
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                두 변수 간 양의 상관관계가 발견되었습니다 (r = 0.72, p {'<'} 0.001). 
                이는 한 변수가 증가할 때 다른 변수도 함께 증가하는 경향이 있음을 의미합니다.
              </p>
            </div>

            <div className="p-5 bg-[#F59E0B]/5 border-l-4 border-[#F59E0B] rounded-r-lg">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Info size={18} className="text-[#F59E0B]" />
                실무적 시사점
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                변수 간의 강한 상관관계는 하나의 지표를 개선하면 다른 지표도 함께 향상될 가능성이 높음을 시사합니다. 
                다만 상관관계가 인과관계를 의미하지는 않으므로, 추가적인 실험적 검증이 필요합니다.
              </p>
            </div>
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
              본 분석을 통해 그룹 간 만족도에 유의미한 차이가 있음을 확인했으며, 
              특히 그룹 D의 만족도가 다른 그룹에 비해 현저히 높은 것으로 나타났습니다.
            </p>
            <p>
              또한 주요 변수 간에 강한 양의 상관관계가 발견되어, 통합적인 개선 전략 수립이 가능할 것으로 판단됩니다.
            </p>
            <p>
              향후 그룹 D의 성공 요인을 심층 분석하여 다른 그룹에 적용하는 전략을 권장드리며, 
              추가적인 질적 연구(인터뷰, 포커스 그룹)를 통한 검증도 필요합니다.
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
          <p className="mt-1">보고서 ID: {id} | 생성일: 2026.04.01</p>
        </motion.div>
      </div>
    </div>
  );
}