// ===========================
// videos.js — Video CRUD & Pagination
// ===========================

import { db } from './firebase.js';
import {
  collection, query, orderBy, limit,
  startAfter, getDocs, doc, deleteDoc,
  addDoc, updateDoc, increment, serverTimestamp,
  where, getCountFromServer
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const VIDEOS_PER_PAGE = 15;
const videosRef = () => collection(db, 'videos');

// ---- Fetch a page of videos ----
export async function fetchVideos({ tag = 'all', lastDoc = null, searchQuery = '' } = {}) {
  let q;

  if (searchQuery) {
    // Client-side search from full collection (Firestore doesn't support full-text)
    q = query(videosRef(), orderBy('createdAt', 'desc'), limit(200));
  } else if (tag && tag !== 'all') {
    q = lastDoc
      ? query(videosRef(), where('tags', 'array-contains', tag), orderBy('createdAt', 'desc'), limit(VIDEOS_PER_PAGE), startAfter(lastDoc))
      : query(videosRef(), where('tags', 'array-contains', tag), orderBy('createdAt', 'desc'), limit(VIDEOS_PER_PAGE));
  } else {
    q = lastDoc
      ? query(videosRef(), orderBy('createdAt', 'desc'), limit(VIDEOS_PER_PAGE), startAfter(lastDoc))
      : query(videosRef(), orderBy('createdAt', 'desc'), limit(VIDEOS_PER_PAGE));
  }

  const snap = await getDocs(q);
  let videos = snap.docs.map(d => ({ id: d.id, ...d.data(), _doc: d }));

  // Client-side search filter
  if (searchQuery) {
    const q2 = searchQuery.toLowerCase();
    videos = videos.filter(v => {
      const title    = (v.title    || '').toLowerCase();
      const hashtags = (v.hashtags || '').toLowerCase();
      const tags     = (v.tags     || []).join(' ').toLowerCase();
      return title.includes(q2) || hashtags.includes(q2) || tags.includes(q2);
    });
  }

  const lastVisible = snap.docs[snap.docs.length - 1] || null;
  return { videos, lastVisible, hasMore: snap.docs.length === VIDEOS_PER_PAGE };
}

// ---- Get total video count ----
export async function getVideoCount() {
  const snap = await getCountFromServer(videosRef());
  return snap.data().count;
}

// ---- Add video ----
export async function addVideo({ url, title, thumbnail, hashtags, tags }) {
  return await addDoc(videosRef(), {
    url,
    title:     title     || 'Untitled',
    thumbnail: thumbnail || '',
    hashtags:  hashtags  || '',
    tags:      tags      || [],
    views:     0,
    clicks:    0,
    createdAt: serverTimestamp()
  });
}

// ---- Delete video ----
export async function deleteVideo(videoId) {
  await deleteDoc(doc(db, 'videos', videoId));
}

// ---- Increment view/click ----
export async function incrementVideoStat(videoId, stat = 'views') {
  await updateDoc(doc(db, 'videos', videoId), {
    [stat]: increment(1)
  });
}

// ---- Fetch all videos for admin ----
export async function fetchAllVideos({ lastDoc = null } = {}) {
  const q = lastDoc
    ? query(videosRef(), orderBy('createdAt', 'desc'), limit(20), startAfter(lastDoc))
    : query(videosRef(), orderBy('createdAt', 'desc'), limit(20));

  const snap = await getDocs(q);
  const videos = snap.docs.map(d => ({ id: d.id, ...d.data(), _doc: d }));
  const lastVisible = snap.docs[snap.docs.length - 1] || null;
  return { videos, lastVisible, hasMore: snap.docs.length === 20 };
}
