import mongoose from 'mongoose';

interface ITask {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  status: 'pending' | 'in_progress' | 'done';
  completedAt?: Date;
  reminderSentAt?: Date;
  source: 'website' | 'telegram';
  subtasks?: Array<{
    _id?: string;
    title: string;
    completed: boolean;
    createdAt?: Date;
    completedAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new mongoose.Schema<ITask>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    category: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'done'],
      default: 'pending',
    },
    completedAt: {
      type: Date,
    },
    reminderSentAt: {
      type: Date,
    },
    source: {
      type: String,
      enum: ['website', 'telegram'],
      default: 'website',
    },
    subtasks: [{
      _id: mongoose.Schema.Types.ObjectId,
      title: String,
      completed: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      completedAt: {
        type: Date,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index for common queries
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });

export const Task = (mongoose.models.Task as mongoose.Model<ITask> | undefined) ?? mongoose.model<ITask>('Task', taskSchema);
