import styled, { css } from 'styled-components';
import type { HuggingFaceModel } from '../../types/models';

export interface HuggingFaceResultItemProps {
  model: HuggingFaceModel;
  isAdded: boolean;
  isAdding: boolean;
  onAdd: () => void;
  onSelect: () => void;
  downloadedOnNodes?: string[];
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const ModelName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Author = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const StatBadge = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 3px;
`;

const AddedBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
`;

const ActionButton = styled.button<{ $variant: 'add' | 'select' }>`
  all: unset;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: all 0.15s;

  ${({ $variant }) =>
    $variant === 'add'
      ? css`
          border: 1px solid #555;
          color: #ccc;
          &:hover { border-color: #888; color: #fff; }
        `
      : css`
          background: rgba(255, 215, 0, 0.15);
          color: #ffd700;
          &:hover { background: rgba(255, 215, 0, 0.25); }
        `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DownloadIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function HuggingFaceResultItem({
  model,
  isAdded,
  isAdding,
  onAdd,
  onSelect,
  downloadedOnNodes,
}: HuggingFaceResultItemProps) {
  const shortName = model.id.startsWith('mlx-community/')
    ? model.id.replace('mlx-community/', '')
    : model.id;

  return (
    <Row>
      <Info>
        <ModelName>{shortName}</ModelName>
        <Author>{model.author}</Author>
      </Info>

      {/* Stats */}
      <StatBadge title="Downloads">↓ {formatCount(model.downloads)}</StatBadge>
      <StatBadge title="Likes">♥ {formatCount(model.likes)}</StatBadge>

      {/* Downloaded on nodes */}
      {downloadedOnNodes && downloadedOnNodes.length > 0 && <DownloadIcon />}

      {/* Added badge or action */}
      {isAdded ? (
        <>
          <AddedBadge>Added</AddedBadge>
          <ActionButton $variant="select" onClick={onSelect}>
            Select
          </ActionButton>
        </>
      ) : (
        <ActionButton $variant="add" onClick={onAdd} disabled={isAdding}>
          {isAdding ? '…' : '+ Add'}
        </ActionButton>
      )}
    </Row>
  );
}
