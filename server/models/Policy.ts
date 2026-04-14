import mongoose from 'mongoose';

interface IPaymentHistory {
  date: Date;
  amount: number;
  receiptNumber?: string;
  note?: string;
}

interface IPolicy {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'life_insurance' | 'health_insurance' | 'vehicle_insurance' | 'amc' | 'subscription' | 'mutual_fund' | 'other';
  provider: string;
  policyNumber?: string;
  startDate: Date;
  endDate: Date;
  premiumAmount: number;
  premiumFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'one-time';
  nextPaymentDate?: Date;
  totalPaidAmount: number;
  paymentHistory: IPaymentHistory[];
  sumAssured?: number;
  coverageDetails?: string;
  reminderDays: number;
  autoRenewal: boolean;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  documents: string[];
  tags: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const policySchema = new mongoose.Schema<IPolicy>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['life_insurance', 'health_insurance', 'vehicle_insurance', 'amc', 'subscription', 'mutual_fund', 'other'],
      required: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    policyNumber: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    premiumAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    premiumFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'half-yearly', 'yearly', 'one-time'],
      required: true,
    },
    nextPaymentDate: {
      type: Date,
    },
    totalPaidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentHistory: [{
      date: {
        type: Date,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      receiptNumber: String,
      note: String,
    }],
    sumAssured: {
      type: Number,
      min: 0,
    },
    coverageDetails: {
      type: String,
      trim: true,
    },
    reminderDays: {
      type: Number,
      default: 7,
    },
    autoRenewal: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'active',
    },
    documents: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for common queries
policySchema.index({ userId: 1, nextPaymentDate: 1 });
policySchema.index({ userId: 1, endDate: 1 });
policySchema.index({ userId: 1, status: 1 });

export const Policy = (mongoose.models.Policy as mongoose.Model<IPolicy> | undefined) ?? mongoose.model<IPolicy>('Policy', policySchema);
