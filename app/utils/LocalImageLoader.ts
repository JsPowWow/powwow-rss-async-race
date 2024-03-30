export const readAsDataURLAsync = (file: File): Promise<FileReader['result']> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (): void => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getImageAsync = (source: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = (): void => {
      resolve(image);
    };
    image.onerror = (e): void => {
      reject(e);
    };
    image.src = source;
  });
};

const SUPPORTED_FILE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif']);

export async function processFile(file: File): Promise<{ data: FileReader['result']; file: File }> {
  if (!file) {
    throw new Error('File is missing');
  }
  if (!SUPPORTED_FILE_TYPES.has(file.type)) {
    throw new Error(`The file type "${file.type}" is not supported.`);
  }
  const data = await readAsDataURLAsync(file);
  return { data, file };
}
