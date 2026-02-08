#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// reset-firebase.mjs
// Clears ALL data from Firestore (analyses, glossary) and Firebase Storage.
// Run from the frontend folder:  node utility/reset-firebase.mjs
// ═══════════════════════════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  listAll,
  deleteObject,
} from "firebase/storage";

// ── Firebase Config ──────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDOiDbcWPbKmVQJ5m7brYm0LYPRvOkb_uY",
  authDomain: "documentworthanalyser.firebaseapp.com",
  projectId: "documentworthanalyser",
  storageBucket: "documentworthanalyser.firebasestorage.app",
  messagingSenderId: "831032268912",
  appId: "1:831032268912:web:00f9914b3c6680762cfcb5",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ── Helpers ──────────────────────────────────────────────────────────────

async function deleteCollection(collectionName) {
  console.log(`\n🗑  Deleting collection: ${collectionName}`);
  const snap = await getDocs(collection(db, collectionName));
  let count = 0;

  for (const docSnap of snap.docs) {
    // If it's "analyses", also delete the "comments" sub-collection
    if (collectionName === "analyses") {
      const commentSnap = await getDocs(
        collection(db, "analyses", docSnap.id, "comments")
      );
      for (const commentDoc of commentSnap.docs) {
        await deleteDoc(doc(db, "analyses", docSnap.id, "comments", commentDoc.id));
      }
      if (commentSnap.size > 0) {
        console.log(`   └─ Deleted ${commentSnap.size} comments from ${docSnap.id}`);
      }
    }

    await deleteDoc(doc(db, collectionName, docSnap.id));
    count++;
  }

  console.log(`   ✓ Deleted ${count} documents from "${collectionName}"`);
}

async function deleteAllStorage() {
  console.log(`\n🗑  Deleting all files from Storage (uploads/)...`);
  const uploadsRef = ref(storage, "uploads");

  let totalDeleted = 0;

  try {
    const result = await listAll(uploadsRef);

    // Delete files directly in uploads/
    for (const item of result.items) {
      await deleteObject(item);
      totalDeleted++;
    }

    // Delete files in subfolders (uploads/{analysisId}/...)
    for (const folderRef of result.prefixes) {
      const folderContents = await listAll(folderRef);
      for (const item of folderContents.items) {
        await deleteObject(item);
        totalDeleted++;
      }
    }
  } catch (err) {
    if (err.code === "storage/object-not-found") {
      console.log("   (No uploads folder found — already clean)");
      return;
    }
    throw err;
  }

  console.log(`   ✓ Deleted ${totalDeleted} files from Storage`);
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("══════════════════════════════════════════════");
  console.log("  Firebase Reset — DocumentWorthAnalyser");
  console.log("══════════════════════════════════════════════");

  // 1. Clear Firestore collections
  await deleteCollection("analyses");
  await deleteCollection("glossary");

  // 2. Clear Storage
  await deleteAllStorage();

  console.log("\n══════════════════════════════════════════════");
  console.log("  ✓ All done — database and storage are clean");
  console.log("══════════════════════════════════════════════\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Reset failed:", err);
  process.exit(1);
});
