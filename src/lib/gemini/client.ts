import OpenAI, { toFile } from "openai"
import * as fsSync from "fs"
import * as path from "path"
import * as os from "os"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const PROMPT_QUALITY = `You are a professional photo restoration specialist. 
Restore this damaged or aged photograph by:
- Removing all scratches, tears, stains, spots and physical damage
- Reconstructing blurred or degraded facial features with photorealistic precision
- Enhancing overall sharpness, contrast and clarity
- Correcting color fading: restore natural skin tones, clothing colors and backgrounds
- Preserving the original composition, era and authenticity of the photo
Deliver a clean, sharp, high-fidelity restoration that looks like the original undamaged photo.`

export const PROMPT_STANDARD = `Restore this old photo: remove scratches and damage, 
fix fading and discoloration, sharpen details, enhance faces. 
Keep original composition. Output a clean restored version.`

export async function restoreImage(
  imageBuffer: Buffer,
  prompt: string
): Promise<Buffer> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY non configurée")
  }

  const formData = new FormData()
  formData.append("model", "gpt-image-1")
  formData.append("prompt", prompt)
  formData.append(
    "image",
    new Blob([new Uint8Array(imageBuffer)], { type: "image/png" }),
    "photo.png"
  )

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData as any,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${errorBody}`)
  }

  const data = await response.json()
  const b64 = data?.data?.[0]?.b64_json
  if (!b64) throw new Error("OpenAI: aucune image dans la réponse")

  return Buffer.from(b64, "base64")
}
