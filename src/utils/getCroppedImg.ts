import type { Area } from 'react-easy-crop';

/**
 * Draws the cropped region of imageSrc onto a canvas and returns it as a WebP File.
 * White background is painted first to avoid transparent-to-black artifacts in WebP.
 */
export async function getCroppedImg(imageSrc: string, croppedAreaPixels: Area): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;

  // White background so WebP has no transparent-to-black issue
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
  );

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('Canvas toBlob failed'));
        return;
      }
      resolve(new File([blob], 'crop.webp', { type: 'image/webp' }));
    }, 'image/webp');
  });
}

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
