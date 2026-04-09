import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Lock, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailLocal: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.emailLocal.trim()) {
      newErrors.emailLocal = "이메일을 입력해주세요.";
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    // Mock login
    setTimeout(() => {
      const fullEmail = `${formData.emailLocal}@cu.ac.kr`;
      localStorage.setItem("user", JSON.stringify({
        name: "김연구원",
        email: fullEmail,
      }));
      setIsLoading(false);
      navigate("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-accent-foreground" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Data Lens</h1>
          <p className="text-muted-foreground">대화형 AI 데이터 분석 플랫폼</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              이메일 (CU 계정)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  value={formData.emailLocal}
                  onChange={(e) => setFormData({ ...formData, emailLocal: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    errors.emailLocal ? "border-destructive" : "border-border"
                  } bg-input-background focus:outline-none focus:ring-2 focus:ring-accent`}
                  placeholder="학번 또는 아이디"
                />
              </div>
              <span className="text-foreground font-medium px-3 py-3 bg-secondary rounded-lg">
                @cu.ac.kr
              </span>
            </div>
            {errors.emailLocal && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.emailLocal}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  errors.password ? "border-destructive" : "border-border"
                } bg-input-background focus:outline-none focus:ring-2 focus:ring-accent`}
                placeholder="비밀번호를 입력하세요"
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-border" />
              <span className="text-sm text-muted-foreground">로그인 상태 유지</span>
            </label>
            <button type="button" className="text-sm text-accent hover:underline">
              비밀번호 찾기
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          아직 계정이 없으신가요?{" "}
          <Link to="/signup" className="text-accent hover:underline font-medium">
            회원가입
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
