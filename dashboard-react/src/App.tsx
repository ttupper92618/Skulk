/**
 * App
 *
 * Root component. Composes the provider stack:
 *   TolgeeProvider → ThemeProvider → GlobalStyles → HashRouter → Routes
 *
 * Provider order matters:
 * - TolgeeProvider must be outermost so all children can call useTranslate()
 * - ThemeProvider must wrap all styled-components
 * - GlobalStyles is injected inside ThemeProvider to access theme tokens
 * - HashRouter wraps all routing concerns
 */
import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { TolgeeProvider } from '@tolgee/react';
import { theme } from './theme/theme';
import { GlobalStyles } from './theme/globalStyles';
import { tolgee } from './i18n/tolgee';
import { Layout } from './components/layout/Layout';
import { ToastContainer } from './components/ui/ToastContainer';

// Lazy-load pages to keep the initial bundle small
const MainPage = lazy(() => import('./pages/MainPage'));
const DownloadsPage = lazy(() => import('./pages/DownloadsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const TracesPage = lazy(() => import('./pages/TracesPage'));

const App: React.FC = () => (
  <TolgeeProvider tolgee={tolgee} fallback="Loading…">
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <HashRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<MainPage />} />
              <Route path="/downloads" element={<DownloadsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/traces" element={<TracesPage />} />
              <Route path="/traces/:taskId" element={<TracesPage />} />
              {/* Catch-all → home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
        <ToastContainer />
      </HashRouter>
    </ThemeProvider>
  </TolgeeProvider>
);

export default App;
