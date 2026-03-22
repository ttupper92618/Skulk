/**
 * HeaderNav
 *
 * Top navigation bar. Shows the EXO logo, page links, cluster connection
 * status, active download indicator, and debug/topology-only toggles.
 */
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useTranslate } from '@tolgee/react';
import { useUIStore } from '../../stores/uiStore';
import { useTopologyStore } from '../../stores/topologyStore';

// ─── Styled components ────────────────────────────────────────────────────────

const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: ${({ theme }) => theme.colors.darkGray};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
  z-index: 50;
`;

const LogoMark = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.yellow};
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const Links = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const activeStyle = css`
  color: ${({ theme }) => theme.colors.yellow};
  background: oklch(0.85 0.18 85 / 0.08);
`;

const StyledNavLink = styled(NavLink)`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.lightGray};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.foreground};
  }

  &.active {
    ${activeStyle}
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  background: transparent;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.yellow : theme.colors.lightGray};
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.foreground};
    background: ${({ theme }) => theme.colors.mediumGray};
  }
`;

const ConnectionDot = styled.span<{ $connected: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $connected }) =>
    $connected ? 'oklch(0.7 0.2 140)' : 'oklch(0.6 0.25 25)'};
  ${({ $connected }) =>
    $connected &&
    css`
      animation: statusPulse 2s ease-in-out infinite;
    `}
`;

const DownloadBadge = styled.span`
  font-size: 10px;
  padding: 1px 5px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.yellow};
  color: ${({ theme }) => theme.colors.black};
  font-weight: 700;
`;

// ─── Component ─────────────────────────────────────────────────────────────────

export const HeaderNav: React.FC = () => {
  const { t } = useTranslate();
  const location = useLocation();

  const debugMode = useUIStore((s) => s.debugMode);
  const topologyOnlyMode = useUIStore((s) => s.topologyOnlyMode);
  const toggleDebugMode = useUIStore((s) => s.toggleDebugMode);
  const toggleTopologyOnlyMode = useUIStore((s) => s.toggleTopologyOnlyMode);

  const isConnected = useTopologyStore((s) => s.isConnected);
  const downloadSummary = useTopologyStore((s) => s.getActiveDownloadSummary());

  const isMainPage = location.pathname === '/';

  return (
    <Nav>
      <LogoMark>exo</LogoMark>

      <Links>
        <StyledNavLink to="/" end>{t('nav.chat')}</StyledNavLink>
        <StyledNavLink to="/downloads">{t('nav.downloads')}</StyledNavLink>
        <StyledNavLink to="/settings">{t('nav.settings')}</StyledNavLink>
        <StyledNavLink to="/traces">{t('nav.traces')}</StyledNavLink>
      </Links>

      <Actions>
        {downloadSummary && (
          <DownloadBadge title={`${downloadSummary.count} download(s) active`}>
            {downloadSummary.count}
          </DownloadBadge>
        )}

        {isMainPage && (
          <>
            <IconButton
              $active={topologyOnlyMode}
              onClick={toggleTopologyOnlyMode}
              title={t('nav.topology_only')}
              aria-label={t('nav.topology_only')}
            >
              ⬡
            </IconButton>
            <IconButton
              $active={debugMode}
              onClick={toggleDebugMode}
              title={t('nav.debug')}
              aria-label={t('nav.debug')}
            >
              ⚙
            </IconButton>
          </>
        )}

        <ConnectionDot
          $connected={isConnected}
          title={isConnected ? t('chat.connected') : t('chat.connection_lost')}
        />
      </Actions>
    </Nav>
  );
};
