import { Settings as SettingsIcon, Database, Palette, Trash2, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "../context/ThemeContext";

export function Settings() {
  const { theme, setTheme } = useTheme();

  const handleClearData = () => {
    if (confirm("모든 분석 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      localStorage.clear();
      alert("모든 데이터가 삭제되었습니다.");
      window.location.reload();
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
            className="flex items-center gap-4"
          >
            <SettingsIcon size={32} className="text-accent" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">설정</h1>
              <p className="text-muted-foreground mt-1">앱 환경설정을 관리합니다</p>
            </div>
          </motion.div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Palette size={24} className="text-accent" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">테마 설정</h2>
              <p className="text-muted-foreground">원하는 테마를 선택하세요</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 p-6 rounded-lg border-2 transition-all ${
                theme === "light"
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-accent/50"
              }`}
            >
              <Sun size={32} className="mx-auto mb-3 text-foreground" />
              <p className="font-medium text-lg text-foreground">라이트 모드</p>
              <p className="text-sm text-muted-foreground mt-1">밝은 테마</p>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 p-6 rounded-lg border-2 transition-all ${
                theme === "dark"
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-accent/50"
              }`}
            >
              <Moon size={32} className="mx-auto mb-3 text-foreground" />
              <p className="font-medium text-lg text-foreground">다크 모드</p>
              <p className="text-sm text-muted-foreground mt-1">어두운 테마</p>
            </button>
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Database size={24} className="text-accent" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">데이터 관리</h2>
              <p className="text-muted-foreground">로컬 저장소에 저장된 데이터를 관리합니다</p>
            </div>
          </div>

          <div className="p-4 bg-muted/30 border-l-4 border-muted rounded-r-lg mb-6">
            <p className="text-sm text-foreground">
              모든 분석 데이터는 브라우저 로컬 저장소에 저장됩니다. 브라우저 캐시를 삭제하거나 앱을 제거하면 데이터가 사라집니다.
            </p>
          </div>

          {/* Storage Usage */}
          <div className="p-6 border border-border rounded-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">저장 공간 사용량</h3>
              <span className="text-sm text-muted-foreground">2.4 MB / 10 MB</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div className="bg-accent h-3 rounded-full" style={{ width: "24%" }}></div>
            </div>
          </div>

          {/* Clear Data Button */}
          <div className="p-6 border-2 border-destructive/30 rounded-lg bg-destructive/5">
            <div className="flex items-start gap-4">
              <Trash2 size={24} className="text-destructive mt-1" />
              <div className="flex-1">
                <h3 className="font-medium text-foreground mb-2">모든 데이터 삭제</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  저장된 모든 분석 이력과 설정을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                </p>
                <button
                  onClick={handleClearData}
                  className="px-6 py-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium"
                >
                  모든 데이터 삭제
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-primary to-accent/80 rounded-xl p-8 text-primary-foreground"
        >
          <h3 className="text-2xl font-bold mb-2">Data Lens v1.0</h3>
          <p className="opacity-90 mb-4">
            대화형 AI 데이터 분석 플랫폼 | Powered by Llama 3.2
          </p>
          <p className="text-sm opacity-75">
            © 2026 Data Lens. 모든 데이터는 로컬에서 처리되며 외부로 전송되지 않습니다.
          </p>
        </motion.div>
      </div>
    </div>
  );
}