import { TrendingUp, Database, Zap, Calendar, FileSpreadsheet, Tag } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";

const mockAnalyses = [
  {
    id: "1",
    fileName: "고객_만족도_설문_2024.xlsx",
    tags: ["T-검정", "상관분석"],
    date: "2026.04.01",
    insights: 3,
  },
  {
    id: "2",
    fileName: "매출_데이터_Q1.csv",
    tags: ["회귀분석", "시계열"],
    date: "2026.03.28",
    insights: 5,
  },
  {
    id: "3",
    fileName: "제품_AB_테스트_결과.xlsx",
    tags: ["ANOVA", "카이제곱"],
    date: "2026.03.25",
    insights: 4,
  },
  {
    id: "4",
    fileName: "직원_근속년수_분석.csv",
    tags: ["기술통계", "분산분석"],
    date: "2026.03.20",
    insights: 2,
  },
];

const weeklyStats = [
  { label: "분석한 데이터셋", value: "5", icon: Database, color: "text-[#14B8A6]" },
  { label: "도출된 인사이트", value: "14", icon: Zap, color: "text-[#8B5CF6]" },
  { label: "생성된 리포트", value: "3", icon: FileSpreadsheet, color: "text-[#F59E0B]" },
];

export function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">Data Lens에 오신 것을 환영합니다 👋</h1>
            <p className="text-muted-foreground">
              이번 주 <span className="font-semibold text-accent">5개의 데이터셋</span>에서 인사이트를 도출했습니다.
            </p>
          </motion.div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Weekly Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {weeklyStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`${stat.color}`} size={32} />
                  <span className="text-4xl font-bold text-foreground">{stat.value}</span>
                </div>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </motion.div>

        {/* Recent Analyses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">최근 분석 이력</h2>
            <Link
              to="/analysis"
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              <Zap size={18} />
              새 분석 시작
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockAnalyses.map((analysis, idx) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
              >
                <Link to={`/report/${analysis.id}`}>
                  <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-accent/50 transition-all cursor-pointer group">
                    {/* File Name */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-accent/20 group-hover:text-accent transition-colors">
                          <FileSpreadsheet size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                            {analysis.fileName}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Calendar size={14} />
                            <span>{analysis.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {analysis.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm flex items-center gap-1"
                        >
                          <Tag size={12} />
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Insights Count */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp size={16} className="text-accent" />
                      <span>{analysis.insights}개의 인사이트 도출</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-primary to-accent/80 rounded-xl p-8 text-primary-foreground"
        >
          <h3 className="text-2xl font-bold mb-2">데이터 분석이 처음이신가요?</h3>
          <p className="mb-6 opacity-90">AI가 단계별로 안내해드립니다. 엑셀 파일만 업로드하면 나머지는 저희가 처리합니다.</p>
          <Link
            to="/analysis"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-white/90 transition-colors"
          >
            <Zap size={20} />
            지금 시작하기
          </Link>
        </motion.div>
      </div>
    </div>
  );
}