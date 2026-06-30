import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false,
}, firebaseConfig.firestoreDatabaseId);

export async function getChatCount(userId: string, date: string): Promise<number> {
  try {
    const docRef = doc(db, 'server_chat_limits', `${userId}_${date}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().count || 0;
    }
  } catch (error) {
    console.error("Error in getChatCount:", error);
  }
  return 0;
}

export async function incrementChatCount(userId: string, date: string): Promise<void> {
  try {
    const docRef = doc(db, 'server_chat_limits', `${userId}_${date}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentCount = docSnap.data().count || 0;
      await setDoc(docRef, { count: currentCount + 1, updated_at: new Date().toISOString() });
    } else {
      await setDoc(docRef, { count: 1, updated_at: new Date().toISOString() });
    }
  } catch (error) {
    console.error("Error in incrementChatCount:", error);
  }
}

export async function getCachedMedicine(name: string): Promise<any> {
  try {
    const docRef = doc(db, 'medicine_cache', name.toLowerCase().trim());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.error("Error in getCachedMedicine:", error);
  }
  return null;
}

export async function setCachedMedicine(
  name: string,
  dosage: string,
  instructions: string,
  schedule: string,
  form: string
): Promise<void> {
  try {
    const docRef = doc(db, 'medicine_cache', name.toLowerCase().trim());
    await setDoc(docRef, {
      name,
      dosage,
      instructions,
      schedule,
      form,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in setCachedMedicine:", error);
  }
}

export async function getExtractionData(hash: string): Promise<any> {
  try {
    const docRef = doc(db, 'extraction_cache', hash);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.error("Error in getExtractionData:", error);
  }
  return null;
}

export async function setExtractionData(hash: string, data: string): Promise<void> {
  try {
    const docRef = doc(db, 'extraction_cache', hash);
    await setDoc(docRef, {
      data,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in setExtractionData:", error);
  }
}

export async function getUserMedicines(userId: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'medicines'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error in getUserMedicines:", error);
    return [];
  }
}
