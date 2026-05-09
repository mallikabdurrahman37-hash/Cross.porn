# Cross.porn — Premium Media Gallery

## Project Structure

```
crossporn/
├── index.html          # Homepage
├── profile.html        # User profile & watch history
├── admin.html          # Admin panel
├── css/
│   ├── style.css       # Core styles & layout
│   ├── glass.css       # Glassmorphism effects
│   ├── animations.css  # All animations
│   ├── responsive.css  # Mobile-first responsive
│   └── splash.css      # Loading splash screen
├── js/
│   ├── firebase.js     # Firebase initialization
│   ├── auth.js         # Authentication (login/register/logout)
│   ├── app.js          # Main homepage logic
│   ├── videos.js       # Video CRUD & pagination
│   ├── tags.js         # Tag management
│   ├── search.js       # Search logic
│   ├── pagination.js   # Pagination renderer
│   ├── profile.js      # Profile page logic
│   ├── admin.js        # Admin panel logic
│   ├── history.js      # Watch history
│   └── ui.js           # UI utilities & helpers
└── assets/
    ├── logo.png        # Circular logo (replace with your logo)
    ├── bg.png          # Background image (replace with your image)
    └── load_splash.png # Splash screen logo (replace with your image)
```

## Setup

### 1. Assets
Replace the placeholder assets:
- `assets/logo.png` — Your circular logo (recommended: 200×200px)
- `assets/bg.png` — Your background image (recommended: 1920×1080px or larger)
- `assets/load_splash.png` — Splash screen logo (recommended: 300×300px)

### 2. Firebase Setup
The Firebase config is already embedded in `js/firebase.js`.

In Firebase Console, configure:
1. **Authentication** → Enable Email/Password provider
2. **Firestore** → Create database in production mode
3. **Firestore Rules** — Apply these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Videos — public read, admin write
    match /videos/{doc} {
      allow read: if true;
      allow write: if request.auth.token.email == 'mallikabdurrahman37@gmail.com';
    }

    // Tags — public read, admin write
    match /site_tags/{doc} {
      allow read: if true;
      allow write: if request.auth.token.email == 'mallikabdurrahman37@gmail.com';
    }

    // Users — read own, write own; admin reads all
    match /users/{userId} {
      allow read: if request.auth.uid == userId
                  || request.auth.token.email == 'mallikabdurrahman37@gmail.com';
      allow write: if request.auth.uid == userId
                   || request.auth.token.email == 'mallikabdurrahman37@gmail.com';

      match /history/{item} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    // Banned users — admin only write, read for auth check
    match /banned_users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.email == 'mallikabdurrahman37@gmail.com';
    }
  }
}
```

### 3. GitHub Pages Deployment
1. Push all files to a GitHub repository
2. Go to Settings → Pages → Source: main branch / root
3. Your site will be live at `https://<username>.github.io/<repo>/`

> **Note:** All JS files use ES modules (`type="module"`). GitHub Pages serves them correctly.

### 4. Admin Access
Login with `mallikabdurrahman37@gmail.com` — the admin panel link appears automatically in the side menu.

## Features
- 🎬 Video gallery with lazy loading & Firestore pagination (15/page)
- 🔍 Real-time search by title, hashtags, tags
- 🏷 Dynamic tags from Firestore (`/site_tags/active_tags`)
- 🔐 Firebase Auth (email/password) with ban system
- 👤 User profiles with emoji avatars & watch history
- ⚙️ Full admin panel: add/delete videos, manage tags, ban/unban users, analytics
- 🌐 Metadata auto-fetch via Microlink API
- 📱 Mobile-first responsive design
- ✨ Glassmorphism UI (blur: 5px, rgba backgrounds)
- 🔞 Age gate (shown every session)

## Firestore Collections
| Collection | Purpose |
|---|---|
| `/videos` | Video documents |
| `/site_tags/active_tags` | Tag list array |
| `/users/{uid}` | User profiles |
| `/users/{uid}/history` | Watch history subcollection |
| `/banned_users/{uid}` | Banned user records |
