import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { taskAPI } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import PasswordConfirmModal from '@/components/PasswordConfirmModal';
import { Plus, Filter, Trash2, CheckCircle, AlertCircle, Edit2, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Task {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'done';
  category: string;
  completedAt?: string;
  subtasks?: Array<{
    _id?: string;
    title: string;
    completed: boolean;
    createdAt?: string;
  }>;
}

type Priority = 'low' | 'medium' | 'high' | 'critical';
type Status = 'pending' | 'in_progress' | 'done';

const priorityColors: Record<Priority, { bg: string; text: string; badge: string }> = {
  low: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-100 dark:bg-blue-900/40' },
  medium: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/40' },
  high: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/40' },
  critical: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-100 dark:bg-red-900/40' },
};

const statusColors: Record<Status, string> = {
  pending: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  in_progress: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  done: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<Status | ''>('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; taskId: string; taskName: string }>({
    isOpen: false,
    taskId: '',
    taskName: '',
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [taskTab, setTaskTab] = useState<'pending' | 'completed'>('pending');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'individual'>('individual');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as Priority,
    category: 'General',
  });

  // Load categories from localStorage
  useEffect(() => {
    const savedCategories = localStorage.getItem('task-categories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filterStatus, filterPriority, filterMonth]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;

      const response = await taskAPI.getAll(params);
      let allTasks = response.data?.tasks || [];

      // Filter by month if selected
      if (filterMonth) {
        const [year, month] = filterMonth.split('-');
        allTasks = allTasks.filter((task: Task) => {
          const taskDate = new Date(task.dueDate);
          return taskDate.getFullYear() === parseInt(year) &&
                 (taskDate.getMonth() + 1).toString().padStart(2, '0') === month;
        });
      }

      setTasks(allTasks);
    } catch (error: any) {
      if (error?.response?.status === 503) {
        console.warn('Database not connected. Set MONGODB_URI environment variable to enable database features.');
      } else {
        console.error('Error fetching tasks:', error);
      }
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (title and due date)',
        variant: 'destructive',
      });
      return;
    }
    try {
      if (editingId) {
        await taskAPI.update(editingId, formData);
        toast({
          title: 'Success',
          description: 'Task updated successfully',
        });
      } else {
        await taskAPI.create(formData);
        toast({
          title: 'Success',
          description: 'Task created successfully',
        });
      }

      // Save category to localStorage
      if (formData.category && !categories.includes(formData.category)) {
        const updatedCategories = [...categories, formData.category];
        setCategories(updatedCategories);
        localStorage.setItem('task-categories', JSON.stringify(updatedCategories));
      }

      setFormData({ title: '', description: '', dueDate: '', priority: 'medium', category: 'General' });
      setEditingId(null);
      setShowForm(false);
      fetchTasks();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} task`;
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error saving task:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await taskAPI.update(taskId, { status: 'done' });
      toast({
        title: 'Success',
        description: 'Task marked as complete',
      });
      fetchTasks();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to update task';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error updating task:', error);
    }
  };

  const openDeleteConfirm = (taskId: string, taskName: string) => {
    setDeleteConfirm({ isOpen: true, taskId, taskName });
  };

  const handleDeleteTask = async (password: string) => {
    if (!deleteConfirm.taskId) return;

    try {
      setDeletingId(deleteConfirm.taskId);
      await taskAPI.delete(deleteConfirm.taskId, { password });

      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
      setDeleteConfirm({ isOpen: false, taskId: '', taskName: '' });
      setDeletingId(null);
      fetchTasks();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to delete task';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error deleting task:', error);
      setDeletingId(null);
    }
  };

  const isOverdue = (dueDate: string, status: Status) => {
    return status !== 'done' && new Date(dueDate) < new Date();
  };

  const getSortedTasks = (tasksToSort: Task[]) => {
    return tasksToSort.sort((a, b) => {
      // High priority + pending tasks at top
      const aPriority = a.priority === 'high' && a.status === 'pending' ? 0 : 1;
      const bPriority = b.priority === 'high' && b.status === 'pending' ? 0 : 1;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Then sort by due date
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  };

  const handleEditTask = (task: Task) => {
    setSelectedTaskId(null); // Close modal if open
    setEditingId(task._id);
    setFormData({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate.split('T')[0] + 'T' + new Date(task.dueDate).toTimeString().slice(0, 5),
      priority: task.priority,
      category: task.category,
    });
    setShowForm(true);
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', dueDate: '', priority: 'medium', category: 'General' });
    setShowForm(false);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const groupedTasks = (tasksToGroup: Task[]) => {
    return tasksToGroup.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = [];
      }
      acc[task.category].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Tasks</h1>
            <p className="text-foreground/60">Manage your tasks and stay organized</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Add Task
          </button>
        </div>

        {/* Create/Edit Task Form */}
        {showForm && (
          <div className="glass-card">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Task' : 'Create New Task'}</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Task title"
                  className="input-glass w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task description (optional)"
                  className="input-glass w-full h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    className="input-glass w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Work, Personal"
                    list="task-categories"
                    className="input-glass w-full"
                  />
                  <datalist id="task-categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 glass rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700"
                >
                  {editingId ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Status | '')}
            className="input-glass px-4 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Priority | '')}
            className="input-glass px-4 py-2 text-sm"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="input-glass px-4 py-2 text-sm"
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date(new Date().getFullYear(), i, 1);
              const monthYear = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
              const monthValue = `${date.getFullYear()}-${(i + 1).toString().padStart(2, '0')}`;
              return (
                <option key={monthValue} value={monthValue}>{monthYear}</option>
              );
            })}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 items-center justify-between flex-wrap">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                viewMode === 'grouped'
                  ? 'bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white shadow-lg'
                  : 'glass hover:bg-white/10'
              }`}
            >
              <span className="text-lg">📊</span>
              Grouped by Category
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                viewMode === 'individual'
                  ? 'bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white shadow-lg'
                  : 'glass hover:bg-white/10'
              }`}
            >
              <span className="text-lg">📝</span>
              All Tasks
            </button>
          </div>

          {viewMode === 'grouped' && Object.keys(groupedTasks(getSortedTasks(tasks).filter(t => t.status !== 'done'))).length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const allCategories = Array.from(new Set(tasks.map(t => t.category)));
                  setExpandedCategories(new Set(allCategories));
                }}
                className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm font-medium hover:bg-white/10 transition-all"
              >
                <span>📂</span>
                Expand All
              </button>
              <button
                onClick={() => setExpandedCategories(new Set())}
                className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm font-medium hover:bg-white/10 transition-all"
              >
                <span>📁</span>
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* Tasks List with Tabs */}
        <Tabs value={taskTab} onValueChange={(value) => setTaskTab(value as 'pending' | 'completed')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="pending">
              Pending Tasks ({getSortedTasks(tasks).filter(t => t.status !== 'done').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed Tasks ({getSortedTasks(tasks).filter(t => t.status === 'done').length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Tasks Tab */}
          <TabsContent value="pending" className="space-y-4">
            {loading ? (
              // Skeleton Loaders
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="glass-card">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="skeleton-text w-1/3"></div>
                        <div className="skeleton-text w-2/3"></div>
                        <div className="skeleton-text w-1/4"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="skeleton w-10 h-10 rounded-lg"></div>
                        <div className="skeleton w-10 h-10 rounded-lg"></div>
                        <div className="skeleton w-10 h-10 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : getSortedTasks(tasks).filter(t => t.status !== 'done').length === 0 ? (
              <div className="glass-card text-center py-12">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-foreground/60 mb-4">No pending tasks! Great job!</p>
              </div>
            ) : viewMode === 'grouped' ? (
              // Grouped View
              Object.entries(groupedTasks(getSortedTasks(tasks).filter(t => t.status !== 'done'))).map(([category, categoryTasks]) => {
                const isExpanded = expandedCategories.has(category);
                const highPriorityCount = categoryTasks.filter(t => t.priority === 'high' || t.priority === 'critical').length;

                return (
                  <div key={category} className="glass-card overflow-hidden">
                    {/* Category Header */}
                    <div
                      onClick={() => toggleCategory(category)}
                      className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-primary/10 hover:to-violet/10 p-6 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <span className="text-2xl">{isExpanded ? '📂' : '📁'}</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">{category}</h3>
                          <div className="flex items-center gap-3 text-sm text-foreground/60">
                            <span className="flex items-center gap-1">
                              📋 {categoryTasks.length} task{categoryTasks.length > 1 ? 's' : ''}
                            </span>
                            {highPriorityCount > 0 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400">
                                🔥 {highPriorityCount} high priority
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-3xl font-bold bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent">
                            {categoryTasks.length}
                          </p>
                          <p className="text-xs text-foreground/60 uppercase tracking-wide">Tasks</p>
                        </div>
                        <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <svg className="w-6 h-6 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Tasks */}
                    {isExpanded && (
                      <div className="space-y-3 border-t border-white/10 p-4 bg-gradient-to-b from-white/5 to-transparent animate-in slide-in-from-top duration-300">
                        {categoryTasks.map((task, index) => (
                          <div
                            key={task._id}
                            className={`p-5 border-l-4 rounded-lg bg-gradient-to-r from-white/5 to-transparent hover:from-white/10 hover:to-white/5 transition-all duration-300 cursor-pointer group/task ${priorityColors[task.priority].bg}`}
                            style={{ 
                              borderLeftColor: priorityColors[task.priority].text,
                              animationDelay: `${index * 50}ms`
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1" onClick={() => setSelectedTaskId(task._id)}>
                                <div className="flex items-center gap-3 mb-3">
                                  <h3 className={`text-lg font-bold group-hover/task:text-primary transition-colors ${isOverdue(task.dueDate, task.status) ? 'text-red-600 dark:text-red-400' : ''}`}>
                                    {task.title}
                                  </h3>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[task.status]} shadow-sm`}>
                                    {task.status === 'in_progress' ? 'In Progress' : task.status}
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[task.priority].badge} shadow-sm`}>
                                    {task.priority}
                                  </span>
                                </div>

                                {task.description && (
                                  <p className="text-foreground/70 mb-3 text-sm leading-relaxed">{task.description}</p>
                                )}

                                <div className="flex flex-wrap gap-4 text-sm">
                                  <span className="flex items-center gap-1.5 text-foreground/60">
                                    <span className="text-base">⏰</span>
                                    {new Date(task.dueDate).toLocaleDateString('en-IN')} {new Date(task.dueDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {isOverdue(task.dueDate, task.status) && (
                                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 font-medium">
                                      <AlertCircle size={14} /> Overdue
                                    </span>
                                  )}
                                  {task.subtasks && task.subtasks.length > 0 && (
                                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                                      ✓ {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2 opacity-0 group-hover/task:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompleteTask(task._id);
                                  }}
                                  className="p-2.5 glass rounded-lg hover:bg-success/20 hover:text-success transition-all duration-200 hover:scale-110"
                                  title="Mark as done"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTask(task);
                                  }}
                                  className="p-2.5 glass rounded-lg hover:bg-info/20 hover:text-info transition-all duration-200 hover:scale-110"
                                  title="Edit task"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteConfirm(task._id, task.title);
                                  }}
                                  className="p-2.5 glass rounded-lg hover:bg-destructive/20 hover:text-destructive transition-all duration-200 hover:scale-110"
                                  title="Delete task"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // Individual View
              getSortedTasks(tasks).filter(t => t.status !== 'done').map((task) => (
                <div
                  key={task._id}
                  className={`glass-card p-6 border-l-4 ${priorityColors[task.priority].bg} cursor-pointer hover:bg-white/5 transition-colors`}
                  style={{ borderLeftColor: priorityColors[task.priority].text }}
                  onClick={() => setSelectedTaskId(task._id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-bold ${isOverdue(task.dueDate, task.status) ? 'text-red-600 dark:text-red-400' : ''}`}>
                          {task.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                          {task.status === 'in_progress' ? 'In Progress' : task.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority].badge}`}>
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-foreground/70 mb-3 text-sm">{task.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
                        <span>📁 {task.category}</span>
                        <span className="flex items-center gap-1">
                          ⏰ {new Date(task.dueDate).toLocaleDateString('en-IN')} {new Date(task.dueDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOverdue(task.dueDate, task.status) && (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <AlertCircle size={14} /> Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteTask(task._id);
                        }}
                        className="p-2 glass rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-success"
                        title="Mark as done"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTask(task);
                        }}
                        className="p-2 glass rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-info"
                        title="Edit task"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteConfirm(task._id, task.title);
                        }}
                        className="p-2 glass rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-destructive"
                        title="Delete task"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Completed Tasks Tab */}
          <TabsContent value="completed" className="space-y-4">
            {loading ? (
              // Skeleton Loaders
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="glass-card">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="skeleton-text w-1/3"></div>
                        <div className="skeleton-text w-2/3"></div>
                        <div className="skeleton-text w-1/4"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="skeleton w-10 h-10 rounded-lg"></div>
                        <div className="skeleton w-10 h-10 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : getSortedTasks(tasks).filter(t => t.status === 'done').length === 0 ? (
              <div className="glass-card text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-foreground/60 mb-4">No completed tasks yet. Complete a task to see it here!</p>
              </div>
            ) : (
              getSortedTasks(tasks).filter(t => t.status === 'done').map((task) => (
                <div
                  key={task._id}
                  className={`glass-card p-6 border-l-4 ${priorityColors[task.priority].bg} cursor-pointer hover:bg-white/5 transition-colors`}
                  style={{ borderLeftColor: priorityColors[task.priority].text }}
                  onClick={() => setSelectedTaskId(task._id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-bold ${isOverdue(task.dueDate, task.status) ? 'text-red-600 dark:text-red-400' : ''}`}>
                          {task.title}
                        </h3>
                        {task.status === 'done' && task.completedAt ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[task.status]} cursor-help`}>
                                  {task.status === 'in_progress' ? 'In Progress' : task.status}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <p className="font-semibold">Completed on:</p>
                                  <p>{new Date(task.completedAt).toLocaleDateString('en-IN', { 
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}</p>
                                  <p>{new Date(task.completedAt).toLocaleTimeString('en-IN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                            {task.status === 'in_progress' ? 'In Progress' : task.status}
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority].badge}`}>
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-foreground/70 mb-3 text-sm">{task.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
                        <span>📁 {task.category}</span>
                        <span className="flex items-center gap-1">
                          ⏰ {new Date(task.dueDate).toLocaleDateString('en-IN')} {new Date(task.dueDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOverdue(task.dueDate, task.status) && (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <AlertCircle size={14} /> Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="p-2 glass rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-info"
                        title="Edit task"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(task._id, task.title)}
                        className="p-2 glass rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-destructive"
                        title="Delete task"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Password Confirmation Modal */}
        <PasswordConfirmModal
          isOpen={deleteConfirm.isOpen}
          onConfirm={handleDeleteTask}
          onCancel={() => setDeleteConfirm({ isOpen: false, taskId: '', taskName: '' })}
          isLoading={deletingId === deleteConfirm.taskId}
          itemName={`task "${deleteConfirm.taskName}"`}
        />

        {/* Task Detail Modal with Subtasks */}
        {selectedTaskId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="glass-card max-w-2xl w-full p-8 my-8">
              {(() => {
                const task = tasks.find(t => t._id === selectedTaskId);
                if (!task) return null;

                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <h1 className="text-3xl font-bold">{task.title}</h1>
                        <p className="text-foreground/60 mt-1">{task.category}</p>
                      </div>
                      <button
                        onClick={() => setSelectedTaskId(null)}
                        className="p-2 hover:bg-white/10 rounded-lg"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    {/* Task Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-1">Status</p>
                        <p className="font-semibold capitalize">{task.status === 'in_progress' ? 'In Progress' : task.status}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-1">Priority</p>
                        <p className="font-semibold capitalize">{task.priority}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-1">Due Date</p>
                        <p className="font-semibold">{new Date(task.dueDate).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-1">Time</p>
                        <p className="font-semibold">{new Date(task.dueDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>

                    {/* Description */}
                    {task.description && (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-2">Description</p>
                        <p className="text-foreground">{task.description}</p>
                      </div>
                    )}

                    {/* Subtasks Section */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">Subtasks (Checklist)</h2>
                      
                      {/* Add Subtask */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={subtaskInput}
                          onChange={(e) => setSubtaskInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && subtaskInput.trim()) {
                              taskAPI.addSubtask(selectedTaskId, { title: subtaskInput })
                                .then(() => {
                                  setSubtaskInput('');
                                  fetchTasks();
                                  toast({ title: 'Success', description: 'Subtask added' });
                                })
                                .catch((error) => {
                                  toast({ title: 'Error', description: error?.response?.data?.error || 'Failed to add subtask', variant: 'destructive' });
                                });
                            }
                          }}
                          placeholder="Add a subtask... (Press Enter)"
                          className="input-glass flex-1"
                        />
                        <button
                          onClick={() => {
                            if (subtaskInput.trim()) {
                              taskAPI.addSubtask(selectedTaskId, { title: subtaskInput })
                                .then(() => {
                                  setSubtaskInput('');
                                  fetchTasks();
                                  toast({ title: 'Success', description: 'Subtask added' });
                                })
                                .catch((error) => {
                                  toast({ title: 'Error', description: error?.response?.data?.error || 'Failed to add subtask', variant: 'destructive' });
                                });
                            }
                          }}
                          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700"
                        >
                          Add
                        </button>
                      </div>

                      {/* Subtasks List */}
                      {task.subtasks && task.subtasks.length > 0 ? (
                        <div className="space-y-2">
                          {task.subtasks.map((subtask, idx) => (
                            <div key={subtask._id || idx} className="p-3 bg-white/5 rounded border border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`flex-1 ${subtask.completed ? 'line-through text-foreground/50' : ''}`}>
                                  {subtask.title}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      taskAPI.updateSubtask(selectedTaskId, subtask._id || '', { completed: !subtask.completed })
                                        .then(() => {
                                          fetchTasks();
                                          toast({
                                            title: 'Success',
                                            description: subtask.completed ? 'Subtask marked as pending' : 'Subtask marked as done',
                                          });
                                        })
                                        .catch((error) => {
                                          toast({ title: 'Error', description: error?.response?.data?.error || 'Failed to update subtask', variant: 'destructive' });
                                        });
                                    }}
                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                      subtask.completed
                                        ? 'bg-success/20 text-success hover:bg-success/30'
                                        : 'bg-white/10 text-foreground/60 hover:bg-white/20'
                                    }`}
                                  >
                                    {subtask.completed ? '✓ Done' : 'Mark Done'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      taskAPI.deleteSubtask(selectedTaskId, subtask._id || '')
                                        .then(() => {
                                          fetchTasks();
                                          toast({ title: 'Success', description: 'Subtask deleted' });
                                        })
                                        .catch((error) => {
                                          toast({ title: 'Error', description: error?.response?.data?.error || 'Failed to delete subtask', variant: 'destructive' });
                                        });
                                    }}
                                    className="p-1 hover:bg-white/10 rounded text-destructive"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              {subtask.completedAt && (
                                <p className="text-xs text-foreground/50">
                                  ✓ Completed: {new Date(subtask.completedAt).toLocaleDateString('en-IN')} {new Date(subtask.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-foreground/60 text-center py-4">No subtasks yet. Add one to get started!</p>
                      )}
                    </div>

                    {/* Close Button */}
                    <div className="flex justify-end border-t border-white/10 pt-4">
                      <button
                        onClick={() => setSelectedTaskId(null)}
                        className="px-4 py-2 glass rounded-lg font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
