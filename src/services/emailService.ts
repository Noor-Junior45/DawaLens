import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Dispatches an email alert using the backend SMTP nodemailer server route
 * and records a copy of the message in the Firestore 'mail' collection to populate the mailbox history.
 */
export async function sendEmailAlert(params: EmailParams): Promise<{ success: boolean; simulated?: boolean; message?: string }> {
  try {
    // 1. Call our custom Express nodemailer API
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Save copy in Firestore 'mail' collection so the mailbox inbox history updates in real-time
      try {
        await addDoc(collection(db, 'mail'), {
          to: params.to,
          message: {
            subject: params.subject,
            text: params.text,
            html: params.html
          },
          timestamp: serverTimestamp(),
          status: {
            state: data.simulated ? 'SIMULATED' : 'SUCCESS',
            updatedAt: Date.now()
          }
        });
      } catch (firestoreErr) {
        console.warn('[EMAIL SERVICE] Optional Firestore backup copy skipped:', firestoreErr);
      }
      
      return data;
    } else {
      const errText = await response.text();
      throw new Error(errText || 'SMTP server returned an error');
    }
  } catch (error: any) {
    console.warn('[EMAIL SERVICE] SMTP API failed, attempting direct Firestore collection write fallback:', error);
    
    // 2. Direct Firestore fallback in case the backend is unreachable or building
    try {
      await addDoc(collection(db, 'mail'), {
        to: params.to,
        message: {
          subject: params.subject,
          text: params.text,
          html: params.html
        },
        timestamp: serverTimestamp()
      });
      return { success: true, message: "Dispatched to Firestore collection" };
    } catch (fallbackError: any) {
      console.error('[EMAIL SERVICE] Firestore fallback also failed:', fallbackError);
      throw new Error(`Email transmission failed: ${error.message || error}`);
    }
  }
}
