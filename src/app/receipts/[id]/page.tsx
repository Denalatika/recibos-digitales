import React from 'react';
import { ReceiptDetailClient } from './receipt-detail-client';

export function generateStaticParams() {
  return [{ id: 'demo-receipt-syss-001' }, { id: 'preview' }];
}

export default function ReceiptDetailPage({ params }: { params: { id: string } }) {
  return <ReceiptDetailClient id={params.id} />;
}
