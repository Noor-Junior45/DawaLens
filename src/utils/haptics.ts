import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Triggers a light vibration / touch haptic for button clicks, like the 'Scan' button. This improves tactile feedback.
 */
export async function triggerLightHaptic(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (error) {
    // Fallback to standard browser vibration API if Capacitor is not present/running in web preview
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch (e) {
        // Ignored if browser blocks automatic vibration (needs user interaction gesture which we are inside)
      }
    }
  }
}

/**
 * Triggers a successful notification vibration pattern for successfully completed tasks,
 * such as marking medicine as taken, reducing dosage quantity, or completing scan.
 */
export async function triggerSuccessHaptic(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (error) {
    // Fallback to standard browser vibration API (double-pulse vibration pattern: 50ms pulse, 40ms pause, 100ms pulse)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([50, 40, 100]);
      } catch (e) {
        // Ignored if browser blocks
      }
    }
  }
}
