import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGenerationLog extends Document {
  posterId: Types.ObjectId;
  userId?: Types.ObjectId;
  promptUsed?: string;
  tokensUsed?: number;
  latencyMs?: number;
  geminiModel?: string;
  success: boolean;
  errorDetails?: string;
  createdAt: Date;
}

const GenerationLogSchema = new Schema<IGenerationLog>(
  {
    posterId: {
      type: Schema.Types.ObjectId,
      ref: 'Poster',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    promptUsed: {
      type: String,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    geminiModel: {
      type: String,
      default: 'gemini-1.5-flash',
    },
    success: {
      type: Boolean,
      required: true,
    },
    errorDetails: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const GenerationLog = mongoose.model<IGenerationLog>('GenerationLog', GenerationLogSchema);
