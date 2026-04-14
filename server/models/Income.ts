import mongoose, { Schema, Document } from 'mongoose';

export interface IIncome extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category: string;
  source: string;
  type: 'one-time' | 'recurring';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: Date;
  nextDate?: Date;
  description?: string;
  tags?: string[];
  attachments?: Array<{
    filename: string;
    data: string;
    mimeType: string;
    uploadedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema = new Schema<IIncome>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'Other',
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['one-time', 'recurring'],
      required: true,
      default: 'one-time',
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    nextDate: {
      type: Date,
    },
    description: {
      type: String,
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    attachments: [{
      filename: String,
      data: String,
      mimeType: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
IncomeSchema.index({ userId: 1, date: -1 });
IncomeSchema.index({ userId: 1, type: 1 });
IncomeSchema.index({ userId: 1, category: 1 });

export default mongoose.models.Income || mongoose.model<IIncome>('Income', IncomeSchema);
