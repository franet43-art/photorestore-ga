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

  const tmpPath = path.join(os.tmpdir(), `restore_${Date.now()}.png`)

  try {
    fsSync.writeFileSync(tmpPath, imageBuffer)

    const imageFile = await toFile(
      fsSync.createReadStream(tmpPath),
      "photo.png",
      { type: "image/png" }
    )

    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    } as any)

    const b64 = response.data?.[0]?.b64_json
    if (!b64) throw new Error("OpenAI: aucune image dans la réponse")

    return Buffer.from(b64, "base64")

  } finally {
    if (fsSync.existsSync(tmpPath)) fsSync.unlinkSync(tmpPath)
  }
}
