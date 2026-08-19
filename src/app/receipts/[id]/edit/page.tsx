import React from 'react';
import { ReceiptEditClient } from './receipt-edit-client';

export function generateStaticParams() {
  return [{ id: 'demo-receipt-syss-001' }, { id: 'preview' }];
}

export default function EditReceiptPage({ params }: { params: { id: string } }) {
  return <ReceiptEditClient id={params.id} />;
}
