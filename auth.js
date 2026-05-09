// ===========================
// auth.js — Authentication
// ===========================

import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc, setDoc, getDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const ADMIN_EMAIL = 'mallikabdurrahman37@gmail.com';

// ---- Current user state ----
export let currentUser = null;
export let isAdmin     = false;

const authStateCallbacks = [];

export function onUserChange(cb) {
  authStateCallbacks.push(cb);
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  isAdmin = !!(user && user.email === ADMIN_EMAIL);

  if (user) {
    // Check ban status
    const banRef  = doc(db, 'banned_users', user.uid);
    const banSnap = await getDoc(banRef);
    if (banSnap.exists()) {
      await signOut(auth);
      alert('🚫 Your account has been banned.');
      currentUser = null;
      isAdmin = false;
    }
  }

  authStateCallbacks.forEach(cb => cb(currentUser, isAdmin));
});

// ---- Register ----
export async function register({ username, email, password, mobile }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid  = cred.user.uid;

  await setDoc(doc(db, 'users', uid), {
    uid,
    username: username || 'Anonymous',
    email,
    mobile:   mobile || '',
    avatar:   '😊',
    createdAt: serverTimestamp()
  });

  return cred.user;
}

// ---- Login ----
export async function login({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ---- Logout ----
export async function logout() {
  await signOut(auth);
}

// ---- Get user profile ----
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}
