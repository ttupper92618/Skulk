/**
 * Layout
 *
 * Root layout wrapping all pages. Renders the HeaderNav, ConnectionBanner,
 * and the current page via Outlet.  Starts topology polling on mount.
 */
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { HeaderNav } from './HeaderNav';
import { ConnectionBanner } from './ConnectionBanner';
import { useTopologyStore } from '../../stores/topologyStore';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
`;

const Main = styled.main`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

export const Layout: React.FC = () => {
  const startPolling = useTopologyStore((s) => s.startPolling);
  const stopPolling = useTopologyStore((s) => s.stopPolling);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return (
    <Wrapper>
      <HeaderNav />
      <ConnectionBanner />
      <Main>
        <Outlet />
      </Main>
    </Wrapper>
  );
};
