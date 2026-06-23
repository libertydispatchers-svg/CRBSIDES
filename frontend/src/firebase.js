import { initializeApp } from 'firebase/app';
import * as firestore from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// ----------------------------------------------------
// LOCAL WORKSPACE TESTING CONFIG
// Set to false to use the official Cloud Firebase connection.
// ----------------------------------------------------
const USE_LOCAL_MOCK = false;

const firebaseConfig = {
  apiKey: "AIzaSyA1rtHWGNu59FoiFLccRFM08y9lz6-6WRE",
  authDomain: "curbside-35431.firebaseapp.com",
  projectId: "curbside-35431",
  storageBucket: "curbside-35431.firebasestorage.app",
  messagingSenderId: "1065385279859",
  appId: "1:1065385279859:web:c6c150379fe7f569c34506"
};

// 1. Initialize Real SDK
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
export { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber };

let dbSdk = null;
let functionsSdk = null;

if (!USE_LOCAL_MOCK) {
  dbSdk = firestore.getFirestore(app);
  functionsSdk = getFunctions(app);

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    firestore.connectFirestoreEmulator(dbSdk, '127.0.0.1', 8080);
    connectFunctionsEmulator(functionsSdk, '127.0.0.1', 5001);
  }
}

// 2. Local Mock Layer implementation
const dbMock = {};

const collectionMock = (db, name) => ({ name });
const docMock = (db, name, id) => ({ name, id });

const addDocMock = async (collRef, data) => {
  const res = await fetch(`/api/${collRef.name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const saved = await res.json();
  return { id: saved.id };
};

const updateDocMock = async (docRef, data) => {
  await fetch(`/api/${docRef.name}/${docRef.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

const onSnapshotMock = (queryRef, callback) => {
  const poll = async () => {
    try {
      const res = await fetch(`/api/${queryRef.name}`);
      if (!res.ok) throw new Error("API responded with error");
      const data = await res.json();
      const docs = data.map(item => ({
        id: item.id,
        data: () => item
      }));
      callback({ docs });
    } catch (err) {
      console.error("Mock polling failed:", err);
    }
  };
  
  poll();
  const intervalId = setInterval(poll, 1500);
  return () => clearInterval(intervalId);
};

const runTransactionMock = async (db, transactionCallback) => {
  const transaction = {
    get: async (ref) => {
      const res = await fetch(`/api/${ref.name}/${ref.id}`);
      const item = await res.json();
      return {
        exists: () => !!item,
        data: () => item
      };
    },
    update: async (ref, data) => {
      const res = await fetch(`/api/${ref.name}/${ref.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.status === 409) {
        const errData = await res.json();
        throw new Error(errData.error || 'Claiming conflict occurred.');
      }
    }
  };
  await transactionCallback(transaction);
};

const queryMock = (collRef) => collRef;
const whereMock = () => ({ type: 'where' });
const orderByMock = () => ({ type: 'orderBy' });

// 3. Static Wrappers Exports (100% Compile-Safe)
export const db = USE_LOCAL_MOCK ? dbMock : dbSdk;

export const collection = (dbRef, name) => {
  if (USE_LOCAL_MOCK) return collectionMock(dbRef, name);
  return firestore.collection(dbRef, name);
};

export const doc = (dbRef, name, id) => {
  if (USE_LOCAL_MOCK) return docMock(dbRef, name, id);
  return firestore.doc(dbRef, name, id);
};

export const addDoc = (collRef, data) => {
  if (USE_LOCAL_MOCK) return addDocMock(collRef, data);
  return firestore.addDoc(collRef, data);
};

export const updateDoc = (docRef, data) => {
  if (USE_LOCAL_MOCK) return updateDocMock(docRef, data);
  return firestore.updateDoc(docRef, data);
};

export const onSnapshot = (queryRef, callback) => {
  if (USE_LOCAL_MOCK) return onSnapshotMock(queryRef, callback);
  return firestore.onSnapshot(queryRef, callback);
};

export const runTransaction = (dbRef, transactionCallback) => {
  if (USE_LOCAL_MOCK) return runTransactionMock(dbRef, transactionCallback);
  return firestore.runTransaction(dbRef, transactionCallback);
};

export const query = (collRef, ...constraints) => {
  if (USE_LOCAL_MOCK) return queryMock(collRef);
  return firestore.query(collRef, ...constraints);
};

export const where = (field, op, value) => {
  if (USE_LOCAL_MOCK) return whereMock(field, op, value);
  return firestore.where(field, op, value);
};

export const orderBy = (field, dir) => {
  if (USE_LOCAL_MOCK) return orderByMock(field, dir);
  return firestore.orderBy(field, dir);
};

export const setDoc = (docRef, data) => {
  if (USE_LOCAL_MOCK) return Promise.resolve(); // Not mock-implemented yet
  return firestore.setDoc(docRef, data);
};

export const getDoc = (docRef) => {
  if (USE_LOCAL_MOCK) return Promise.resolve({ exists: () => false, data: () => ({}) });
  return firestore.getDoc(docRef);
};

export const Timestamp = firestore.Timestamp;
export const serverTimestamp = firestore.serverTimestamp;
