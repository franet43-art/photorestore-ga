// Réexporter depuis le nouveau client pour compatibilité
export { PROMPT_QUALITY, PROMPT_STANDARD } from "./client"

// Aliases pour ne pas casser restore/route.ts
export const PROMPT_CONSERVATIVE = PROMPT_QUALITY
export const PROMPT_CREATIVE = PROMPT_STANDARD
export const PROMPT_CONSERVATIVE_COLOR = PROMPT_QUALITY
export const PROMPT_CREATIVE_COLOR = PROMPT_STANDARD
