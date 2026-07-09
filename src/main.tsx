import { createRoot } from 'react-dom/client'
import { Routes } from '@generouted/react-router'
import './App.css'

declare const __IS_MOBILE__: boolean;
if (typeof __IS_MOBILE__ !== 'undefined' && __IS_MOBILE__) {
  document.documentElement.classList.add('mobile-ui');
}

createRoot(document.getElementById('root')!).render(
  <Routes />
)
