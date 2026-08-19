import React from 'react';
import { ValidateClient } from './validate-client';

export function generateStaticParams() {
  return [{ code: 'SYSS-9Q7R-DEMO' }, { code: 'preview' }];
}

export default function ValidateReceiptPublicPage({ params }: { params: { code: string } }) {
  return <ValidateClient code={params.code} />;
}
