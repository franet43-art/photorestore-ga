import OpenAI, { toFile } from "openai"
import * as fs from "fs"
import * as path from "path"
import * as os from "os"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const PROMPT_QUALITY = `You are an expert photo restoration artist. 
Restore this old or damaged photograph:
1. Remove all scratches, tears, stains, and physical damage
2. Reconstruct blurred or missing facial features with photorealistic detail  
3. Enhance overall sharpness and clarity
4. Fix fading: restore natural skin tones, colors, and depth
5. Preserve the authentic era and composition of the original
Output: a clean, sharp, museum-quality restoration faithful to the original photo.`

export const PROMPT_STANDARD = `Restore this old damaged photo: remove scratches and damage, 
sharpen details, fix fading and discoloration, enhance faces. 
Keep original composition. Output a clean restored version.`

export async function restoreImage(
  imageBuffer: Buffer,
  prompt: string
): Promise<Buffer> {
  const tmpPath = path.join(os.tmpdir(), `photo_${Date.now()}.png`)
  
  try {
    fs.writeFileSync(tmpPath, imageBuffer)
    
    const imageFile = await toFile(
      fs.createReadStream(tmpPath),
      "photo.png",
      { type: "image/png" }
    )

    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "low",
      response_format: "b64_json",
    } as any)

    const b64 = response.data?.[0]?.b64_json
    if (!b64) throw new Error("OpenAI: pas de b64_json dans la réponse")

    return Buffer.from(b64, "base64")

  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
  }
}
