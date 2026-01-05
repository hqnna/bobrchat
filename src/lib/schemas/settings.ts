import { z } from "zod";

/**
 * Preferences tab - theme, instructions, thread naming, landing page content
 */
export const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  customInstructions: z.string().max(5000).optional(),
  defaultThreadName: z.string().min(1).max(255),
  landingPageContent: z.enum(["suggestions", "greeting", "blank"]),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;

/**
 * Integrations tab - API key management and storage preference
 */
export const integrationsSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  storeServerSide: z.boolean().default(false),
});

export type IntegrationsInput = z.infer<typeof integrationsSchema>;

/**
 * Profile tab - user information updates
 */
export const profileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.email().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
