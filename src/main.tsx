import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/components/App';
import './index.css';

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('Root element not found');
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
