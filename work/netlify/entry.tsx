import { createRoot } from 'react-dom/client';
import Exhibition from '@/app/page';
import Meeting from '@/app/meeting/page';
import './styles.css';

const isMeeting = /\/meeting\/?$/.test(window.location.pathname);
createRoot(document.getElementById('root')!).render(
  isMeeting ? <Meeting /> : <Exhibition />,
);
