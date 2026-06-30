import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Client Firebase configuration loaded dynamically or hardcoded from firebase-applet-config
const firebaseConfig = {
  projectId: "linen-fuze-fkhb0",
  appId: "1:736240737663:web:adf87dfe8f771bcd724e4a",
  apiKey: "AIzaSyD_Os0SHPenjmEnScFIhL-GPZMcwlC3SCY",
  authDomain: "linen-fuze-fkhb0.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-aiproductivityco-b838e12a-63ec-4dd3-8b12-06f75a13997d",
  storageBucket: "linen-fuze-fkhb0.firebasestorage.app",
  messagingSenderId: "736240737663"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
