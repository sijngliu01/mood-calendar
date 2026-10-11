import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import CalendarPage from '@/pages/CalendarPage/CalendarPage';
import SettingsPage from '@/pages/SettingsPage/SettingsPage';
import StatsPage from '@/pages/StatsPage/StatsPage';
import TimelinePage from '@/pages/TimelinePage/TimelinePage';
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage';

export default function App() {
  return <Routes><Route path="/" element={<Layout />}><Route index element={<TimelinePage />} /><Route path="calendar" element={<CalendarPage />} /><Route path="stats" element={<StatsPage />} /><Route path="settings" element={<SettingsPage />} /></Route><Route path="*" element={<NotFoundPage />} /></Routes>;
}
