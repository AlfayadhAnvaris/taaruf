"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import ReviewKesanPage from '@/components/dashboard/ReviewKesanPage';

export default function Page() {
  const params = useParams();
  const userId = params.userId;

  return <ReviewKesanPage userId={userId} />;
}
