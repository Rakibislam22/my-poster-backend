import { z } from 'zod';

export const occasionTypes = [
  'victory_day',
  'condolence',
  'campaign',
  'greetings',
  'eid',
] as const;

export const leaderSlotSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  shape: z.enum(['circle', 'rectangle', 'oval']).default('circle'),
  borderColor: z.string().optional(),
});

export const candidateSlotSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  blendBottom: z.boolean().optional().default(true),
});

export const textSlotSchema = z.object({
  label: z.string(),
  fontFamily: z.string().default('Hind Siliguri'),
  fontSize: z.number(),
  color: z.string(),
  align: z.enum(['left', 'center', 'right']).optional().default('center'),
  y: z.number(),
  defaultBangla: z.string().optional(),
  backgroundColor: z.string().optional(),
});

export const layoutConfigSchema = z.object({
  backgroundUrl: z.string().optional(),
  backgroundColor: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  leaderSlots: z.array(leaderSlotSchema),
  candidateSlot: candidateSlotSchema,
  textSlots: z.object({
    headline: textSlotSchema,
    candidateName: textSlotSchema,
    designation: textSlotSchema,
    party: textSlotSchema,
    footerCredit: textSlotSchema,
  }),
});

export const createTemplateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  occasionType: z.enum(occasionTypes),
  thumbnailUrl: z.string().optional().default(''),
  canvasDimensions: z
    .object({
      width: z.number().default(1200),
      height: z.number().default(1600),
    })
    .default({ width: 1200, height: 1600 }),
  layoutConfig: layoutConfigSchema,
  isActive: z.boolean().optional().default(true),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const queryTemplateSchema = z.object({
  occasionType: z.enum(occasionTypes).optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
