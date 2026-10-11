import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';
import App from './App.jsx';
import { DataContext, SiteContext } from './lib/ssr.jsx';

const root = document.getElementById('root');
const tree = (
  <React.StrictMode>
    <SiteContext.Provider value={{ url: window.__SITE__?.url || window.location.origin }}>
      <DataContext.Provider value={window.__DATA__ || null}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </DataContext.Provider>
    </SiteContext.Provider>
  </React.StrictMode>
);

// Production: the server already rendered the HTML, so attach to it. Development: render from scratch.
if (root.firstElementChild) hydrateRoot(root, tree);
else createRoot(root).render(tree);
