"use client";
import dynamic from 'next/dynamic';
const LoginClient = dynamic(() => import('./index'), { ssr: false });

export default function LoginClientWrapper() {
  return <LoginClient />;
}
