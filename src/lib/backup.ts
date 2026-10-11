import { z } from 'zod';
import type { AggregationMode, IMoodCategory, IMoodRecord, ITag } from '@/data/mood';
import { dataUrlToBlob, getImages, replaceDatabaseData } from '@/lib/db';

const BACKUP_FORMAT = 'mood-calendar-backup';
const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 100 * 1024 * 1024;

const categorySchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  score: z.number().int().min(1).max(5),
  icon: z.string().min(1),
  color: z.string().min(1),
});

const tagSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  color: z.string().min(1),
});

const recordSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  time: z.string(),
  type: z.enum(['life', 'work']),
  categoryId: z.string().min(1),
  note: z.string(),
  tagIds: z.array(z.string()).default([]),
  imageIds: z.array(z.string()).default([]),
});

const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  data: z.object({
    records: z.array(recordSchema),
    tags: z.array(tagSchema),
    categories: z.array(categorySchema).min(1),
    aggregation: z.enum(['average', 'max']),
    images: z.record(z.string(), z.string().startsWith('data:image/')),
  }),
});

interface BackupSource {
  records: IMoodRecord[];
  tags: ITag[];
  categories: IMoodCategory[];
  aggregation: AggregationMode;
}

export interface RestoreResult extends BackupSource {
  restoredImages: number;
  missingImages: number;
}

function plainRecords(records: IMoodRecord[]) {
  return records.map(({ imageUrls: _imageUrls, ...record }) => record);
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('图片读取失败'));
    reader.readAsDataURL(blob);
  });
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

export async function createBackup(source: BackupSource) {
  const records = plainRecords(source.records);
  const imageIds = records.flatMap((record) => record.imageIds);
  const blobs = await getImages(imageIds);
  const images = Object.fromEntries(await Promise.all(
    [...blobs.entries()].map(async ([id, blob]) => [id, await blobToDataUrl(blob)]),
  ));
  const backup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      records,
      tags: source.tags,
      categories: source.categories,
      aggregation: source.aggregation,
      images,
    },
  };
  return new Blob([JSON.stringify(backup)], { type: 'application/json' });
}

export async function restoreBackup(file: File): Promise<RestoreResult> {
  if (file.size > MAX_BACKUP_BYTES) throw new Error('备份文件超过 100 MB，无法导入');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(await file.text());
  } catch {
    throw new Error('无法读取备份文件，请确认选择了心情日历备份');
  }

  const parsed = backupSchema.safeParse(parsedJson);
  if (!parsed.success) throw new Error('备份格式不正确或版本不受支持');

  const categories = uniqueById(parsed.data.data.categories);
  const tags = uniqueById(parsed.data.data.tags);
  const records = uniqueById(parsed.data.data.records);
  const categoryIds = new Set(categories.map((category) => category.id));
  if (records.some((record) => !categoryIds.has(record.categoryId))) {
    throw new Error('备份中的记录引用了不存在的心情类别');
  }

  const tagIds = new Set(tags.map((tag) => tag.id));
  const referencedImageIds = [...new Set(records.flatMap((record) => record.imageIds))];
  const images = new Map<string, Blob>();
  await Promise.all(referencedImageIds.map(async (id) => {
    const dataUrl = parsed.data.data.images[id];
    if (!dataUrl) return;
    images.set(id, await dataUrlToBlob(dataUrl));
  }));

  const restoredRecords = records.map((record) => ({
    ...record,
    tagIds: record.tagIds.filter((id) => tagIds.has(id)),
    imageIds: record.imageIds.filter((id) => images.has(id)),
  }));
  const aggregation = parsed.data.data.aggregation;
  await replaceDatabaseData({
    records: restoredRecords,
    tags,
    categories,
    aggregation,
  }, images);

  return {
    records: restoredRecords,
    tags,
    categories,
    aggregation,
    restoredImages: images.size,
    missingImages: referencedImageIds.length - images.size,
  };
}
