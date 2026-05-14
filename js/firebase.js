// ===========================
// firebase.js — Firebase Init
// Cross.porn
// ===========================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore }   from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth }        from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const firebaseConfig = {
  apiKey:            "AIzaSyAiEg_1Mc-055L7gf4bKxAquZDc5TsuU7s",
  authDomain:        "crossporn.firebaseapp.com",
  projectId:         "crossporn",
  storageBucket:     "crossporn.firebasestorage.app",
  messagingSenderId: "216735942885",
  appId:             "1:216735942885:web:38387741c65f26e065ac0c",
  measurementId:     "G-6RVT2VT2XR"
};

const app = initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);
export default app;
