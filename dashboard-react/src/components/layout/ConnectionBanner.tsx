/**
 * ConnectionBanner
 *
 * Shown at the top of the viewport when the exo backend is unreachable.
 * Auto-hides once the connection is restored.
 */
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useTranslate } from '@tolgee/react';
import { useTopologyStore } from '../../stores/topologyStore';

const slideDown = keyframes`
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
`;

const Banner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: oklch(0.25 0.12 25);
  border-bottom: 1px solid oklch(0.4 0.2 25);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: oklch(0.9 0.05 25);
  animation: ${slideDown} 200ms ease;
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: oklch(0.6 0.25 25);
`;

export const ConnectionBanner: React.FC = () => {
  const { t } = useTranslate();
  const isConnected = useTopologyStore((s) => s.isConnected);
  const lastUpdate = useTopologyStore((s) => s.lastUpdate);

  // Only show after we've made at least one attempt and failed
  if (isConnected || lastUpdate === null) return null;

  return (
    <Banner role="alert">
      <Dot />
      {t('chat.connection_lost')}
    </Banner>
  );
};
