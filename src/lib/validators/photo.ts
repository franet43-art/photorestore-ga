import { z } from "zod"

const MAX_FILE_SIZE = 10_485_760 // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export const photoSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, "Veuillez sélectionner un fichier.")
    .refine((file) => file.size <= MAX_FILE_SIZE, `La taille maximale est de 10 Mo.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Seuls les formats .jpg, .png et .webp sont acceptés."
    ),
})
