// delete_all_users.js
// This script deletes all users from Firebase Authentication and removes their related Firestore data.
// Run with Node.js in the project root: `node scripts/delete_all_users.js`

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');

// Initialize Firebase Admin SDK using the service account key
const serviceAccount = require(path.resolve(__dirname, '../service-account.json'));
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();

async function deleteUserData(uid) {
  try {
    const userDocRef = db.collection('users').doc(uid);
    const doc = await userDocRef.get();
    if (doc.exists) {
      await userDocRef.delete();
      console.log(`Deleted Firestore document for user ${uid}`);
    }
  } catch (err) {
    console.error(`Error cleaning Firestore data for ${uid}:`, err);
  }
}

async function listAndDeleteAllUsers(nextPageToken) {
  try {
    const result = await auth.listUsers(1000, nextPageToken);
    const deletePromises = result.users.map(async (userRecord) => {
      const uid = userRecord.uid;
      await auth.deleteUser(uid);
      console.log(`Deleted Auth user ${uid}`);
      await deleteUserData(uid);
    });
    await Promise.all(deletePromises);
    if (result.pageToken) {
      await listAndDeleteAllUsers(result.pageToken);
    }
  } catch (error) {
    console.error('Error deleting users:', error);
  }
}

(async () => {
  console.log('Starting deletion of all Firebase Auth users...');
  await listAndDeleteAllUsers();
  console.log('All users have been deleted.');
  process.exit(0);
})();
