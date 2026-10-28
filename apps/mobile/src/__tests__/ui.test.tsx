import { fireEvent, render, screen } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';
import { onlineManager } from '@tanstack/react-query';

import AccountScreen from '@/app/(tabs)/account';
import { useSettingsStore } from '@/features/settings/settingsStore';
import i18n from '@/i18n';
import { Banner } from '@/ui/Banner';
import { Chip } from '@/ui/Chip';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'ar' }] }));

async function renderAccount() {
  return await render(
    <I18nextProvider i18n={i18n}>
      <AccountScreen />
    </I18nextProvider>,
  );
}

beforeEach(async () => {
  useSettingsStore.setState({ locale: 'ar' });
  await i18n.changeLanguage('ar');
  onlineManager.setOnline(true);
});

describe('Banner', () => {
  it('exposes the message with a status role', async () => {
    await render(<Banner kind="warn" message="offline!" />);
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('offline!')).toBeTruthy();
  });
});

describe('Chip', () => {
  it('reports selected state and fires onPress', async () => {
    const onPress = jest.fn();
    await render(<Chip label="English" selected onPress={onPress} />);
    const chip = screen.getByRole('radio', { name: 'English' });
    expect(chip.props.accessibilityState).toMatchObject({ selected: true });
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('AccountScreen', () => {
  it('renders Arabic strings by default', async () => {
    await renderAccount();
    expect(screen.getByText('اللغة')).toBeTruthy();
    expect(screen.getByText('متصل')).toBeTruthy();
  });

  it('switches to English when the English chip is pressed', async () => {
    await renderAccount();
    await fireEvent.press(screen.getByRole('radio', { name: 'English' }));
    expect(await screen.findByText('Language')).toBeTruthy();
    expect(useSettingsStore.getState().locale).toBe('en');
  });

  it('shows the offline banner and offline status when the network is down', async () => {
    onlineManager.setOnline(false);
    await renderAccount();
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.getByText(/سلتك محفوظة/)).toBeTruthy();
    expect(screen.getByText('غير متصل')).toBeTruthy();
  });
});
