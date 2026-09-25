import mongoose, { Document, Schema } from 'mongoose';

export type OccasionType = 'victory_day' | 'condolence' | 'campaign' | 'greetings' | 'eid';

export interface ILeaderSlot {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'circle' | 'rectangle' | 'oval';
  borderColor?: string;
}

export interface ICandidateSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  blendBottom?: boolean;
}

export interface ITextSlot {
  label: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  align?: 'left' | 'center' | 'right';
  y: number;
  defaultBangla?: string;
  backgroundColor?: string;
}

export interface ITemplateLayoutConfig {
  backgroundUrl?: string;
  backgroundColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  leaderSlots: ILeaderSlot[];
  candidateSlot: ICandidateSlot;
  textSlots: {
    headline: ITextSlot;
    candidateName: ITextSlot;
    designation: ITextSlot;
    party: ITextSlot;
    footerCredit: ITextSlot;
  };
}

export interface ITemplate extends Document {
  title: string;
  occasionType: OccasionType;
  thumbnailUrl: string;
  canvasDimensions: {
    width: number;
    height: number;
  };
  layoutConfig: ITemplateLayoutConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    title: {
      type: String,
      required: [true, 'Template title is required'],
      trim: true,
    },
    occasionType: {
      type: String,
      enum: ['victory_day', 'condolence', 'campaign', 'greetings', 'eid'],
      required: true,
      index: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    canvasDimensions: {
      width: { type: Number, default: 1200 },
      height: { type: Number, default: 1600 },
    },
    layoutConfig: {
      type: Schema.Types.Mixed,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);
