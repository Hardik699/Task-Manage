import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.login({
        emailOrUsername: formData.emailOrUsername,
        password: formData.password,
      });

      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('userId', response.data.user._id);
        toast.success('Login successful!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      toast.error(errorMessage);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Mobile-First Layout */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left side - Enhanced Illustration/Branding - Hidden on mobile */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-purple-500 to-pink-500 items-center justify-center p-8 xl:p-12 relative overflow-hidden">
          {/* Enhanced Decorative elements */}
          <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

          <div className="relative z-10 text-center text-white animate-fade-in">
            <div className="mb-8">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-white/30 hover-scale shadow-2xl">
                <span className="text-4xl font-bold">💰</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold mb-4 text-white">FinTask</h1>
              <p className="text-lg xl:text-xl text-white/90 font-medium">Smart Personal Finance & Task Manager</p>
            </div>

            <div className="mt-12 space-y-6 text-left max-w-sm">
              <div className="flex items-start gap-4 hover-scale">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-1 backdrop-blur-sm border border-white/20">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Smart Dashboard</h3>
                  <p className="text-white/80 text-sm leading-relaxed">Track your finances and tasks in one unified, intelligent interface</p>
                </div>
              </div>
              <div className="flex items-start gap-4 hover-scale">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-1 backdrop-blur-sm border border-white/20">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Telegram Integration</h3>
                  <p className="text-white/80 text-sm leading-relaxed">Manage everything seamlessly from your Telegram bot</p>
                </div>
              </div>
              <div className="flex items-start gap-4 hover-scale">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-1 backdrop-blur-sm border border-white/20">
                  <span className="text-xl">⏰</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Auto Reminders</h3>
                  <p className="text-white/80 text-sm leading-relaxed">Never miss important payments or deadlines again</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Enhanced Login Form with Mobile Optimization */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-screen lg:min-h-0">
          <div className="w-full max-w-sm sm:max-w-md animate-slide-up">
            {/* Mobile Header - Always visible on mobile */}
            <div className="mb-6 sm:mb-8 text-center">
              {/* Mobile Logo */}
              <div className="lg:hidden w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl mb-4 sm:mb-6 mx-auto shadow-lg shadow-primary/30 hover-scale">
                <span>💰</span>
              </div>
              
              {/* Responsive Headers */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gradient-primary">
                Welcome Back
              </h1>
              <p className="text-foreground/60 text-sm sm:text-base lg:text-lg">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Email/Username Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Username or Email</label>
                <div className="relative">
                  <input
                    type="text"
                    name="emailOrUsername"
                    value={formData.emailOrUsername}
                    onChange={handleChange}
                    placeholder="Enter your username or email"
                    className="input w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-background/60 backdrop-blur-sm border-border/50 focus:border-primary/50 hover:border-primary/30 transition-all rounded-xl text-sm sm:text-base"
                    required
                  />
                  <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-foreground/40 transition-colors" size={16} />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="input w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-background/60 backdrop-blur-sm border-border/50 focus:border-primary/50 hover:border-primary/30 transition-all rounded-xl text-sm sm:text-base"
                    required
                  />
                  <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-foreground/40 transition-colors" size={16} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors hover-scale p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 text-sm">
                <label className="flex items-center gap-2 cursor-pointer hover-scale">
                  <input type="checkbox" className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary/20" />
                  <span className="text-foreground/70">Remember me</span>
                </label>
                <Link to="#" className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline text-center sm:text-left">
                  Forgot password?
                </Link>
              </div>

              {/* Login Button - Mobile Optimized */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-gradient py-3 sm:py-3.5 px-6 font-semibold text-base sm:text-lg rounded-xl hover-scale disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[48px] sm:min-h-[52px]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Divider - Mobile Optimized */}
              <div className="relative my-6 sm:my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 sm:px-4 bg-background text-foreground/60 font-medium">Or continue with</span>
                </div>
              </div>

              {/* Social Login - Mobile Optimized */}
              <button
                type="button"
                className="w-full glass-premium py-3 sm:py-3.5 px-6 rounded-xl font-medium transition-all hover-scale border border-border/30 min-h-[48px] sm:min-h-[52px]"
              >
                <span className="flex items-center justify-center gap-3">
                  <span className="text-lg sm:text-xl">🔍</span>
                  <span className="text-sm sm:text-base">Continue with Google</span>
                </span>
              </button>
            </form>

            {/* Sign Up Link - Mobile Optimized */}
            <p className="mt-6 sm:mt-8 text-center text-foreground/60 text-sm sm:text-base">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
