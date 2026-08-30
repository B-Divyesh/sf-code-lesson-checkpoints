import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('public/assets', { recursive: true });
const source = 'assets/src/hero-paper-path.png';
await sharp(source).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toFile('public/assets/hero-paper-path.webp');
await sharp(source).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 80 }).toFile('public/assets/hero-paper-path-720.webp');
await sharp(source).resize({ width: 1200, withoutEnlargement: true }).avif({ quality: 55 }).toFile('public/assets/hero-paper-path.avif');
await sharp(source).resize({ width: 720, withoutEnlargement: true }).avif({ quality: 52 }).toFile('public/assets/hero-paper-path-720.avif');
await sharp(source).resize(1200, 630, { fit: 'cover', position: 'centre' }).jpeg({ quality: 84, progressive: true }).toFile('public/assets/social-card.jpg');
await sharp('public/favicon.svg').resize(180, 180).png().toFile('public/apple-touch-icon.png');
