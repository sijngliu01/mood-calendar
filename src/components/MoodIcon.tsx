import { EMOJI_BY_ID } from '@/data/icons';

interface MoodIconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
}

export default function MoodIcon({ name, size = 24 }: MoodIconProps) {
  const emoji = EMOJI_BY_ID[name] || '🙂';
  return <span aria-hidden="true" className="inline-flex select-none items-center justify-center leading-none" style={{ fontSize: size }}>{emoji}</span>;
}
