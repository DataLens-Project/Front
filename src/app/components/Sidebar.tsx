import { Link, useLocation } from "react-router";
import { LayoutDashboard, FlaskConical, FolderOpen, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "대시보드", path: "/" },
  { icon: FlaskConical, label: "새 분석 시작", path: "/analysis" },
  { icon: FolderOpen, label: "분석 보관함", path: "/archive" },
  { icon: Settings, label: "설정", path: "/settings" },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="h-screen bg-sidebar border-r border-sidebar-border sticky top-0 flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-white font-bold">DL</span>
            </div>
            <div>
              <h2 className="text-sidebar-foreground font-semibold">Data Lens</h2>
              <p className="text-xs text-sidebar-foreground/60">AI 데이터 분석</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 flex items-center justify-center text-sidebar-foreground transition-colors"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}