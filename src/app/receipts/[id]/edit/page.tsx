import React from 'react';
import { ReceiptEditClient } from './receipt-edit-client';

export default function EditReceiptPage({ params }: { params: { id: string } }) {
  return <ReceiptEditClient id={params.id} />;
}
