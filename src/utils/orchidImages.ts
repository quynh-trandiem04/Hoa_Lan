import type { Orchid } from '../types';

const isImageUrl = (value: unknown): value is string =>
  typeof value === 'string' && /^(https?:\/\/|data:|blob:)/i.test(value);

export const getOrchidImageUrls = (orchid: Pick<Orchid, 'uploadedImageIds' | 'imageUrls'>): string[] => {
  const urls = [
    ...(orchid.imageUrls ?? []),
    ...(orchid.uploadedImageIds ?? []).filter(isImageUrl),
  ];
  return [...new Set(urls.filter(isImageUrl))];
};
