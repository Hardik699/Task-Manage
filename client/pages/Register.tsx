import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters long');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.register({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('userId', response.data.user._id);
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      console.error('Registration error:', error);
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

      {/* Right side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">
              FinTask
            </div>
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-foreground/60">Join us to manage your finances smartly</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-foreground/60">Join us to manage your finances smartly</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="input-glass w-full pl-10"
                  required
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  className="input-glass w-full pl-10"
                  required
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              </div>
              <p className={`text-xs mt-2 ${formData.username.length >= 3 ? 'text-success' : 'text-foreground/50'}`}>
                {formData.username.length >= 3 ? '✓ Username valid' : `At least 3 characters (${formData.username.length}/3)`}
              </p>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
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
                  placeholder="Create a strong password"
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
              <p className={`text-xs mt-2 ${formData.password.length >= 8 ? 'text-success' : 'text-foreground/50'}`}>
                {formData.password.length >= 8 ? '✓ Password strength: Good' : `At least 8 characters (${formData.password.length}/8)`}
              </p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="input-glass w-full pl-10 pr-10"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="w-4 h-4 rounded"
                required
              />
              <span className="text-sm text-foreground/60">
                I agree to the{' '}
                <Link to="#" className="text-primary hover:text-primary-700 dark:hover:text-primary-300">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="#" className="text-primary hover:text-primary-700 dark:hover:text-primary-300">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/50 dark:hover:shadow-primary-400/30 active:scale-95 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-8 text-center text-foreground/60">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-700 dark:hover:text-primary-300 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
