import React from 'react';
import { Metadata } from 'next';
import { ValidateClient } from './validate-client';

export const metadata: Metadata = {
  title: 'Validación de Comprobante • ReciboDigital',
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

export default function ValidateReceiptPublicPage({ params }: { params: { code: string } }) {
  return <ValidateClient code={params.code} />;
}
