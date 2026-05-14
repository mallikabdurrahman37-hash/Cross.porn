// ===========================
// history.js — Watch History
// ===========================

import { db } from './firebase.js';
import {
  collection, doc, setDoc, getDocs,
  deleteDoc, query, orderBy, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ---- Save video to history ----
export async function saveHistory(userId, video) {
  if (!userId || !video?.id) return;
  try {
    const ref = doc(db, 'users', userId, 'history', video.id);
    await setDoc(ref, {
      videoId:   video.id,
      title:     video.title     || 'Untitled',
      thumbnail: video.thumbnail || '',
      url:       video.url       || '',
      watchedAt: serverTimestamp()
    });
  } catch (e) {
    console.error('saveHistory error:', e);
  }
}

// ---- Fetch user history ----
export async function fetchHistory(userId) {
  if (!userId) return [];
  try {
    const histRef = collection(db, 'users', userId, 'history');
    const q       = query(histRef, orderBy('watchedAt', 'desc'));
    const snap    = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('fetchHistory error:', e);
    return [];
  }
}

// ---- Delete single history item ----
export async function deleteHistoryItem(userId, videoId) {
  if (!userId || !videoId) return;
  try {
    await deleteDoc(doc(db, 'users', userId, 'history', videoId));
  } catch (e) {
    console.error('deleteHistoryItem error:', e);
  }
}

// ---- Clear all history ----
export async function clearHistory(userId) {
  if (!userId) return;
  try {
    const histRef = collection(db, 'users', userId, 'history');
    const snap    = await getDocs(histRef);
    const deletes = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletes);
  } catch (e) {
    console.error('clearHistory error:', e);
  }
}
