import React from 'react';
import { Metadata } from 'next';
import { ShareClient } from './share-client';

export const metadata: Metadata = {
  title: 'Comprobante Compartido • ReciboDigital',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function SharedReceiptPublicPage({ params }: { params: { token: string } }) {
  return <ShareClient token={params.token} />;
}
