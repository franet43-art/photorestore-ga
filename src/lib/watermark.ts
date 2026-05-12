import sharp from "sharp"
import fs from 'fs';
import path from 'path';

export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const fontPath = path.join(process.cwd(), 'src/lib/fonts/Inter-Bold.ttf');
  const fontBase64 = fs.readFileSync(fontPath).toString('base64');

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
      @font-face {
        font-family: 'WatermarkFont';
        src: url('data:font/truetype;base64,${fontBase64}') format('truetype');
        font-weight: bold;
      }
      .wm { 
        fill: white; 
        font-size: ${fontSize}px; 
        font-family: 'WatermarkFont', sans-serif; 
        font-weight: bold; 
        opacity: 0.7; 
      }
      .wm-shadow { 
        fill: black; 
        opacity: 0.5; 
        font-size: ${fontSize}px;
        font-family: 'WatermarkFont', sans-serif; 
        font-weight: bold; 
      }
      .wm-big {
        fill: white;
        font-size: ${Math.round(fontSize * 1.2)}px;
        font-family: 'WatermarkFont', sans-serif; 
        font-weight: bold; 
        opacity: 0.8;
      }
      .wm-big-shadow { 
        fill: black; 
        opacity: 0.5;
        font-size: ${Math.round(fontSize * 1.2)}px;
        font-family: 'WatermarkFont', sans-serif; 
        font-weight: bold; 
      }
    </style>
    <g transform="rotate(-35 ${w / 2} ${h / 2})">
      <!-- Rangée 1 -->
      <text x="${w * -0.2 + 2}" y="${h * 0.1 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * -0.2}" y="${h * 0.1}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.2 + 2}" y="${h * 0.1 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * 0.2}" y="${h * 0.1}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.6 + 2}" y="${h * 0.1 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * 0.6}" y="${h * 0.1}" class="wm">PHOTORESTORE.GA</text>
      
      <!-- Rangée 2 -->
      <text x="${w * -0.1 + 2}" y="${h * 0.3 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * -0.1}" y="${h * 0.3}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.3 + 2}" y="${h * 0.3 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * 0.3}" y="${h * 0.3}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.7 + 2}" y="${h * 0.3 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * 0.7}" y="${h * 0.3}" class="wm">PHOTORESTORE.GA</text>
      
      <!-- Rangée 3 -->
      <text x="${w * -0.2 + 2}" y="${h * 0.5 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * -0.2}" y="${h * 0.5}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.2 + 2}" y="${h * 0.5 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * 0.2}" y="${h * 0.5}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.6 + 2}" y="${h * 0.5 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * 0.6}" y="${h * 0.5}" class="wm">PHOTORESTORE.GA</text>
      
      <!-- Rangée 4 -->
      <text x="${w * -0.1 + 2}" y="${h * 0.7 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * -0.1}" y="${h * 0.7}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.3 + 2}" y="${h * 0.7 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * 0.3}" y="${h * 0.7}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.7 + 2}" y="${h * 0.7 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * 0.7}" y="${h * 0.7}" class="wm">PHOTORESTORE.GA</text>
      
      <!-- Rangée 5 -->
      <text x="${w * -0.2 + 2}" y="${h * 0.9 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * -0.2}" y="${h * 0.9}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.2 + 2}" y="${h * 0.9 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * 0.2}" y="${h * 0.9}" class="wm">PHOTORESTORE.GA</text>
      <text x="${w * 0.6 + 2}" y="${h * 0.9 + 2}" class="wm-shadow">PHOTORESTORE.GA</text>
      <text x="${w * 0.6}" y="${h * 0.9}" class="wm">PHOTORESTORE.GA</text>
    </g>
    <text x="${w / 2 + 3}" y="${h / 2 + 3}" class="wm-big-shadow" text-anchor="middle">APERÇU — ACHETEZ LA VERSION HD</text>
    <text x="${w / 2}" y="${h / 2}" class="wm-big" text-anchor="middle">APERÇU — ACHETEZ LA VERSION HD</text>
  </svg>`

  // Composite sur le buffer déjà résolu — plus de lazy pipeline
  return sharp(resizedBuffer)
    .composite([{ input: Buffer.from(svgText), gravity: 'center' }])
    .jpeg({ quality: 50 })
    .toBuffer()
}

