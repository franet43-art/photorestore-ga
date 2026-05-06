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

  // Overlay SVG : texte "PHOTORESTORE.GA" répété en diagonale
  // Angle -35°, opacité 0.40, fonte bold, répété pour couvrir toute l'image
  const svgText = `
    <svg width="600" height="600">
      <defs>
        <style>
          .text {
            fill: #ffffff;
            font-size: 48px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            opacity: 0.40;
            transform-origin: center;
          }
        </style>
      </defs>
      <g transform="rotate(-35 300 300)">
        <text x="-100" y="100" class="text">PHOTORESTORE.GA</text>
        <text x="200" y="100" class="text">PHOTORESTORE.GA</text>
        
        <text x="-200" y="300" class="text">PHOTORESTORE.GA</text>
        <text x="100" y="300" class="text">PHOTORESTORE.GA</text>
        <text x="400" y="300" class="text">PHOTORESTORE.GA</text>
        
        <text x="-100" y="500" class="text">PHOTORESTORE.GA</text>
        <text x="200" y="500" class="text">PHOTORESTORE.GA</text>
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
