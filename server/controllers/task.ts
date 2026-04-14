import { Response } from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../middleware/activityLogger';

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { title, description, dueDate, priority, category } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Title and due date are required' });
    }

    const task = await Task.create({
      userId: req.userId,
      title,
      description: description || '',
      dueDate: new Date(dueDate),
      priority: priority || 'medium',
      category: category || 'General',
      status: 'pending',
      source: 'website',
    });

    await logActivity(req, {
      action: 'CREATE',
      entity: 'task',
      entityId: task._id.toString(),
      details: { title },
    });

    return res.status(201).json({ message: 'Task created', task });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { status, priority, category, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { userId: req.userId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const tasks = await Task.find(filter)
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Task.countDocuments(filter);

    return res.json({
      tasks,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findOne({ _id: id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // If status is being changed to 'done', set completedAt
    if (updates.status === 'done' && task.status !== 'done') {
      updates.completedAt = new Date();
    }

    // If status is being changed away from 'done', clear completedAt
    if (updates.status && updates.status !== 'done' && task.status === 'done') {
      updates.completedAt = null;
    }

    Object.assign(task, updates);
    await task.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'task',
      entityId: id,
      details: updates,
    });

    return res.json({ message: 'Task updated', task });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { password } = req.body;

    if (!password || password !== '123') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const task = await Task.findOneAndDelete({ _id: id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await logActivity(req, {
      action: 'DELETE',
      entity: 'task',
      entityId: id,
    });

    return res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
};


export const addSubtask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Subtask title is required' });
    }

    const task = await Task.findOne({ _id: id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.subtasks) {
      task.subtasks = [];
    }

    task.subtasks.push({
      _id: new mongoose.Types.ObjectId(),
      title,
      completed: false,
      createdAt: new Date(),
    });

    await task.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'task',
      entityId: id,
      details: { subtaskAdded: title },
    });

    return res.json({ message: 'Subtask added', task });
  } catch (error) {
    console.error('Add subtask error:', error);
    return res.status(500).json({ error: 'Failed to add subtask' });
  }
};

export const updateSubtask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id, subtaskId } = req.params;
    const { title, completed } = req.body;

    const task = await Task.findOne({ _id: id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const subtask = task.subtasks?.find((st) => st._id?.toString() === subtaskId);

    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    if (title) subtask.title = title;
    if (completed !== undefined) {
      subtask.completed = completed;
      // Set completedAt when marking as done
      if (completed) {
        subtask.completedAt = new Date();
      } else {
        // Clear completedAt when marking as pending
        subtask.completedAt = undefined;
      }
    }

    await task.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'task',
      entityId: id,
      details: { subtaskUpdated: subtaskId },
    });

    return res.json({ message: 'Subtask updated', task });
  } catch (error) {
    console.error('Update subtask error:', error);
    return res.status(500).json({ error: 'Failed to update subtask' });
  }
};

export const deleteSubtask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id, subtaskId } = req.params;

    const task = await Task.findOne({ _id: id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.subtasks) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    task.subtasks = task.subtasks.filter((st) => st._id?.toString() !== subtaskId);

    await task.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'task',
      entityId: id,
      details: { subtaskDeleted: subtaskId },
    });

    return res.json({ message: 'Subtask deleted', task });
  } catch (error) {
    console.error('Delete subtask error:', error);
    return res.status(500).json({ error: 'Failed to delete subtask' });
  }
};
