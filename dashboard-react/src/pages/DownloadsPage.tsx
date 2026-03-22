/**
 * DownloadsPage  —  "/downloads"
 *
 * Model download management grid.
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

const DownloadsPage: React.FC = () => {
  const { t } = useTranslate();
  return (
    <Page>
      <Title>{t('downloads.title')}</Title>
      <Placeholder>{t('downloads.no_downloads')}</Placeholder>
    </Page>
  );
};

export default DownloadsPage;
