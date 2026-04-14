import mongoose from 'mongoose';

interface IActivityLog {
  userId: mongoose.Types.ObjectId;
  username: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entity: 'task' | 'expense' | 'policy' | 'payment' | 'user';
  entityId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

const activityLogSchema = new mongoose.Schema<IActivityLog>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'],
      required: true,
    },
    entity: {
      type: String,
      enum: ['task', 'expense', 'policy', 'payment', 'user'],
      required: true,
    },
    entityId: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for common queries
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

export const ActivityLog = (mongoose.models.ActivityLog as mongoose.Model<IActivityLog> | undefined) ?? mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
