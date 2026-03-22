/**
 * SettingsPage  —  "/settings"
 *
 * Model store configuration.
 * Full implementation is Phase 3.
 */
import React from 'react';
import styled from 'styled-components';
import { useTranslate } from '@tolgee/react';

const Page = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  max-width: 680px;
  overflow-y: auto;
`;

const Title = styled.h1`
  margin: 0 0 24px;
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.yellow};
`;

const Placeholder = styled.p`
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-size: 12px;
`;

const SettingsPage: React.FC = () => {
  const { t } = useTranslate();
  return (
    <Page>
      <Title>{t('settings.title')}</Title>
      <Placeholder>{t('settings.model_store_description')}</Placeholder>
    </Page>
  );
};

export default SettingsPage;
