import React from 'react';
import { ShareClient } from './share-client';

export function generateStaticParams() {
  return [{ token: 'demo-token' }, { token: 'preview' }];
}

export default function SharedReceiptPublicPage({ params }: { params: { token: string } }) {
  return <ShareClient token={params.token} />;
}
