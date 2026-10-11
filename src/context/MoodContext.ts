import { createContext, useContext } from 'react';
import type { AggregationMode, IMoodCategory, IMoodRecord, ITag } from '@/data/mood';

export interface IRecordInput extends Omit<IMoodRecord, 'id' | 'imageIds' | 'imageUrls'> {
  keepImageIds?: string[];
  imageBlobs?: Blob[];
}

export interface IMoodContextValue {
  isReady: boolean;
  records: IMoodRecord[];
  tags: ITag[];
  categories: IMoodCategory[];
  aggregation: AggregationMode;
  saveRecord: (record: IRecordInput, recordId?: string) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  addTag: (label: string) => string | null;
  updateTag: (tagId: string, label: string) => boolean;
  deleteTag: (tagId: string) => void;
  addCategory: (category: Pick<IMoodCategory, 'label' | 'score' | 'icon'>) => string | null;
  updateCategory: (categoryId: string, category: Pick<IMoodCategory, 'label' | 'score' | 'icon'>) => boolean;
  deleteCategory: (categoryId: string) => boolean;
  setAggregation: (mode: AggregationMode) => void;
  clearRecords: () => Promise<void>;
}

export const MoodContext = createContext<IMoodContextValue | null>(null);

export function useMood() {
  const value = useContext(MoodContext);
  if (!value) throw new Error('MoodProvider is missing');
  return value;
}
