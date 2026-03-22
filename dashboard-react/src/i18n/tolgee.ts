/**
 * Tolgee configuration
 *
 * Tolgee provides string translations with in-context editing support.
 * In development (with VITE_TOLGEE_API_KEY set) the in-context editor
 * is enabled; in production it is omitted and only the bundled locale
 * files are used.
 */
import { Tolgee, DevTools, FormatSimple } from '@tolgee/web';
import en from './locales/en.json';

export const tolgee = Tolgee()
  .use(FormatSimple())
  .use(DevTools())
  .init({
    language: 'en',

    // API credentials for in-context editing (dev only)
    apiUrl: import.meta.env['VITE_TOLGEE_API_URL'],
    apiKey: import.meta.env['VITE_TOLGEE_API_KEY'],

    // Bundled static translations (used in production)
    staticData: {
      en,
    },
  });
