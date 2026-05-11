import OpenAI, { toFile } from "openai"
import * as fsSync from "fs"
import * as path from "path"
import * as os from "os"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

  const resultBuffer = Buffer.from(b64, "base64")
  
  // Log de la résolution pour debug
  try {
    const sharp = (await import("sharp")).default
    const metadata = await sharp(resultBuffer).metadata()
    console.log(`Restored image resolution: ${metadata.width}x${metadata.height}`)
  } catch (e) {
    console.log("Could not log restored image resolution")
  }

  return resultBuffer
}
