import { z } from 'zod';

// Auth
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name required').max(50),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Token required'),
});

// Groups
export const CreateGroupSchema = z.object({
  name: z.string().min(1, 'Group name required').max(60),
});

export const JoinGroupSchema = z.object({
  makanCode: z.string().min(4, 'Makan Code too short').max(10),
});

export const UpdateGroupSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  noRepeatDays: z.number().int().min(0).max(30).optional(),
  maxReroll: z.number().int().min(0).max(10).optional(),
  decisionModeDefault: z.enum(['you_pick', 'we_fight']).optional(),
});

export const TransferAdminSchema = z.object({
  newAdminUserId: z.string().uuid('Invalid user ID'),
});

// Restaurants
export const CreateRestaurantSchema = z.object({
  groupId: z.string().uuid(),
  name: z.string().min(1, 'Restaurant name required').max(100),
  cuisineTags: z.array(z.string()).default([]),
  vibeTags: z.array(z.string()).default([]),
  priceMin: z.number().int().min(1).max(500),
  priceMax: z.number().int().min(1).max(500),
  halal: z.boolean().default(false),
  vegOptions: z.boolean().default(false),
  walkMinutes: z.number().int().min(1).max(60),
  mapsUrl: z.string().url().nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

// Decisions
export const DecisionFiltersSchema = z.object({
  // Web/mobile send '' when no tier is selected; treat as unset.
  budgetFilter: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.enum(['kering', 'ok', 'belanja']).optional()
  ),
  selectedTags: z.array(z.string()).optional(),
  walkTimeMax: z.number().optional(),
  halal: z.boolean().optional(),
  vegOptions: z.boolean().optional(),
  favoritesOnly: z.boolean().optional(),
  maxDistanceKm: z.number().min(0.1).max(50).optional(),
  userLat: z.number().min(-90).max(90).optional(),
  userLng: z.number().min(-180).max(180).optional(),
});

export const DecideSchema = z.object({
  groupId: z.string().uuid(),
  filters: DecisionFiltersSchema.optional(),
  excludeIds: z.array(z.string().uuid()).optional(),
});

export const ConfirmDecisionSchema = z.object({
  decisionId: z.string().uuid(),
});

// Votes
export const StartVoteSchema = z.object({
  groupId: z.string().uuid(),
  filters: DecisionFiltersSchema.optional(),
});

export const CastVoteSchema = z.object({
  optionId: z.string().uuid(),
  vote: z.enum(['yes', 'no']),
});

// Favorites
export const FavoriteSchema = z.object({
  restaurantId: z.string().uuid(),
});

// Ratings
export const RatingSchema = z.object({
  restaurantId: z.string().uuid(),
  decisionId: z.string().uuid().nullable().optional(),
  thumbs: z.enum(['up', 'down']),
});

// Comments
export const CommentSchema = z.object({
  decisionId: z.string().uuid(),
  body: z.string().min(1, 'Comment cannot be empty').max(500),
});

// Preferences
export const PreferencesSchema = z.object({
  halal: z.boolean().optional(),
  vegOptions: z.boolean().optional(),
  defaultBudget: z.number().int().min(5).max(500).optional(),
});

export const ReminderSchema = z.object({
  enabled: z.boolean(),
  reminderTimeLocal: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm format'),
  timezone: z.string().min(1).max(100),
  weekdaysOnly: z.boolean().default(true),
});

// Helper: parse and return validation error response
export function zodError(error: z.ZodError) {
  return {
    error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
    details: error.errors,
  };
}
