// EXPORTS: MoodType, AggregationMode, IMoodCategory{id,label,score,icon,color}, ITag{id,label,color}, IMoodRecord{id,date,time,type,categoryId,note,tagIds}, INITIAL_* 
export type MoodType = 'life' | 'work';
export type AggregationMode = 'average' | 'max';

export interface IMoodCategory {
  id: string;
  label: string;
  score: number;
  icon: string;
  color: string;
}

export interface ITag {
  id: string;
  label: string;
  color: string;
}

export interface IMoodRecord {
  id: string;
  date: string;
  time: string;
  type: MoodType;
  categoryId: string;
  note: string;
  tagIds: string[];
  imageIds: string[];
  imageUrls?: string[];
}

export const INITIAL_CATEGORIES: IMoodCategory[] = [
  { id: 'joyful', label: '雀跃', score: 5, icon: 'laugh', color: '#D8A643' },
  { id: 'happy', label: '开心', score: 4, icon: 'smile', color: '#4E9F7B' },
  { id: 'calm', label: '平静', score: 3, icon: 'relieved', color: '#6B86A8' },
  { id: 'low', label: '低落', score: 2, icon: 'sad', color: '#9279A6' },
  { id: 'tense', label: '焦虑', score: 1, icon: 'worried', color: '#C07063' },
  { id: 'furious', label: '愤怒', score: 1, icon: 'furious', color: '#A94C4C' },
];

export const INITIAL_TAGS: ITag[] = [
  { id: 'sunny', label: '晴天', color: '#FFF0B8' },
  { id: 'cat', label: '猫猫', color: '#F5D5CB' },
  { id: 'coffee', label: '咖啡', color: '#DCC8B6' },
];

export const INITIAL_RECORDS: IMoodRecord[] = [];
