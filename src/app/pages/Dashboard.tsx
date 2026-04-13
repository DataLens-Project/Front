import { TrendingUp, Database, Zap, Calendar, FileSpreadsheet, Tag } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

type ReportItem = {
  id: number;
  file_name: string;
  recommended_method: string;
  insights: string[];
  created_at: string;
};

type StatsResponse = {
  total_reports: number;
  total_insights: number;
  generated_reports: number;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR");
}

export function Dashboard() {
  const [stats, setStats] = useState<StatsResponse>({
    total_reports: 0,
    total_insights: 0,
    generated_reports: 0,
  });
  const [recentReports, setRecentReports] = useState<ReportItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, reportRes] = await Promise.all([
          fetch(`${API_BASE_URL}/reports/stats`),
          fetch(`${API_BASE_URL}/reports?limit=4`),
        ]);

        if (statsRes.ok) {
          const s = (await statsRes.json()) as StatsResponse;
          setStats(s);
        }
        if (reportRes.ok) {
          const r = (await reportRes.json()) as { items: ReportItem[] };
          setRecentReports(r.items || []);
        }
      } catch {
        // 네트워크 오류 시 기본값 유지
      }
    };
    void load();
  }, []);

  const weeklyStats = useMemo(
    () => [
      { label: "분석한 데이터셋", value: String(stats.total_reports), icon: Database, color: "text-[#14B8A6]" },
      { label: "도출된 인사이트", value: String(stats.total_insights), icon: Zap, color: "text-[#8B5CF6]" },
      { label: "생성된 리포트", value: String(stats.generated_reports), icon: FileSpreadsheet, color: "text-[#F59E0B]" },
    ],
    [stats]
  );

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
              현재까지 <span className="font-semibold text-accent">{stats.total_reports}개의 데이터셋</span>을 분석했습니다.
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
            {recentReports.map((analysis, idx) => (
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
                            {analysis.file_name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Calendar size={14} />
                            <span>{formatDate(analysis.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm flex items-center gap-1">
                        <Tag size={12} />
                        {analysis.recommended_method}
                      </span>
                    </div>

                    {/* Insights Count */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp size={16} className="text-accent" />
                      <span>{analysis.insights.length}개의 인사이트 도출</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            {recentReports.length === 0 && (
              <div className="text-muted-foreground">아직 저장된 분석 리포트가 없습니다.</div>
            )}
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