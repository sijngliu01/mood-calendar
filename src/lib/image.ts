const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.78;

export async function compressImage(file: File) {
  const source = URL.createObjectURL(file);
  const image = new Image();
  image.src = source;
  try {
    await image.decode();

    const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('图片处理失败');
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('图片处理失败')), 'image/jpeg', JPEG_QUALITY);
    });
  } finally {
    URL.revokeObjectURL(source);
  }
}
