import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Zap, Shield, Bell, Smartphone } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-background dark:bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 rounded-lg flex items-center justify-center text-white font-bold">
              FinTask
            </div>
            <span className="gradient-text font-bold text-xl">FinTask</span>
          </Link>
          <div className="flex gap-4">
            <Link
              to="/login"
              className="px-6 py-2 text-foreground hover:text-primary transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-primary-500/50 dark:hover:shadow-primary-400/30 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-40 left-10 w-80 h-80 bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-violet-600/20 dark:bg-violet-600/10 rounded-full blur-3xl opacity-50"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold">
              Smart Finance &amp;{' '}
              <span className="gradient-text">Task Management</span>
            </h1>
            <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
              Manage your finances, tasks, and payments with AI-powered insights,
              Telegram bot integration, and automatic reminders
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-500/50 dark:hover:shadow-primary-400/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Start Free Trial <ArrowRight size={20} />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 glass font-semibold rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-all active:scale-95"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Feature Preview */}
          <div className="mt-20 glass-card p-8">
            <div className="h-80 bg-gradient-to-br from-primary-600/10 to-violet-600/10 dark:from-primary-600/5 dark:to-violet-600/5 rounded-lg flex items-center justify-center text-foreground/40">
              <div className="text-center">
                <div className="text-5xl mb-4">📊</div>
                <p className="font-semibold">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-foreground/60 text-lg">Everything you need to manage your finances smartly</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="w-8 h-8 text-primary" />,
                title: 'Smart Dashboard',
                description: 'Real-time overview of your expenses, payments, and tasks',
              },
              {
                icon: <Smartphone className="w-8 h-8 text-success" />,
                title: 'Telegram Bot',
                description: 'Manage everything directly from Telegram with smart commands',
              },
              {
                icon: <Bell className="w-8 h-8 text-warning" />,
                title: 'Auto Reminders',
                description: 'Never miss payments, tasks, or policy renewals',
              },
              {
                icon: <Shield className="w-8 h-8 text-destructive" />,
                title: 'Secure & Private',
                description: 'Bank-level security with JWT authentication and encryption',
              },
              {
                icon: <Zap className="w-8 h-8 text-accent" />,
                title: 'Fast & Responsive',
                description: 'Lightning-fast performance on all devices',
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-primary" />,
                title: 'Advanced Analytics',
                description: 'Detailed charts and insights into your spending patterns',
              },
            ].map((feature, index) => (
              <div key={index} className="glass-card">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-600/20 to-violet-600/20 dark:from-primary-600/20 dark:to-violet-600/20 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-foreground/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card text-center p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to transform your finances?</h2>
            <p className="text-foreground/60 mb-8 text-lg">
              Join thousands of users managing their money smarter with FinTask
            </p>
            <Link
              to="/register"
              className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-500/50 dark:hover:shadow-primary-400/30 transition-all active:scale-95"
            >
              Create Your Account Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link to="/" className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 rounded-lg flex items-center justify-center text-white font-bold">
                  FinTask
                </div>
                <span className="gradient-text font-bold">FinTask</span>
              </Link>
              <p className="text-foreground/60 text-sm">Smart Personal Finance &amp; Task Manager</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#" className="hover:text-foreground">Features</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
                <li><a href="#" className="hover:text-foreground">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-foreground/60">
            <p>&copy; 2024 FinTask. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
