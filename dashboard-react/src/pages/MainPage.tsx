/**
 * MainPage  —  "/"
 *
 * The primary interface: topology visualization + chat.
 * Full implementation is Phase 3.  This stub renders a placeholder
 * so the routing skeleton compiles and the layout shell can be verified.
 */
import React from 'react';
import styled from 'styled-components';
import { useTranslate } from '@tolgee/react';

const Page = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-size: 13px;
  letter-spacing: 0.08em;
`;

const MainPage: React.FC = () => {
  const { t } = useTranslate();
  return (
    <Page>
      {/* Phase 3: TopologyPane + ChatPane will be composed here */}
      <span>{t('common.loading')}</span>
    </Page>
  );
};

export default MainPage;
