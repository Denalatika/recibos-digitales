import React from 'react';
import { ReceiptDetailClient } from './receipt-detail-client';

export default function ReceiptDetailPage({ params }: { params: { id: string } }) {
  return <ReceiptDetailClient id={params.id} />;
}
