import { useTranslation } from 'react-i18next';

import { useIsOnline } from '@/lib/network';
import { Banner } from './Banner';

export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useIsOnline();
  if (online) return null;
  return <Banner kind="warn" message={t('offline.banner')} />;
}
