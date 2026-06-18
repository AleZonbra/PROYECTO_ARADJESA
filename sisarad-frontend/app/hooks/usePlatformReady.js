"use client";

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export default function usePlatformReady() {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    try {
      const native = typeof Capacitor !== 'undefined' && (Capacitor.isNativePlatform && Capacitor.isNativePlatform());
      setIsNative(Boolean(native));
    } catch (e) {
      setIsNative(false);
    }
  }, []);

  return { isNative };
}
