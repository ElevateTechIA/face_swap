/**
 * Guest Trial Management
 * Tracks guest user trials using localStorage
 */

const GUEST_TRIAL_KEY = 'guest_trial_used';
const GUEST_TRIAL_TIMESTAMP_KEY = 'guest_trial_timestamp';
const TRIAL_EXPIRY_DAYS = 7; // Trial data expires after 7 days

export interface GuestTrialStatus {
  canUseTrial: boolean;
  trialUsed: boolean;
  timestamp?: number;
}

/**
 * Check if guest can use their free trial
 */
export function canUseGuestTrial(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const used = localStorage.getItem(GUEST_TRIAL_KEY);
    const timestamp = localStorage.getItem(GUEST_TRIAL_TIMESTAMP_KEY);

    // If never used, can use trial
    if (!used) return true;

    // Check if trial has expired (reset after TRIAL_EXPIRY_DAYS)
    if (timestamp) {
      const trialDate = parseInt(timestamp);
      const now = Date.now();
      const daysSinceTrialused = (now - trialDate) / (1000 * 60 * 60 * 24);

      // Reset trial if expired
      if (daysSinceTrialused > TRIAL_EXPIRY_DAYS) {
        resetGuestTrial();
        return true;
      }
    }

    return used !== 'true';
  } catch (error) {
    console.error('Error checking guest trial:', error);
    return false;
  }
}

/**
 * Mark guest trial as used
 */
export function markGuestTrialAsUsed(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(GUEST_TRIAL_KEY, 'true');
    localStorage.setItem(GUEST_TRIAL_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error marking guest trial:', error);
  }
}

/**
 * Reset guest trial (for testing or after expiry)
 */
export function resetGuestTrial(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(GUEST_TRIAL_KEY);
    localStorage.removeItem(GUEST_TRIAL_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Error resetting guest trial:', error);
  }
}

/**
 * Get guest trial status
 */
export function getGuestTrialStatus(): GuestTrialStatus {
  if (typeof window === 'undefined') {
    return { canUseTrial: false, trialUsed: false };
  }

  try {
    const used = localStorage.getItem(GUEST_TRIAL_KEY) === 'true';
    const timestamp = localStorage.getItem(GUEST_TRIAL_TIMESTAMP_KEY);

    return {
      canUseTrial: canUseGuestTrial(),
      trialUsed: used,
      timestamp: timestamp ? parseInt(timestamp) : undefined,
    };
  } catch (error) {
    console.error('Error getting guest trial status:', error);
    return { canUseTrial: false, trialUsed: false };
  }
}
