import { z } from "zod";

export const companyUpdateSchema = z.object({
  name: z.string().trim().min(1),
  legalName: z.string().trim().optional(),
  contact: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
});
