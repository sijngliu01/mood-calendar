import { useEffect, useState, type ReactNode } from 'react';
import { MoodContext, type IRecordInput } from '@/context/MoodContext';
import {
  INITIAL_CATEGORIES,
  INITIAL_RECORDS,
  INITIAL_TAGS,
  type AggregationMode,
  type IMoodCategory,
  type IMoodRecord,
  type ITag,
} from '@/data/mood';
import { dataUrlToBlob, deleteImages, getImageUrl, getState, saveImage, setState } from '@/lib/db';
import { store as legacyStore } from '@/lib/storage';

interface MoodProviderProps { children: ReactNode }

const TAG_COLORS = ['#C8D9C5', '#E5C6B8', '#D5C9E4', '#C5D8E5', '#E7D6A8'];
const MOOD_COLORS = ['#A94C4C', '#9279A6', '#6B86A8', '#4E9F7B', '#D8A643'];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${crypto.randomUUID()}`;
}

function plainRecords(records: IMoodRecord[]) {
  return records.map(({ imageUrls: _imageUrls, ...record }) => record);
}

async function hydrateRecord(record: IMoodRecord) {
  const imageIds = record.imageIds || [];
  const imageUrls = (await Promise.all(imageIds.map(getImageUrl))).filter(Boolean) as string[];
  return { ...record, imageIds, imageUrls };
}

async function loadInitialRecords() {
  const stored = await getState<IMoodRecord[] | null>('records', null);
  if (stored) return Promise.all(stored.map(hydrateRecord));

  const legacy = legacyStore.get<Array<IMoodRecord & { imageUrls?: string[] }>>('records', INITIAL_RECORDS);
  const migrated = await Promise.all(legacy.map(async (record) => {
    const dataUrls = (record.imageUrls || []).filter((url) => url.startsWith('data:'));
    const blobs = await Promise.all(dataUrls.map(dataUrlToBlob));
    const imageIds = await Promise.all(blobs.map(saveImage));
    return { ...record, imageIds, imageUrls: blobs.map((blob) => URL.createObjectURL(blob)) };
  }));
  await setState('records', plainRecords(migrated));
  return migrated;
}

export default function MoodProvider({ children }: MoodProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [records, setRecords] = useState<IMoodRecord[]>([]);
  const [tags, setTags] = useState<ITag[]>(INITIAL_TAGS);
  const [categories, setCategories] = useState<IMoodCategory[]>(INITIAL_CATEGORIES);
  const [aggregation, setAggregationState] = useState<AggregationMode>('average');

  useEffect(() => {
    let active = true;
    Promise.all([
      loadInitialRecords(),
      getState('tags', legacyStore.get('tags', INITIAL_TAGS)),
      getState('categories', legacyStore.get('categories', INITIAL_CATEGORIES)),
      getState<AggregationMode>('aggregation', legacyStore.get('aggregation', 'average')),
    ]).then(([nextRecords, nextTags, nextCategories, nextAggregation]) => {
      if (!active) return;
      setRecords(nextRecords);
      setTags(nextTags);
      setCategories(nextCategories);
      setAggregationState(nextAggregation);
      setIsReady(true);
    }).catch(() => setIsReady(true));
    return () => {
      active = false;
    };
  }, []);

  const saveRecord = async (input: IRecordInput, recordId?: string) => {
    const existing = recordId ? records.find((record) => record.id === recordId) : undefined;
    const keepImageIds = input.keepImageIds || [];
    const newBlobs = input.imageBlobs || [];
    const newImageIds = await Promise.all(newBlobs.map(saveImage));
    const newImageUrls = newBlobs.map((blob) => URL.createObjectURL(blob));
    const removedIds = existing ? existing.imageIds.filter((id) => !keepImageIds.includes(id)) : [];
    const removedUrls = existing ? existing.imageIds
      .map((id, index) => removedIds.includes(id) ? existing.imageUrls?.[index] : null)
      .filter(Boolean) as string[] : [];
    const record: IMoodRecord = {
      id: existing?.id || makeId('record'),
      date: input.date,
      time: input.time,
      type: input.type,
      categoryId: input.categoryId,
      note: input.note,
      tagIds: input.tagIds,
      imageIds: [...keepImageIds, ...newImageIds],
      imageUrls: [
        ...(existing?.imageIds || []).map((id, index) => keepImageIds.includes(id) ? existing?.imageUrls?.[index] : null).filter(Boolean) as string[],
        ...newImageUrls,
      ],
    };
    const next = existing
      ? records.map((item) => item.id === existing.id ? record : item)
      : [record, ...records];
    await setState('records', plainRecords(next));
    await deleteImages(removedIds);
    removedUrls.forEach(URL.revokeObjectURL);
    setRecords(next);
  };

  const deleteRecord = async (recordId: string) => {
    const target = records.find((record) => record.id === recordId);
    if (!target) return;
    const next = records.filter((record) => record.id !== recordId);
    await setState('records', plainRecords(next));
    await deleteImages(target.imageIds);
    target.imageUrls?.forEach(URL.revokeObjectURL);
    setRecords(next);
  };

  const addTag = (label: string) => {
    const value = label.trim();
    if (!value || tags.some((tag) => tag.label === value)) return null;
    const id = makeId('tag');
    const next = [...tags, { id, label: value, color: TAG_COLORS[tags.length % TAG_COLORS.length] }];
    setTags(next);
    void setState('tags', next);
    return id;
  };

  const updateTag = (tagId: string, label: string) => {
    const value = label.trim();
    if (!value || tags.some((tag) => tag.id !== tagId && tag.label === value)) return false;
    const next = tags.map((tag) => tag.id === tagId ? { ...tag, label: value } : tag);
    setTags(next);
    void setState('tags', next);
    return true;
  };

  const deleteTag = (tagId: string) => {
    const nextTags = tags.filter((tag) => tag.id !== tagId);
    const nextRecords = records.map((record) => ({ ...record, tagIds: record.tagIds.filter((id) => id !== tagId) }));
    setTags(nextTags);
    setRecords(nextRecords);
    void setState('tags', nextTags);
    void setState('records', plainRecords(nextRecords));
  };

  const addCategory = ({ label, score, icon }: Pick<IMoodCategory, 'label' | 'score' | 'icon'>) => {
    const value = label.trim();
    if (!value || categories.some((category) => category.label === value)) return null;
    const id = makeId('mood');
    const next = [...categories, { id, label: value, score, icon, color: MOOD_COLORS[score - 1] }];
    setCategories(next);
    void setState('categories', next);
    return id;
  };

  const updateCategory = (categoryId: string, nextCategory: Pick<IMoodCategory, 'label' | 'score' | 'icon'>) => {
    const label = nextCategory.label.trim();
    if (!label || categories.some((category) => category.id !== categoryId && category.label === label)) return false;
    const next = categories.map((category) => category.id === categoryId
      ? { ...category, ...nextCategory, label, color: MOOD_COLORS[nextCategory.score - 1] }
      : category);
    setCategories(next);
    void setState('categories', next);
    return true;
  };

  const deleteCategory = (categoryId: string) => {
    if (categories.length <= 1 || records.some((record) => record.categoryId === categoryId)) return false;
    const next = categories.filter((category) => category.id !== categoryId);
    setCategories(next);
    void setState('categories', next);
    return true;
  };

  const setAggregation = (mode: AggregationMode) => {
    setAggregationState(mode);
    void setState('aggregation', mode);
  };

  const clearRecords = async () => {
    await deleteImages(records.flatMap((record) => record.imageIds));
    records.forEach((record) => record.imageUrls?.forEach(URL.revokeObjectURL));
    setRecords([]);
    await setState('records', []);
  };

  return <MoodContext.Provider value={{
    isReady,
    records,
    tags,
    categories,
    aggregation,
    saveRecord,
    deleteRecord,
    addTag,
    updateTag,
    deleteTag,
    addCategory,
    updateCategory,
    deleteCategory,
    setAggregation,
    clearRecords,
  }}>{children}</MoodContext.Provider>;
}
