import { snackbar } from './helpers.js';
import { navigate } from './app.js';

// ═══════════════════════════════════════════════════════════
// PWA — Service Worker, Install prompt, Offline, Deep-link
// Auto-update: polling periodico + version.json check
// ═══════════════════════════════════════════════════════════

let _pendingWorker = null;
let _deferredPrompt = null;
let _swRegistration = null;
const INSTALL_DISMISSED_KEY = 'pwa-install-dismissed-v1';
const VERSION_KEY = 'pwa-known-version';
const UPDATE_INTERVAL_MS = 30 * 60 * 1000; // 30 minuti

// ── Auto-apply: attiva il nuovo SW e ricarica ──
function applyUpdate(worker) {
  snackbar('Aggiornamento in corso…');
  worker.postMessage({ type: 'SKIP_WAITING' });
}

function showUpdateToast(worker) {
  _pendingWorker = worker;

  // Mostra il toast per dare feedback visivo
  document.getElementById('pwa-update-toast').classList.add('show');

  // Auto-apply dopo 3 secondi se l'utente non interagisce
  setTimeout(() => {
    if (_pendingWorker === worker) {
      document.getElementById('pwa-update-toast').classList.remove('show');
      applyUpdate(worker);
    }
  }, 3000);
}

// ── Controlla version.json per rilevare nuovi deploy ──
async function checkVersionFile() {
  if (!_swRegistration) return;
  try {
    const res = await fetch(`./version.json?_=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const knownVersion = localStorage.getItem(VERSION_KEY);

    if (knownVersion && knownVersion !== data.version) {
      console.log('[PWA] Nuovo deploy rilevato:', data.version);
      _swRegistration.update();
    }
    localStorage.setItem(VERSION_KEY, data.version);
  } catch {
    // Offline o version.json non ancora presente — ignora
  }
}

export function initPWA() {
  // ── Service Worker registration ──
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
        _swRegistration = reg;
        console.log('[PWA] SW registrato:', reg.scope);

        // Controlla aggiornamenti quando la tab torna visibile
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update();
            checkVersionFile();
          }
        });

        // Polling periodico per aggiornamenti (ogni 30 min)
        setInterval(() => {
          reg.update();
          checkVersionFile();
        }, UPDATE_INTERVAL_MS);

        // Controlla version.json al primo caricamento
        checkVersionFile();

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateToast(newWorker);
            }
          });
        });

        if (reg.waiting && navigator.serviceWorker.controller) {
          showUpdateToast(reg.waiting);
        }

      } catch (err) {
        console.warn('[PWA] SW registration failed:', err);
      }
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  }

  // ── Update toast button (click immediato) ──
  document.getElementById('pwa-update-btn').addEventListener('click', () => {
    if (_pendingWorker) {
      applyUpdate(_pendingWorker);
      _pendingWorker = null;
    }
    document.getElementById('pwa-update-toast').classList.remove('show');
  });

  // ── Install banner ──
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    if (sessionStorage.getItem(INSTALL_DISMISSED_KEY)) return;
    setTimeout(() => {
      document.getElementById('pwa-install-banner')?.classList.add('show');
    }, 4000);
  });

  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    if (!_deferredPrompt) return;
    _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    console.log('[PWA] Install outcome:', outcome);
    _deferredPrompt = null;
    document.getElementById('pwa-install-banner').classList.remove('show');
    if (outcome === 'accepted') snackbar('App installata — trovala nella Home!');
  });

  document.getElementById('pwa-install-close').addEventListener('click', () => {
    document.getElementById('pwa-install-banner').classList.remove('show');
    sessionStorage.setItem(INSTALL_DISMISSED_KEY, '1');
  });

  window.addEventListener('appinstalled', () => {
    document.getElementById('pwa-install-banner')?.classList.remove('show');
    _deferredPrompt = null;
    console.log('[PWA] App installata con successo');
  });

  // ── Offline / Online detection ──
  const offlineBar = document.getElementById('offline-bar');
  function updateOnlineStatus() {
    if (!navigator.onLine) {
      offlineBar?.classList.add('show');
    } else {
      offlineBar?.classList.remove('show');
    }
  }
  window.addEventListener('online',  updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // ── Deep-link via URL params ──
  function handleUrlAction() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'add')   { navigate('add'); }
    if (action === 'stats') { navigate('stats'); }
  }
  setTimeout(handleUrlAction, 100);
}
