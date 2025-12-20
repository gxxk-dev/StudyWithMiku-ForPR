import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '../public')
const iconsDir = path.join(publicDir, 'icons')

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const baseIconPath = path.join(publicDir, 'icon-source.png')

const ensureBaseIcon = () => {
  if (!fs.existsSync(baseIconPath)) {
    throw new Error(`缺少 ${baseIconPath}，请放入 PNG 作为图标源文件`)
  }
}

const generateIcons = async () => {
  ensureBaseIcon()

  for (const size of sizes) {
    try {
      await sharp(baseIconPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(path.join(iconsDir, `icon-${size}x${size}.png`))

      console.log(`✓ icon-${size}x${size}.png`)
    } catch (error) {
      console.error(`✗ ${size}x${size} 失败:`, error.message)
    }
  }
  console.log('\n✓ 完成')
}

generateIcons()
