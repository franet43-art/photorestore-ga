import sharp from "sharp"

export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer)
  const metadata = await image.metadata()
  
  if (!metadata.width || !metadata.height) {
    throw new Error("Impossible de lire les dimensions de l'image.")
  }

  // Resize : max 600px sur le côté le plus long, sans upscale
  const resized = image.resize({
    width: metadata.width >= metadata.height ? 600 : undefined,
    height: metadata.height > metadata.width ? 600 : undefined,
    withoutEnlargement: true,
  })

  const resizedMeta = await resized.clone().metadata()
  const w = resizedMeta.width || 600
  const h = resizedMeta.height || 600

  // Overlay SVG : texte "PHOTORESTORE.GA" répété en diagonale
  // Angle -35°, opacité 0.40, fonte bold, répété pour couvrir toute l'image
  const svgText = `
    <svg width="${w}" height="${h}">
      <defs>
        <style>
          .text {
            fill: #ffffff;
            font-size: ${Math.max(w, h) * 0.08}px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            opacity: 0.40;
            transform-origin: center;
          }
        </style>
      </defs>
      <g transform="rotate(-35 ${w/2} ${h/2})">
        <text x="${-w*0.15}" y="${h*0.15}" class="text">PHOTORESTORE.GA</text>
        <text x="${w*0.3}" y="${h*0.15}" class="text">PHOTORESTORE.GA</text>
        <text x="${-w*0.3}" y="${h*0.5}" class="text">PHOTORESTORE.GA</text>
        <text x="${w*0.15}" y="${h*0.5}" class="text">PHOTORESTORE.GA</text>
        <text x="${w*0.6}" y="${h*0.5}" class="text">PHOTORESTORE.GA</text>
        <text x="${-w*0.15}" y="${h*0.85}" class="text">PHOTORESTORE.GA</text>
        <text x="${w*0.3}" y="${h*0.85}" class="text">PHOTORESTORE.GA</text>
      </g>
    </svg>
  `

  // Application du watermark après le traitement
  return resized
    .composite([
      {
        input: Buffer.from(svgText),
        gravity: 'center',
      },
    ])
    .jpeg({ quality: 70 })
    .toBuffer()
}
