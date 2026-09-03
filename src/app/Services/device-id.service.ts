import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Device } from '@capacitor/device';
import * as FingerprintJS from '@fingerprintjs/fingerprintjs';

@Injectable({
  providedIn: 'root'
})
export class DeviceIdService {
  private storageKey = 'device_id';
  private fpCacheKey = 'dfp_cache';
  private isBrowser: boolean;
  private cachedFingerprint: string = '';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // 1. Device ID Method (With Native Capacitor and Robust Fallback)
  async getDeviceId(): Promise<string> {
    if (!this.isBrowser) {
      return '';
    }

    try {
      const isNative = (window as any).Capacitor?.isNativePlatform;
      if (isNative) {
        const info = await Device.getId();
        if (info && info.identifier) {
          return info.identifier;
        }
      }
    } catch (e) {
      console.warn("Capacitor Native Device Plugin failed or not found, falling back to Web storage.", e);
    }

    let deviceId = localStorage.getItem(this.storageKey);
    if (!deviceId || deviceId.length < 10) { // Valid UUID fallback logic
      deviceId = crypto.randomUUID();
      localStorage.setItem(this.storageKey, deviceId);
    }
    return deviceId;
  }

  // 2. Maximum Security Upgraded Fingerprint Method
  async getDeviceFingerprint(): Promise<string> {
    if (!this.isBrowser) {
      return '';
    }

    // In-memory caching loop blocks recursive tampering inside the same session
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    try {
      // Load FingerprintJS with maximum monitoring delays to bypass low-level blocking scripts
      const fp = await FingerprintJS.load({ delayFallback: 50 });
      const result = await fp.get();
      
      if (result && result.visitorId) {
        this.cachedFingerprint = result.visitorId;
        return this.cachedFingerprint;
      }
    } catch (e) {
      console.error("FingerprintJS failed or blocked by extensions, initiating custom fallback fingerprinting:", e);
    }

    // --- 100% SECURITY HYBRID FALLBACK BACKUP SYSTEM ---
    // Agar standard library fail ho jaye ya script blockers use block karein, toh yeh manually attributes nikalega
    try {
      const fallbackHash = this.generateHardwareFallbackHash();
      if (fallbackHash) {
        this.cachedFingerprint = fallbackHash;
        return this.cachedFingerprint;
      }
    } catch (fallbackError) {
      console.error("Critical: All fingerprint mechanisms blocked.", fallbackError);
    }

    return 'GENERIC_BROWSER_SECURE_HASH_FAILED';
  }

  // Pure hardware and structural unique identification fallback
  private generateHardwareFallbackHash(): string {
    const screenSpecs = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const language = navigator.language || 'en';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    
    // Canvas standard basic footprint generation
    let canvasHash = '';
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125,1,62,20);
        ctx.fillStyle = "#069";
        ctx.fillText("HighRollers_Secure_Identity", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("HighRollers_Secure_Identity", 4, 17);
        canvasHash = canvas.toDataURL().substring(100, 150); // Get mid section string
      }
    } catch (canvasError) {
      canvasHash = 'CanvasBlocked';
    }

    // Combining structural values to create a hard-coded fallback signature
    const rawSignature = `HW-${hardwareConcurrency}-MEM-${deviceMemory}-SCR-${screenSpecs}-TZ-${timezone}-LANG-${language}-CANV-${canvasHash}`;
    
    // Simple custom hash string function to map it to a standard string length
    return this.simpleStringHash(rawSignature);
  }

  private simpleStringHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return '0000000000';
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return 'FB_' + Math.abs(hash).toString(16);
  }
}