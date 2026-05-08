import sharp from "sharp"

export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  // D'abord resize l'image ET récupère le buffer résultant
  const resizedBuffer = await sharp(imageBuffer)
    .resize({
      width: 600,
      height: 600,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png()
    .toBuffer()

  // Lire les dimensions réelles du buffer redimensionné
  const { width: w = 600, height: h = 600 } = await sharp(resizedBuffer).metadata()

  const fontSize = Math.round(Math.max(w, h) * 0.07)

  const svgText = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .wm { fill: white; font-size: ${fontSize}px; font-family: Arial, sans-serif; font-weight: bold; opacity: 0.4; }
    </style>
    <g transform="rotate(-35 ${w / 2} ${h / 2})">
      <text x="${w * -0.1}" y="${h * 0.2}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.35}" y="${h * 0.2}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * -0.2}" y="${h * 0.5}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.25}" y="${h * 0.5}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.65}" y="${h * 0.5}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * -0.1}" y="${h * 0.8}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.35}" y="${h * 0.8}" class="wm">PHOTORESTORE.GA</text>
    </g>
  </svg>`

  // Composite sur le buffer déjà résolu — plus de lazy pipeline
  return sharp(resizedBuffer)
    .composite([{ input: Buffer.from(svgText), gravity: 'center' }])
    .jpeg({ quality: 70 })
    .toBuffer()
}
