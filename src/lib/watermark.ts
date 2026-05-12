import sharp from "sharp"

export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const resizedBuffer = await sharp(imageBuffer)
    .resize({ width: 450, height: 450, fit: 'inside', withoutEnlargement: true })
    .toBuffer()
  const { width: w = 450, height: h = 450 } = await sharp(resizedBuffer).metadata()
  const stripeWidth = Math.round(w * 0.03)
  const gap = Math.round(w * 0.12)
  
  let stripes = ''
  for (let i = -3; i < 12; i++) {
    const x = i * (stripeWidth + gap)
    stripes += `<rect x="${x}" y="-${h}" width="${stripeWidth}" height="${h * 3}" 
      fill="white" fill-opacity="0.25" />`
  }
  const bandH = Math.round(h * 0.15)
  const bandY = Math.round(h / 2 - bandH / 2)
  const watermarkSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="${Math.round(w*0.1)}" height="${Math.round(h*0.1)}" 
        patternUnits="userSpaceOnUse">
        <rect width="${Math.round(w*0.1)}" height="${Math.round(h*0.1)}" fill="black" fill-opacity="0.02"/>
        <rect width="${Math.round(w*0.1)}" height="1" fill="white" fill-opacity="0.1"/>
        <rect width="1" height="${Math.round(h*0.1)}" fill="white" fill-opacity="0.1"/>
      </pattern>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#grid)" />
    <g transform="rotate(-25 ${w/2} ${h/2})">${stripes}</g>
    <rect x="0" y="${bandY}" width="${w}" height="${bandH}" fill="black" fill-opacity="0.6" />
    <rect x="${Math.round(w*0.03)}" y="${Math.round(h*0.05)}" 
      width="${Math.round(w*0.94)}" height="${Math.round(h*0.04)}" 
      fill="white" fill-opacity="0.2" rx="2"/>
    <rect x="${Math.round(w*0.03)}" y="${Math.round(h*0.91)}" 
      width="${Math.round(w*0.94)}" height="${Math.round(h*0.04)}" 
      fill="white" fill-opacity="0.2" rx="2"/>
  </svg>`
  return sharp(resizedBuffer)
    .composite([{ input: Buffer.from(watermarkSvg), gravity: 'center' }])
    .jpeg({ quality: 50 })
    .toBuffer()
}
