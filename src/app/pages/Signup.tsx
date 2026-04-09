import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Lock, User, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    emailLocal: "", // @cu.ac.kr 앞부분만
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력해주세요.";
    }

    if (!formData.emailLocal.trim()) {
      newErrors.emailLocal = "이메일을 입력해주세요.";
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.emailLocal)) {
      newErrors.emailLocal = "유효한 이메일 형식이 아닙니다.";
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    } else if (formData.password.length < 8) {
      newErrors.password = "비밀번호는 최소 8자 이상이어야 합니다.";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    // Mock signup
    setTimeout(() => {
      const fullEmail = `${formData.emailLocal}@cu.ac.kr`;
      localStorage.setItem("user", JSON.stringify({
        name: formData.name,
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              이름
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  errors.name ? "border-destructive" : "border-border"
                } bg-input-background focus:outline-none focus:ring-2 focus:ring-accent`}
                placeholder="홍길동"
              />
            </div>
            {errors.name && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.name}
              </p>
            )}
          </div>

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
                placeholder="최소 8자 이상"
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              비밀번호 확인
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  errors.confirmPassword ? "border-destructive" : "border-border"
                } bg-input-background focus:outline-none focus:ring-2 focus:ring-accent`}
                placeholder="비밀번호를 다시 입력하세요"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="text-accent hover:underline font-medium">
            로그인
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
