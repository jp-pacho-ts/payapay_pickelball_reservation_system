import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PayapayPickleballApp from '../payapay_pickleball_app';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><PayapayPickleballApp /></StrictMode>,
);
