import { FolderOpen, Calendar, FileSpreadsheet, Tag, TrendingUp, Search, Filter } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { useState } from "react";

const mockArchivedAnalyses = [
  {
    id: "1",
    fileName: "고객_만족도_설문_2024.xlsx",
    tags: ["T-검정", "상관분석"],
    date: "2026.04.01",
    insights: 3,
    status: "완료",
  },
  {
    id: "2",
    fileName: "매출_데이터_Q1.csv",
    tags: ["회귀분석", "시계열"],
    date: "2026.03.28",
    insights: 5,
    status: "완료",
  },
  {
    id: "3",
    fileName: "제품_AB_테스트_결과.xlsx",
    tags: ["ANOVA", "카이제곱"],
    date: "2026.03.25",
    insights: 4,
    status: "완료",
  },
  {
    id: "4",
    fileName: "직원_근속년수_분석.csv",
    tags: ["기술통계", "분산분석"],
    date: "2026.03.20",
    insights: 2,
    status: "완료",
  },
  {
    id: "5",
    fileName: "설문조사_결과_2024_Q4.xlsx",
    tags: ["기술통계", "T-검정"],
    date: "2026.03.15",
    insights: 3,
    status: "완료",
  },
  {
    id: "6",
    fileName: "마케팅_캠페인_성과.csv",
    tags: ["회귀분석", "상관분석"],
    date: "2026.03.10",
    insights: 6,
    status: "완료",
  },
];

export function Archive() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("전체");

  const filters = ["전체", "이번 주", "이번 달", "3개월", "6개월"];

  const filteredAnalyses = mockArchivedAnalyses.filter(analysis =>
    analysis.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    analysis.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <div className="flex items-center gap-4 mb-4">
              <FolderOpen size={32} className="text-accent" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">분석 보관함</h1>
                <p className="text-muted-foreground mt-1">
                  총 <span className="font-semibold text-accent">{mockArchivedAnalyses.length}개</span>의 분석 이력이 브라우저에 저장되어 있습니다.
                </p>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mt-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="파일명 또는 분석 기법으로 검색..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-muted-foreground" />
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedFilter === filter
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnalyses.map((analysis, idx) => (
            <motion.div
              key={analysis.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link to={`/report/${analysis.id}`}>
                <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-accent/50 transition-all cursor-pointer group h-full">
                  {/* File Icon & Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-accent/20 group-hover:text-accent transition-colors">
                      <FileSpreadsheet size={24} />
                    </div>
                    <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                      {analysis.status}
                    </span>
                  </div>

                  {/* File Name */}
                  <h3 className="font-semibold text-foreground truncate group-hover:text-accent transition-colors mb-3">
                    {analysis.fileName}
                  </h3>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {analysis.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs flex items-center gap-1"
                      >
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{analysis.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-accent">
                      <TrendingUp size={14} />
                      <span>{analysis.insights}개</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filteredAnalyses.length === 0 && (
          <div className="text-center py-16">
            <FolderOpen size={64} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}