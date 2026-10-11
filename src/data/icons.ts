export interface IEmojiOption { id: string; label: string; emoji: string }

export const EMOJI_OPTIONS: IEmojiOption[] = [
  { id: 'ecstatic', label: '狂喜', emoji: '🤩' },
  { id: 'laugh', label: '大笑', emoji: '😆' },
  { id: 'grin', label: '开心', emoji: '😄' },
  { id: 'smile', label: '微笑', emoji: '🙂' },
  { id: 'relieved', label: '放松', emoji: '😌' },
  { id: 'calm', label: '平静', emoji: '😐' },
  { id: 'thinking', label: '思考', emoji: '🤔' },
  { id: 'tired', label: '疲惫', emoji: '😮‍💨' },
  { id: 'sleepy', label: '困倦', emoji: '😴' },
  { id: 'worried', label: '担心', emoji: '😟' },
  { id: 'anxious', label: '焦虑', emoji: '😰' },
  { id: 'sad', label: '难过', emoji: '😢' },
  { id: 'crying', label: '大哭', emoji: '😭' },
  { id: 'annoyed', label: '烦躁', emoji: '😒' },
  { id: 'angry', label: '生气', emoji: '😠' },
  { id: 'furious', label: '愤怒', emoji: '😡' },
  { id: 'love', label: '心动', emoji: '🥰' },
  { id: 'proud', label: '自信', emoji: '😎' },
];

export const EMOJI_BY_ID: Record<string, string> = {
  ...Object.fromEntries(EMOJI_OPTIONS.map((option) => [option.id, option.emoji])),
  joyful: '😆', happy: '🙂', meh: '😐', frown: '😢',
  heart: '🥰', sparkles: '🤩', flame: '😄', zap: '😆',
  'battery-low': '😮‍💨', alert: '😰', brain: '🤔', thumbs: '😎',
  trophy: '🤩', party: '🥳', briefcase: '🫡', coffee: '😌',
  dumbbell: '😤', music: '😌', book: '🤔', plane: '😄',
  sun: '🙂', 'cloud-sun': '😐', 'cloud-rain': '😢', moon: '😴',
  rainbow: '🤩', flower: '🥰', leaf: '😌', waves: '😐',
};
