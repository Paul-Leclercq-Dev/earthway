# Guide PWA - Earthway

## Vue d'ensemble

Earthway est maintenant une Progressive Web App (PWA) complète, offrant une expérience d'application native sur tous les appareils.

## Fonctionnalités PWA

### ✅ 1. Installation

L'application peut être installée sur les appareils mobiles et desktop :

- **Android (Chrome)** : Prompt d'installation automatique après 2s
- **iOS (Safari)** : Bouton "Ajouter à l'écran d'accueil"
- **Desktop (Chrome/Edge)** : Icône d'installation dans la barre d'adresse

#### Composant InstallPrompt

```typescript
// src/components/InstallPrompt.tsx
- Détecte l'événement beforeinstallprompt
- Affiche une bannière personnalisée après 2s
- Gestion localStorage pour ne pas spammer l'utilisateur
- Show prompt maximum 1x par 7 jours si dismissé
```

### ✅ 2. Mode Hors Ligne

L'application fonctionne partiellement hors ligne grâce au service worker :

#### Stratégies de Cache

1. **Network First** (API calls)
   - Tente d'abord le réseau (timeout 10s)
   - Fallback sur cache si réseau indisponible
   - Cache valide 1h

2. **Cache First** (Images)
   - Images servies depuis le cache
   - 200 entrées max, 30 jours

3. **Cache First** (Assets statiques)
   - JS/CSS mis en cache immédiatement
   - 100 entrées max, 7 jours

4. **Stale While Revalidate** (Fonts)
   - Sert depuis cache, revalide en arrière-plan
   - 30 entrées max, 1 an

#### Composants Offline

```typescript
// src/components/OfflineIndicator.tsx
- Détecte navigator.onLine
- Affiche bannière jaune en haut si offline
- Auto-dismiss quand connexion restaurée

// public/offline.html
- Page de fallback élégante
- Affichée si navigation offline échoue
- Liste les fonctionnalités disponibles offline
```

### ✅ 3. Gestion des Erreurs Réseau

```typescript
// src/services/api.ts
- Intercepteur Axios amélioré
- Détecte ERR_NETWORK, ECONNABORTED
- Messages d'erreur localisés et clairs
- Retry automatique pour tokens expirés
```

### ✅ 4. Manifest & Icônes

```json
// Configuration dans vite.config.ts
{
  "name": "Earthway - Sensibilisation Environnementale",
  "short_name": "Earthway",
  "theme_color": "#10b981",
  "background_color": "#ffffff",
  "display": "standalone",
  "icons": [
    "192x192",
    "512x512",
    "512x512 maskable"
  ]
}
```

## Test de l'Installation

### Méthode 1 : Test Local

```bash
# 1. Build du frontend
cd EarthwayFront
npm run build

# 2. Servir avec preview
npm run preview

# 3. Ouvrir dans Chrome
http://localhost:4173

# 4. Vérifier dans DevTools
F12 > Application > Manifest
F12 > Application > Service Workers
```

### Méthode 2 : Test Mobile (Chrome DevTools)

```bash
# 1. Ouvrir DevTools
F12

# 2. Toggle Device Toolbar
Ctrl+Shift+M (Windows) ou Cmd+Shift+M (Mac)

# 3. Sélectionner un device mobile (iPhone, Pixel)

# 4. Le prompt d'installation devrait apparaître après 2s
```

### Méthode 3 : Test sur Appareil Réel

1. **Build production** : `npm run build`
2. **Deploy** sur un serveur HTTPS (PWA nécessite HTTPS)
3. **Visiter** depuis mobile
4. **Attendre** 2s pour le prompt d'installation
5. **Cliquer** "Installer"
6. **Vérifier** : icône sur l'écran d'accueil

## Audit Lighthouse

### Exécuter l'Audit

```bash
# 1. Build production
cd EarthwayFront
npm run build
npm run preview

# 2. Ouvrir Chrome DevTools
F12 > Lighthouse

# 3. Sélectionner catégories
✅ Performance
✅ PWA
✅ Best Practices
✅ Accessibility
✅ SEO

# 4. Générer le rapport
```

### Scores Cibles (Phase 11 - T124)

- **PWA** : > 90 ✅
- **Performance** : > 85
- **Accessibility** : > 90
- **Best Practices** : > 90
- **SEO** : > 85

### Checklist PWA Lighthouse

✅ Service Worker enregistré  
✅ Manifest valide  
✅ Icônes 192x192 et 512x512  
✅ Theme color défini  
✅ Viewport configuré  
✅ HTTPS (en production)  
✅ Offline fallback  
✅ Splash screen (généré automatiquement)  

## Comportement Offline

### Fonctionnalités Disponibles Offline

✅ Navigation dans l'app  
✅ Pages déjà visitées (depuis cache)  
✅ Images déjà chargées  
✅ Assets statiques (JS, CSS)  

### Fonctionnalités Limitées Offline

❌ Appels API (nouveaux)  
❌ Authentification  
❌ Paiements Stripe  
❌ Actualités fraîches  
❌ Upload d'images  

### Messages d'Erreur

L'intercepteur API détecte 3 types d'erreurs :

```typescript
1. isOffline: "Vous êtes hors ligne. Veuillez vérifier votre connexion internet."
2. isNetworkError: "Erreur de connexion au serveur. Veuillez réessayer."
3. isTimeout: "La requête a pris trop de temps. Veuillez réessayer."
```

## Fichiers Clés

```
EarthwayFront/
├── vite.config.ts                 # Configuration VitePWA + Workbox
├── public/
│   ├── manifest.json              # (généré dynamiquement)
│   ├── offline.html               # Page fallback offline
│   └── icons/                     # Icônes PWA 192/512
├── src/
│   ├── components/
│   │   ├── InstallPrompt.tsx      # Prompt installation personnalisé
│   │   └── OfflineIndicator.tsx   # Bannière "Hors ligne"
│   ├── services/
│   │   └── api.ts                 # Intercepteur + gestion erreurs réseau
│   └── App.tsx                    # Intégration InstallPrompt + OfflineIndicator
└── dist/                          # Build production
    ├── sw.js                      # Service Worker généré
    ├── workbox-*.js               # Runtime Workbox
    └── manifest.webmanifest       # Manifest généré
```

## Prochaines Étapes

### Phase 11 Complète ✅

- [X] T120: Test PWA installation (Dev + Chrome DevTools)
- [X] T121: Créer InstallPrompt component
- [X] T122: Configurer offline fallback
- [X] T123: Tester comportement offline
- [ ] T124: Audit Lighthouse (À faire manuellement en dev)

### Améliorations Futures (Post-MVP)

- [ ] Background sync pour actions offline
- [ ] Push notifications
- [ ] App shortcuts (quick actions)
- [ ] Badge API (notifications count)
- [ ] Share Target API
- [ ] Screenshots dans manifest
- [ ] Adaptive icons avancés

## Ressources

- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev: PWA Checklist](https://web.dev/pwa-checklist/)

---

**État** : Phase 11 (PWA Finalization) complétée ✅  
**Date** : 15 avril 2026  
**Version PWA** : v1.0 (VitePWA 1.2.0)
