import mongoose, { Document, Schema, Types } from 'mongoose';

export type PosterStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface IPosterFormData {
  occasionType?: string;
  headlineBangla: string;
  candidateName: string;
  designation?: string;
  party?: string;
  area?: string;
  footerCredit?: string;
  customNotes?: string;
}

export interface IPosterUploadedPhotos {
  leaderPhotos: string[];
  candidatePhoto?: string;
}

export interface IPoster extends Document {
  userId: Types.ObjectId;
  templateId: Types.ObjectId;
  formData: IPosterFormData;
  uploadedPhotos: IPosterUploadedPhotos;
  generatedImageUrl?: string;
  previewUrl?: string;
  status: PosterStatus;
  moderationStatus: ModerationStatus;
  moderationNotes?: string;
  flaggedReason?: string;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  regenerationCount: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PosterSchema = new Schema<IPoster>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template',
      required: true,
      index: true,
    },
    formData: {
      headlineBangla: { type: String, required: true, trim: true },
      candidateName: { type: String, required: true, trim: true },
      designation: { type: String, trim: true },
      party: { type: String, trim: true },
      area: { type: String, trim: true },
      footerCredit: { type: String, trim: true, default: 'প্রচারে: এলাকাবাসী ও সুধীবৃন্দ' },
      customNotes: { type: String, trim: true },
    },
    uploadedPhotos: {
      leaderPhotos: [{ type: String }],
      candidatePhoto: { type: String },
    },
    generatedImageUrl: {
      type: String,
    },
    previewUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
      index: true,
    },
    moderationNotes: {
      type: String,
      trim: true,
    },
    flaggedReason: {
      type: String,
      trim: true,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: {
      type: Date,
    },
    regenerationCount: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Poster = mongoose.model<IPoster>('Poster', PosterSchema);
