import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { authAPI } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { useTheme } from '@/context/ThemeContext';
import { User, Moon, Sun, Bell, Key, Trash2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    taskReminders: true,
    paymentReminders: true,
    goalUpdates: true,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getCurrentUser();
      const userData = response.data?.user;
      setUser(userData);
      setProfileData({
        name: userData?.name || '',
        email: userData?.email || '',
      });
    } catch (error: any) {
      if (error?.response?.status !== 503) {
        console.error('Error fetching user:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Info',
      description: 'Profile update feature coming soon',
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Info',
      description: 'Password change feature coming soon',
    });

    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast({
      title: 'Success',
      description: 'Notification preference updated',
    });
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem('accessToken');
      toast({
        title: 'Success',
        description: 'Logged out successfully',
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('accessToken');
      navigate('/login');
    }
  };

  const handleDeleteAccount = async () => {
    if (deletePassword !== '123') {
      toast({
        title: 'Error',
        description: 'Invalid password',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Info',
      description: 'Account deletion feature coming soon',
    });
    setShowDeleteConfirm(false);
    setDeletePassword('');
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">⚙️ Settings</h1>
          <p className="text-foreground/60">Manage your profile and preferences</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-foreground/60">Loading settings...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Profile Section */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="text-primary" size={24} />
                <h2 className="text-2xl font-bold">Profile Information</h2>
              </div>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="input-glass w-full"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="input-glass w-full"
                    placeholder="your.email@example.com"
                    disabled
                  />
                  <p className="text-xs text-foreground/60 mt-1">Email cannot be changed</p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700"
                  >
                    Update Profile
                  </button>
                </div>
              </form>
            </div>

            {/* Appearance Section */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                {theme === 'dark' ? (
                  <Moon className="text-primary" size={24} />
                ) : (
                  <Sun className="text-primary" size={24} />
                )}
                <h2 className="text-2xl font-bold">Appearance</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-foreground/60">Choose your preferred theme</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-4 py-2 glass rounded-lg font-medium hover:bg-white/10 transition-all"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun size={20} />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon size={20} />
                      Dark Mode
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="text-primary" size={24} />
                <h2 className="text-2xl font-bold">Notifications</h2>
              </div>
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {key === 'emailNotifications' && 'Email Notifications'}
                        {key === 'taskReminders' && 'Task Reminders'}
                        {key === 'paymentReminders' && 'Payment Reminders'}
                        {key === 'goalUpdates' && 'Goal Updates'}
                      </p>
                      <p className="text-sm text-foreground/60">
                        {key === 'emailNotifications' && 'Receive email notifications'}
                        {key === 'taskReminders' && 'Get reminded about pending tasks'}
                        {key === 'paymentReminders' && 'Get reminded about due payments'}
                        {key === 'goalUpdates' && 'Get updates on your savings goals'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle(key as keyof typeof notifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-primary' : 'bg-white/20'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Password Section */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Key className="text-primary" size={24} />
                <h2 className="text-2xl font-bold">Change Password</h2>
              </div>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="input-glass w-full"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="input-glass w-full"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="input-glass w-full"
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="glass-card p-6 border-2 border-destructive/50">
              <div className="flex items-center gap-3 mb-6">
                <Trash2 className="text-destructive" size={24} />
                <h2 className="text-2xl font-bold text-destructive">Danger Zone</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
                  <div>
                    <p className="font-medium">Logout</p>
                    <p className="text-sm text-foreground/60">Sign out from your account</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-warning text-white rounded-lg font-medium hover:bg-warning/80"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-foreground/60">Permanently delete your account and all data</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-destructive text-white rounded-lg font-medium hover:bg-destructive/80"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4 text-destructive">⚠️ Delete Account</h2>
              <p className="text-foreground/80 mb-4">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Enter password to confirm (123)</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="input-glass w-full"
                  placeholder="Enter password"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                  className="px-4 py-2 glass rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-destructive text-white rounded-lg font-medium hover:bg-destructive/80"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
