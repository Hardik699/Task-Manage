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
    <div className="flex h-screen bg-background dark:bg-background">
      {/* Left side - Illustration/Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-purple-600 to-violet-600 dark:from-primary-500 dark:via-purple-500 dark:to-violet-500 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center text-white">
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30">
              <span className="text-4xl font-bold">💰</span>
            </div>
            <h1 className="text-5xl font-bold mb-4">FinTask</h1>
            <p className="text-xl text-white/80">Smart Personal Finance & Task Manager</p>
          </div>

          <div className="mt-12 space-y-4 text-left max-w-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                📊
              </div>
              <div>
                <h3 className="font-semibold mb-1">Smart Dashboard</h3>
                <p className="text-white/70 text-sm">Track your finances and tasks in one place</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                🤖
              </div>
              <div>
                <h3 className="font-semibold mb-1">Telegram Integration</h3>
                <p className="text-white/70 text-sm">Manage everything from Telegram bot</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                ⏰
              </div>
              <div>
                <h3 className="font-semibold mb-1">Auto Reminders</h3>
                <p className="text-white/70 text-sm">Never miss important payments or deadlines</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">
              FinTask
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-foreground/60">Sign in to your account to continue</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-foreground/60">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email/Username Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Username or Email</label>
              <div className="relative">
                <input
                  type="text"
                  name="emailOrUsername"
                  value={formData.emailOrUsername}
                  onChange={handleChange}
                  placeholder="Enter your username or email"
                  className="input-glass w-full pl-10"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="input-glass w-full pl-10 pr-10"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" />
                <span>Remember me</span>
              </label>
              <Link to="#" className="text-primary hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/50 dark:hover:shadow-primary-400/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background dark:bg-background text-foreground/60">Or continue with</span>
              </div>
            </div>

            {/* Social Login (placeholder) */}
            <button
              type="button"
              className="glass w-full py-2 rounded-lg font-medium transition-all duration-300 hover:bg-white/20 dark:hover:bg-white/10 active:scale-95"
            >
              Google
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-foreground/60">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-primary-700 dark:hover:text-primary-300 font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
