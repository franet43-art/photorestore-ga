import OpenAI from "openai"
import * as fs from "fs"
import * as path from "path"
import * as os from "os"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// PROMPT QUALITATIF — Restauration professionnelle
export const PROMPT_QUALITY = `You are an expert photo restoration artist. 
Restore this old or damaged photograph with the following priorities:
1. Remove all scratches, tears, stains, and physical damage
2. Reconstruct missing or blurred facial features with photorealistic detail
3. Enhance sharpness and clarity throughout the entire image
4. Correct fading: restore natural skin tones, clothing colors, and background depth
5. Preserve the authentic character and era of the original photo
6. Output a museum-quality restoration that looks like a professional scan of the original undamaged photo
Style: photorealistic, high-detail, faithful to original composition`

// PROMPT STANDARD — Restauration correcte mais plus rapide
export const PROMPT_STANDARD = `Restore this old photo: remove scratches and damage, 
sharpen details, fix fading and discoloration, enhance faces and overall clarity. 
Keep the original composition. Output a clean, clear restored version.`

export async function restoreImage(
  imageBuffer: Buffer,
  prompt: string
): Promise<Buffer> {
  // Écrire le buffer dans un fichier temporaire (requis par l'API OpenAI edit)
  const tmpPath = path.join(os.tmpdir(), `photo_${Date.now()}.png`)
  
  try {
    fs.writeFileSync(tmpPath, imageBuffer)
    
    const response = await openai.images.edit({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini",
      image: fs.createReadStream(tmpPath),
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    })

    const imageUrl = response.data[0]?.url
    if (!imageUrl) throw new Error("OpenAI: pas d'URL dans la réponse")

    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) throw new Error(`Fetch image failed: ${imageResponse.status}`)
    
    const arrayBuffer = await imageResponse.arrayBuffer()
    return Buffer.from(arrayBuffer)

  } finally {
    // Nettoyage du fichier temporaire
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
  }
}
