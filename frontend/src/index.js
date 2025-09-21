import React from 'react';
import { createRoot } from 'react-dom/client';
import QRVerifier from './QRVerifier';

const token = "<PASTE_YOUR_JWT_TOKEN>";

const App = () => (
  <div>
    <h1>Slip Verification</h1>
    <QRVerifier apiBase="http://localhost:4000" token={token} />
  </div>
);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
