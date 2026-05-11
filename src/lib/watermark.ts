import sharp from "sharp"

export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  // D'abord resize l'image ET récupère le buffer résultant (450x450 max)
  const resizedBuffer = await sharp(imageBuffer)
    .resize({
      width: 450,
      height: 450,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png()
    .toBuffer()

  // Lire les dimensions réelles du buffer redimensionné
  const { width: w = 450, height: h = 450 } = await sharp(resizedBuffer).metadata()

  const fontSize = Math.round(Math.max(w, h) * 0.10)

  // Grille 3x5 (15 répétitions) + Gros texte central
  const svgText = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .wm { 
        fill: white; 
        font-size: ${fontSize}px; 
        font-family: Arial, sans-serif; 
        font-weight: bold; 
        opacity: 0.7; 
        filter: drop-shadow(2px 2px 2px black);
      }
      .wm-big {
        fill: white;
        font-size: ${Math.round(fontSize * 1.2)}px;
        font-family: Arial, sans-serif;
        font-weight: bold;
        opacity: 0.8;
        filter: drop-shadow(3px 3px 3px black);
      }
    </style>
    <g transform="rotate(-35 ${w / 2} ${h / 2})">
      <text x="${w * -0.2}" y="${h * 0.1}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.2}" y="${h * 0.1}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.6}" y="${h * 0.1}" class="wm">PHOTORESTORE.GA</text>
      
      <text x="${w * -0.1}" y="${h * 0.3}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.3}" y="${h * 0.3}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.7}" y="${h * 0.3}" class="wm">PHOTORESTORE.GA</text>
      
      <text x="${w * -0.2}" y="${h * 0.5}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.2}" y="${h * 0.5}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.6}" y="${h * 0.5}" class="wm">PHOTORESTORE.GA</text>
      
      <text x="${w * -0.1}" y="${h * 0.7}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.3}" y="${h * 0.7}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.7}" y="${h * 0.7}" class="wm">PHOTORESTORE.GA</text>
      
      <text x="${w * -0.2}" y="${h * 0.9}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.2}" y="${h * 0.9}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.6}" y="${h * 0.9}" class="wm">PHOTORESTORE.GA</text>
    </g>
    <text x="${w / 2}" y="${h / 2}" class="wm-big" text-anchor="middle">APERÇU — ACHETEZ LA VERSION HD</text>
  </svg>`

  // Composite sur le buffer déjà résolu — plus de lazy pipeline
  return sharp(resizedBuffer)
    .composite([{ input: Buffer.from(svgText), gravity: 'center' }])
    .jpeg({ quality: 50 })
    .toBuffer()
}

