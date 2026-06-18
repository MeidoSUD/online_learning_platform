import React from 'react';
import { router } from '@inertiajs/react';
import WebsiteLayout from '../Layouts/WebsiteLayout';
import { EcosystemView } from '../Components/EcosystemView/EcosystemView';

export default function Ecosystem() {
  return (
    <WebsiteLayout>
      <EcosystemView onSwitchToProfile={() => router.visit('/e-profile')} />
    </WebsiteLayout>
  );
}
