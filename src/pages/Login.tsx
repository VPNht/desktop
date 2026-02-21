import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@stores";
import { cn } from "@utils/helpers";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export function Login() {
  const { t } = useTranslation();
  const { login, signup, isLoading } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const activeForm = isLogin ? loginForm : signupForm;

  const onSubmit = async (data: LoginFormData | SignupFormData) => {
    try {
      if (isLogin) {
        const { email, password } = data as LoginFormData;
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        const { email, password } = data as SignupFormData;
        await signup(email, password);
        toast.success("Account created successfully!");
      }
    } catch (error) {
      toast.error(
        isLogin ? t("auth.errors.loginFailed") : t("auth.errors.signupFailed")
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t("app.name")}</h1>
          <p className="text-gray-400">{t("app.tagline")}</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            {isLogin ? t("auth.login") : t("auth.signup")}
          </h2>

          <form onSubmit={activeForm.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t("auth.email")}
              </label>
              <input
                type="email"
                {...activeForm.register("email")}
                className={cn(
                  "w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2",
                  activeForm.formState.errors.email
                    ? "border-danger-500 focus:ring-danger-500"
                    : "border-gray-700 focus:ring-primary-500 focus:border-primary-500"
                )}
                placeholder="you@example.com"
              />
              {activeForm.formState.errors.email && (
                <p className="mt-1 text-sm text-danger-500">
                  {activeForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t("auth.password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...activeForm.register("password")}
                  className={cn(
                    "w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 pr-10",
                    activeForm.formState.errors.password
                      ? "border-danger-500 focus:ring-danger-500"
                      : "border-gray-700 focus:ring-primary-500 focus:border-primary-500"
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {!isLogin && (
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters
                </p>
              )}
              {activeForm.formState.errors.password && (
                <p className="mt-1 text-sm text-danger-500">
                  {activeForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password (Signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t("auth.confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...signupForm.register("confirmPassword")}
                    className={cn(
                      "w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 pr-10",
                      signupForm.formState.errors.confirmPassword
                        ? "border-danger-500 focus:ring-danger-500"
                        : "border-gray-700 focus:ring-primary-500 focus:border-primary-500"
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {signupForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-danger-500">
                    {signupForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin ? t("auth.loggingIn") : t("auth.signingUp")}
                </>
              ) : (
                isLogin ? t("auth.login") : t("auth.signup")
              )}
            </button>
          </form>

          {/* Toggle */}
          <p className="mt-6 text-center text-sm text-gray-400">
            {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              {isLogin ? t("auth.signup") : t("auth.login")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
