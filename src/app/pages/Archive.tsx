import { FolderOpen, Calendar, FileSpreadsheet, Tag, TrendingUp, Search, Filter, Pencil, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://datalens-alb-363062243.ap-northeast-2.elb.amazonaws.com:8000";

type ArchiveItem = {
  id: number;
  file_name: string;
  recommended_method: string;
  insights: string[];
  created_at: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR");
}

export function Archive() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("전체");
  const [items, setItems] = useState<ArchiveItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/reports?limit=200`);
        if (!res.ok) return;
        const data = (await res.json()) as { items: ArchiveItem[] };
        setItems(data.items || []);
      } catch {
        // 연결 실패 시 빈 목록 유지
      }
    };
    void load();
  }, []);

  const filters = ["전체", "이번 주", "이번 달", "3개월", "6개월"];

  const filteredAnalyses = items.filter(analysis =>
    analysis.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    analysis.recommended_method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm("이 분석 리포트를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reports/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await res.text();
        alert(`삭제 실패: ${msg}`);
        return;
      }
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      alert(`삭제 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    }
  };

  const handleEdit = async (id: number, oldName: string) => {
    const next = prompt("새 파일명을 입력하세요", oldName);
    if (!next || next.trim() === oldName) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: next.trim() }),
      });
      if (!res.ok) {
        const msg = await res.text();
        alert(`수정 실패: ${msg}`);
        return;
      }
      const updated = (await res.json()) as ArchiveItem;
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
    } catch (e) {
      alert(`수정 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    }
  };

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
                  총 <span className="font-semibold text-accent">{items.length}개</span>의 분석 리포트가 저장되어 있습니다.
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
                      완료
                    </span>
                  </div>

                  {/* File Name */}
                      <h3 className="font-semibold text-foreground truncate group-hover:text-accent transition-colors mb-3">
                        {analysis.file_name}
                  </h3>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs flex items-center gap-1">
                          <Tag size={10} />
                          {analysis.recommended_method}
                        </span>
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                          <span>{formatDate(analysis.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-accent">
                      <TrendingUp size={14} />
                          <span>{analysis.insights.length}개</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      className="px-3 py-2 text-xs bg-secondary rounded-lg hover:bg-secondary/80"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void handleEdit(analysis.id, analysis.file_name);
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Pencil size={12} /> 편집
                      </span>
                    </button>
                    <button
                      className="px-3 py-2 text-xs bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void handleDelete(analysis.id);
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 size={12} /> 삭제
                      </span>
                    </button>
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