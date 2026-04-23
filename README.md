<div align="center">
 
# 🍺 Beer Cellar
 
### La tua cantina digitale per birre artigianali
 
[![PWA](https://img.shields.io/badge/PWA-ready-F07828?style=for-the-badge&logo=pwa&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![HTML5](https://img.shields.io/badge/HTML5-single--file-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F4C840?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/license-MIT-8ABF40?style=for-the-badge)](LICENSE)
 
<br/>
 
> Traccia, valuta e scopri le birre artigianali — incluso il catalogo **50&50 Craft Brewery** —  
> tutto offline, tutto nel browser, zero backend. Progetto personale.
 
<br/>
 
[![Immagine-2026-04-23-213642.png](https://i.postimg.cc/65G1yJfN/Immagine-2026-04-23-213642.png)](https://postimg.cc/Tpfc4ssk)
</div>
 
---
 
## ✨ Funzionalità
 
### 🗂 Gestione Cantina
- **Catalogo completo** — birre 50&50 Craft Brewery precaricate con schede dettagliate; in futuro potrei aggiornare con altri Birrifici Artigianali o altre entries estemporanee maaaaa... puoi farlo anche te ;)
- **Aggiungi birre personalizzate** — nome, birrificio, origine, ABV, IBU, colore
- **Modifica ed elimina** — aggiornamento completo di ogni scheda
- **Categorie** — 12 stili (Lager, IPA, Stout, Weizen, Sour, Trappista, e altri)
 
### ⭐ Valutazione
- **Rating a mezze stelle** — da 0 a 5 con granularità di 0.5
- **Etichette dinamiche** — da *"Non è per me"* a *"Capolavoro assoluto!"*
- **Profilo organolettico** — note su aroma, sapore, corpo, finale
- **Storia e curiosità** — background di ogni birra
- **Note personali** — abbinamenti, occasioni, ricordi
 
### 🔍 Ricerca & Filtri
- **Ricerca full-text** — per nome, birrificio, origine
- **Filtro per categoria** — chip selezionabili in scrolling orizzontale
- **Filtri rapidi** — Tutte / Provate / Preferite
- **Ordinamento** — per data, voto, nome A–Z, birrificio
 
### 📊 Statistiche
- **KPI dashboard** — birre provate, preferite, voto medio, stili scoperti
- **Top 5 birre** — classifica con medaglie per le più votate
- **Grafico per stile** — distribuzione visiva del catalogo
 
### 💾 Import / Export
- **Export JSON** — salvataggio della cantina completa con File System Access API + fallback download
- **Import JSON** — con due strategie: *Unisci* (mantieni esistenti) o *Sostituisci tutto*
- **Validazione robusta** — sanitizzazione campi, deduplicazione ID, compatibilità formati
 
### 📱 Progressive Web App
- **Installabile** — su Android, iOS (Safari), desktop Chrome/Edge
- **Offline-first** — funziona completamente senza connessione dopo il primo carico
- **Service Worker** — cache-first per l'app shell, stale-while-revalidate per i font
- **Shortcuts** — pressione lunga sull'icona per accesso rapido ad "Aggiungi" e "Statistiche"
- **Update toast** — notifica in-app quando è disponibile una nuova versione
- **Barra offline** — indicatore visivo quando la connessione è assente
 
---
 
## 🏗 Architettura
 
```
beer-cellar/
├── index.html              # App shell completa (single-file SPA)
├── style.css               # style CSS style
├── manifest.json           # Web App Manifest
├── sw.js                   # Service Worker
├── _headers                # Cloudflare Pages — header HTTP
└── icons/
    ├── icon.svg            # Icona vettoriale universale
    ├── icon-72/96/128/192/512.png
    ├── icon-maskable-192/512.png
    ├── shortcut-add.png
    └── shortcut-stats.png
```
 
### Stack tecnico
 
| Layer | Scelta | Motivazione |
|---|---|---|
| Frontend | Vanilla JS + HTML/CSS | Zero dipendenze, carico istantaneo |
| Persistenza | `localStorage` | Nessun backend, privacy totale |
| Font | Bebas Neue + Barlow (Google Fonts) | Identità visiva taproom industrial |
| Deploy | Cloudflare Pages | Edge CDN globale, HTTPS automatico |
| Icone | Pillow (generazione) + SVG | Controllate al pixel, brand-consistent |
 
### Strategie di caching (Service Worker)
 
```
Richiesta locale (app shell)  →  Cache-First
                                 └─ Miss? → Fetch + aggiorna cache
                                 └─ Offline? → Fallback su index.html
 
Font Google                   →  Stale-While-Revalidate
                                 └─ Risposta immediata dalla cache
                                 └─ Aggiornamento silenzioso in background
 
Risorse esterne               →  Network-First
                                 └─ Fallback su cache se offline
```
 
---
 
## 🚀 Deploy su GitHub Pages
 
### 1. Crea il repository
 
```bash
# Clona il repository
git clone https://github.com/tuo-username/beer-cellar.git
cd beer-cellar
 
# Assicurati che tutti i file siano nella root
# index.html, manifest.json, sw.js, _headers, icons/
git add .
git commit -m "feat: initial PWA setup"
git push origin main
```
 
### 2. Abilita GitHub Pages
 
1. Vai su **Settings** → **Pages** nel tuo repository
2. Sotto *Source* seleziona **Deploy from a branch**
3. Branch: **`main`** — Folder: **`/ (root)`**
4. Clicca **Save**
 
Dopo qualche minuto l'app sarà disponibile su:
```
https://tuo-username.github.io/beer-cellar/
```
 
### 3. Aggiorna i path nel manifest
 
GitHub Pages serve l'app in una sottodirectory (`/beer-cellar/`), quindi aggiorna `manifest.json` di conseguenza:
 
```json
{
  "start_url": "/beer-cellar/index.html?utm_source=pwa",
  "scope": "/beer-cellar/",
  "shortcuts": [
    { "url": "/beer-cellar/index.html?action=add" },
    { "url": "/beer-cellar/index.html?action=stats" }
  ]
}
```
 
> 💡 Se usi un dominio custom (Settings → Pages → Custom domain) puoi lasciare i path relativi `./` senza modifiche.
 
### 4. Installa la PWA
 
| Piattaforma | Procedura |
|---|---|
| **Android** (Chrome) | Banner automatico dopo qualche secondo → *Installa* |
| **iOS** (Safari) | Condividi `⎙` → *Aggiungi a schermata Home* |
| **Desktop** (Chrome/Edge) | Icona `⊕` nella barra indirizzi → *Installa* |
---
 
## 🛠 Sviluppo locale
 
Non è necessario nessun bundler. Apri semplicemente con un server HTTP locale per evitare restrizioni CORS sui Service Worker:
 
```bash
# Python 3
python3 -m http.server 8080
 
# Node.js (npx)
npx serve .
 
# oppure VS Code → Live Server extension
```
 
Poi apri `http://localhost:8080` — il SW si registra automaticamente su `localhost`.
 
### Debug PWA
 
```
Chrome DevTools → Application
├── Manifest      → verifica icone e campi senza errori rossi
├── Service Workers → stato: "activated and running"
└── Storage → Local Storage → beer-cellar-5050-v4 → dati cantina
```
 
---
 
## 📦 Dati & Privacy
 
- Tutti i dati sono salvati **esclusivamente in `localStorage`** nel dispositivo dell'utente
- Nessun dato viene trasmesso a server esterni
- L'export JSON è un backup locale, mai caricato automaticamente
- Nessun tracker, nessuna analytics, nessun cookie
 
---
 
## 📄 Licenza
 
Distribuito sotto licenza **MIT**. Vedi [`LICENSE`](LICENSE) per i dettagli.
 
---
 
<div align="center">
 
Fatto con ❤️ e 🍺 &nbsp;·&nbsp; 
 
</div>
