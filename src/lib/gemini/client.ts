import { GoogleGenerativeAI } from "@google/generative-ai"

export async function restoreImage(
  imageBuffer: Buffer,
  prompt: string
): Promise<Buffer> {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY non configurée")
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-05-20",
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      } as any,
    })

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Timeout Gemini API (45s)")),
        45_000
      )
    )

    const apiCallPromise = model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: "image/jpeg",
        },
      },
    ])

    const result = await Promise.race([apiCallPromise, timeoutPromise])
    const parts = result.response.candidates?.[0]?.content?.parts ?? []

    // Chercher la part qui contient l'image
    const imagePart = parts.find(
      (p: any) => p.inlineData?.mimeType?.startsWith("image/")
    )

    if (!imagePart?.inlineData?.data) {
      // Log les parts reçues pour debug
      console.error(
        "Aucune image dans la réponse Gemini. Parts reçues:",
        JSON.stringify(parts.map((p: any) => Object.keys(p)))
      )
      throw new Error("Gemini n'a pas retourné d'image dans la réponse.")
    }

    const outputBuffer = Buffer.from(imagePart.inlineData.data, "base64")

    if (outputBuffer.length === 0) {
      throw new Error("Buffer image vide après décodage base64.")
    }

    return outputBuffer
  } catch (error: any) {
    const errorMsg = error.message?.toUpperCase() || ""
    if (errorMsg.includes("QUOTA") || errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("QUOTA_EXCEEDED")
    }
    throw error
  }
}
