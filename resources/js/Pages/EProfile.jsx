import React from 'react';
import WebsiteLayout from '../Layouts/WebsiteLayout';
import { ProfileView as EProfilePage } from '../Components/website/EProfilePage';

export default function EProfile() {
  return (
    <WebsiteLayout>
      <EProfilePage />
    </WebsiteLayout>
  );
}
