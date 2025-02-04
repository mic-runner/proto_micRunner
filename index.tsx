import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
    return (
        <div>
            <h1>placeholder header lol</h1>
        </div>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App />);
}