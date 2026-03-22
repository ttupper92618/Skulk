/**
 * ToastContainer
 *
 * Renders active toast notifications in the bottom-right corner.
 * Replaces ToastContainer.svelte from the original dashboard.
 */
import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useToastStore, type Toast, type ToastVariant } from '../../stores/toastStore';

// ─── Styled components ────────────────────────────────────────────────────────

const slideIn = keyframes`
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
`;

const Container = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9999;
  pointer-events: none;
`;

function variantColor(variant: ToastVariant): string {
  switch (variant) {
    case 'success': return 'oklch(0.65 0.2 140)';
    case 'warning': return 'oklch(0.75 0.18 75)';
    case 'error':   return 'oklch(0.6 0.25 25)';
    default:        return 'oklch(0.85 0.18 85)';
  }
}

const ToastItem = styled.div<{ $variant: ToastVariant }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: ${({ theme }) => theme.colors.darkGray};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid ${({ $variant }) => variantColor($variant)};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 12px;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.foreground};
  max-width: 340px;
  pointer-events: all;
  box-shadow: 0 4px 20px oklch(0 0 0 / 0.5);
  animation: ${slideIn} 200ms ease;
  cursor: pointer;
`;

const Dot = styled.span<{ $variant: ToastVariant }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $variant }) => variantColor($variant)};
`;

// ─── Component ─────────────────────────────────────────────────────────────────

const ToastEntry: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => (
  <ToastItem
    $variant={toast.variant}
    onClick={() => onDismiss(toast.id)}
    role="alert"
    aria-live="polite"
  >
    <Dot $variant={toast.variant} />
    {toast.message}
  </ToastItem>
);

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <Container>
      {toasts.map((toast) => (
        <ToastEntry key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </Container>
  );
};
