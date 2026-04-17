/**
 * Biometric authentication helper.
 * Returns { success, error } — never throws.
 */
import * as LocalAuthentication from "expo-local-authentication";

export async function isBiometricAvailable() {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function authenticateWithBiometrics(reason = "Confirm your identity") {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: "Use passcode",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    return result; // { success: boolean, error?: string }
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
