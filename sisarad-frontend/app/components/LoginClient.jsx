"use client";
import React from 'react';
import dynamic from 'next/dynamic';

const Login = dynamic(() => import('../sections/login/page'), { ssr: false });

export default function LoginClient() {
  return <Login />;
}
