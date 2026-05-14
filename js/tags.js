// ===========================
// tags.js — Tag Management
// ===========================

import { db } from './firebase.js';
import {
  doc, getDoc, setDoc, updateDoc,
  arrayUnion, arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const TAGS_DOC = () => doc(db, 'site_tags', 'active_tags');

// ---- Fetch active tags ----
export async function fetchTags() {
  try {
    const snap = await getDoc(TAGS_DOC());
    if (snap.exists()) {
      return snap.data().tags || [];
    }
    return [];
  } catch (e) {
    console.error('fetchTags error:', e);
    return [];
  }
}

// ---- Add a tag ----
export async function addTag(tag) {
  const clean = tag.trim().toUpperCase();
  if (!clean) return;
  try {
    const snap = await getDoc(TAGS_DOC());
    if (snap.exists()) {
      await updateDoc(TAGS_DOC(), { tags: arrayUnion(clean) });
    } else {
      await setDoc(TAGS_DOC(), { tags: [clean] });
    }
  } catch (e) {
    console.error('addTag error:', e);
    throw e;
  }
}

// ---- Remove a tag ----
export async function removeTag(tag) {
  try {
    await updateDoc(TAGS_DOC(), { tags: arrayRemove(tag) });
  } catch (e) {
    console.error('removeTag error:', e);
    throw e;
  }
}

// ---- Get tag count ----
export async function getTagCount() {
  const tags = await fetchTags();
  return tags.length;
}
