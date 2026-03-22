/**
 * TracesPage  —  "/traces" and "/traces/:taskId"
 *
 * Inference trace viewer with Perfetto integration.
 * Full implementation is Phase 3.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
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

const TracesPage: React.FC = () => {
  const { t } = useTranslate();
  const { taskId } = useParams<{ taskId?: string }>();

  return (
    <Page>
      <Title>
        {taskId ? `${t('traces.title')} — ${taskId}` : t('traces.title')}
      </Title>
      <Placeholder>{t('traces.no_traces')}</Placeholder>
    </Page>
  );
};

export default TracesPage;
