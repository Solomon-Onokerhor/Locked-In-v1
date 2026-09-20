import type { Metadata } from 'next';
import { SoloClient } from './SoloClient';

export const metadata: Metadata = {
    title: 'Go Solo | Deep Focus Timer | Locked In',
    description: 'Enter deep focus mode. A distraction-free study timer for UMaT students.',
};

export default function SoloPage() {
    return <SoloClient />;
}
