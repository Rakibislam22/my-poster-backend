import { z } from 'zod';

export const createPosterSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  candidateName: z.string().min(2, 'Candidate name must be at least 2 characters long'),
  headlineBangla: z.string().optional(),
  designation: z.string().optional(),
  party: z.string().optional(),
  area: z.string().optional(),
  footerCredit: z.string().optional(),
  customNotes: z.string().optional(),
  uploadedPhotos: z
    .object({
      candidatePhoto: z.string().optional(),
      leaderPhotos: z.array(z.string()).max(3).optional().default([]),
    })
    .optional()
    .default({ leaderPhotos: [] }),
  useAiSlogans: z.boolean().optional().default(true),
});

export const regeneratePosterSchema = createPosterSchema.partial();

export type CreatePosterInput = z.infer<typeof createPosterSchema>;
export type RegeneratePosterInput = z.infer<typeof regeneratePosterSchema>;
