import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { adminAPI } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { Users, Activity, TrendingUp, Database, Search, Trash2, Eye, Calendar, Filter } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
}

interface ActivityLog {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalExpenses: number;
  totalPayments: number;
  totalTasks: number;
  totalGoals: number;
  recentActivity: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userLogs, setUserLogs] = useState<ActivityLog[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, logsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers({}),
        adminAPI.getLogs({ limit: 50 }),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data?.users || []);
      setLogs(logsRes.data?.logs || []);
    } catch (error: any) {
      if (error?.response?.status === 503) {
        console.warn('Database not connected');
      } else if (error?.response?.status === 403) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges',
          variant: 'destructive',
        });
      } else {
        console.error('Error fetching admin data:', error);
      }
      setStats(null);
      setUsers([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (user: User) => {
    try {
      setSelectedUser(user);
      setShowUserModal(true);
      const response = await adminAPI.getUserLogs(user._id, { limit: 20 });
      setUserLogs(response.data?.logs || []);
    } catch (error) {
      console.error('Error fetching user logs:', error);
      setUserLogs([]);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = logs.filter((log) => {
    if (filterAction && log.action !== filterAction) return false;
    if (filterEntity && log.entity !== filterEntity) return false;
    return true;
  });

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));
  const uniqueEntities = Array.from(new Set(logs.map((log) => log.entity)));

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'text-success';
      case 'UPDATE':
        return 'text-info';
      case 'DELETE':
        return 'text-destructive';
      case 'LOGIN':
        return 'text-primary';
      default:
        return 'text-foreground';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return '➕';
      case 'UPDATE':
        return '✏️';
      case 'DELETE':
        return '🗑️';
      case 'LOGIN':
        return '🔐';
      default:
        return '📝';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">👑 Admin Dashboard</h1>
          <p className="text-foreground/60">Manage users, view activity logs, and monitor system</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-foreground/60">Loading admin data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2">
              {(['overview', 'users', 'logs'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                    activeTab === tab
                      ? 'bg-primary text-white'
                      : 'glass hover:bg-white/10'
                  }`}
                >
                  {tab === 'overview' && '📊 '}
                  {tab === 'users' && '👥 '}
                  {tab === 'logs' && '📋 '}
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-foreground/60 text-sm font-medium">Total Users</p>
                      <Users className="text-primary" size={20} />
                    </div>
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  </div>

                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-foreground/60 text-sm font-medium">Total Expenses</p>
                      <TrendingUp className="text-destructive" size={20} />
                    </div>
                    <p className="text-3xl font-bold">{stats.totalExpenses}</p>
                  </div>

                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-foreground/60 text-sm font-medium">Total Payments</p>
                      <Database className="text-info" size={20} />
                    </div>
                    <p className="text-3xl font-bold">{stats.totalPayments}</p>
                  </div>

                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-foreground/60 text-sm font-medium">Total Tasks</p>
                      <Activity className="text-warning" size={20} />
                    </div>
                    <p className="text-3xl font-bold">{stats.totalTasks}</p>
                  </div>

                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-foreground/60 text-sm font-medium">Total Goals</p>
                      <TrendingUp className="text-success" size={20} />
                    </div>
                    <p className="text-3xl font-bold">{stats.totalGoals}</p>
                  </div>

                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-foreground/60 text-sm font-medium">Recent Activity</p>
                      <Activity className="text-primary" size={20} />
                    </div>
                    <p className="text-3xl font-bold">{stats.recentActivity}</p>
                  </div>
                </div>

                {/* Recent Users */}
                <div className="glass-card p-6">
                  <h2 className="text-2xl font-bold mb-4">Recent Users</h2>
                  <div className="space-y-2">
                    {users.slice(0, 5).map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-sm text-foreground/60">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-primary/20 text-primary'
                              : 'bg-info/20 text-info'
                          }`}>
                            {user.role}
                          </span>
                          <p className="text-xs text-foreground/60 mt-1">
                            Joined {new Date(user.createdAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="glass-card p-6">
                  <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
                  <div className="space-y-2">
                    {logs.slice(0, 10).map((log) => (
                      <div key={log._id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                        <span className="text-2xl">{getActionIcon(log.action)}</span>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold">{log.userId?.name || 'Unknown'}</span>
                            {' '}
                            <span className={`font-medium ${getActionColor(log.action)}`}>
                              {log.action.toLowerCase()}
                            </span>
                            {' '}
                            <span className="text-foreground/60">{log.entity}</span>
                          </p>
                          <p className="text-xs text-foreground/60 mt-1">
                            {new Date(log.createdAt).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Search */}
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2">
                    <Search className="text-foreground/60" size={20} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="input-glass flex-1"
                    />
                  </div>
                </div>

                {/* Users List */}
                <div className="space-y-3">
                  {filteredUsers.length === 0 ? (
                    <div className="glass-card text-center py-12">
                      <p className="text-foreground/60">No users found</p>
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div key={user._id} className="glass-card p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold">{user.name}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                user.role === 'admin'
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-info/20 text-info'
                              }`}>
                                {user.role}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/60 mb-2">📧 {user.email}</p>
                            <div className="flex gap-4 text-xs text-foreground/60">
                              <span>📅 Joined: {new Date(user.createdAt).toLocaleDateString('en-IN')}</span>
                              {user.lastLogin && (
                                <span>🔐 Last login: {new Date(user.lastLogin).toLocaleDateString('en-IN')}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="p-2 glass rounded-lg hover:bg-white/10 text-info"
                              title="View user details"
                            >
                              <Eye size={20} />
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(user._id, user.name)}
                                className="p-2 glass rounded-lg hover:bg-white/10 text-destructive"
                                title="Delete user"
                              >
                                <Trash2 size={20} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="glass-card p-4">
                  <div className="flex items-center gap-4">
                    <Filter className="text-foreground/60" size={20} />
                    <select
                      value={filterAction}
                      onChange={(e) => setFilterAction(e.target.value)}
                      className="input-glass px-4 py-2"
                    >
                      <option value="">All Actions</option>
                      {uniqueActions.map((action) => (
                        <option key={action} value={action}>{action}</option>
                      ))}
                    </select>
                    <select
                      value={filterEntity}
                      onChange={(e) => setFilterEntity(e.target.value)}
                      className="input-glass px-4 py-2"
                    >
                      <option value="">All Entities</option>
                      {uniqueEntities.map((entity) => (
                        <option key={entity} value={entity}>{entity}</option>
                      ))}
                    </select>
                    {(filterAction || filterEntity) && (
                      <button
                        onClick={() => {
                          setFilterAction('');
                          setFilterEntity('');
                        }}
                        className="px-4 py-2 glass rounded-lg text-sm hover:bg-white/10"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Activity Logs */}
                <div className="space-y-2">
                  {filteredLogs.length === 0 ? (
                    <div className="glass-card text-center py-12">
                      <p className="text-foreground/60">No activity logs found</p>
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div key={log._id} className="glass-card p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{getActionIcon(log.action)}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{log.userId?.name || 'Unknown User'}</span>
                              <span className={`font-medium ${getActionColor(log.action)}`}>
                                {log.action}
                              </span>
                              <span className="text-foreground/60">{log.entity}</span>
                              {log.entityId && (
                                <span className="text-xs text-foreground/60 font-mono">#{log.entityId.slice(-6)}</span>
                              )}
                            </div>
                            <p className="text-sm text-foreground/60 mb-2">{log.userId?.email}</p>
                            {log.details && (
                              <div className="text-xs bg-white/5 p-2 rounded mt-2 font-mono">
                                {JSON.stringify(log.details, null, 2)}
                              </div>
                            )}
                            <div className="flex gap-4 text-xs text-foreground/60 mt-2">
                              <span>🕐 {new Date(log.createdAt).toLocaleString('en-IN')}</span>
                              {log.ipAddress && <span>🌐 {log.ipAddress}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* User Detail Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="glass-card max-w-3xl w-full p-8 my-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">User Details</h2>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                    setUserLogs([]);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* User Info */}
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-foreground/60 mb-1">Name</p>
                  <p className="font-semibold">{selectedUser.name}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-foreground/60 mb-1">Email</p>
                  <p className="font-semibold">{selectedUser.email}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-foreground/60 mb-1">Role</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedUser.role === 'admin'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-info/20 text-info'
                  }`}>
                    {selectedUser.role}
                  </span>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-foreground/60 mb-1">Joined</p>
                  <p className="font-semibold">{new Date(selectedUser.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* User Activity */}
              <div>
                <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {userLogs.length === 0 ? (
                    <p className="text-center text-foreground/60 py-8">No activity found</p>
                  ) : (
                    userLogs.map((log) => (
                      <div key={log._id} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{getActionIcon(log.action)}</span>
                          <span className={`font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="text-foreground/60">{log.entity}</span>
                        </div>
                        <p className="text-xs text-foreground/60">
                          {new Date(log.createdAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
