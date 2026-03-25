import { useCallback } from 'react';
import styled from 'styled-components';

export interface StepSliderOption<T extends string | number = number> {
  value: T;
  label: string;
}

export interface StepSliderProps<T extends string | number = number> {
  options: StepSliderOption<T>[] | T[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/* ---- styles ---- */

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  user-select: none;
`;

const Track = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  height: 24px;
`;

const TrackLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(80, 80, 80, 0.6);
  border-radius: 1px;
`;

const ActiveLine = styled.div<{ $pct: number }>`
  position: absolute;
  left: 0;
  height: 2px;
  width: ${({ $pct }) => $pct}%;
  background: #FFD700;
  border-radius: 1px;
  transition: width 0.15s ease-out;
`;

const StepRow = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  height: 24px;
`;

const StepHit = styled.button<{ $active: boolean }>`
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  z-index: 1;
`;

const Dot = styled.span<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? '18px' : '14px')};
  height: ${({ $active }) => ($active ? '18px' : '14px')};
  border-radius: 50%;
  background: ${({ $active }) => ($active ? '#FFD700' : 'rgba(120, 120, 120, 0.7)')};
  transition: all 0.15s ease-out;
  box-shadow: ${({ $active }) => ($active ? '0 0 8px rgba(255, 215, 0, 0.4)' : 'none')};

  ${StepHit}:hover & {
    background: ${({ $active }) => ($active ? '#FFD700' : 'rgba(160, 160, 160, 0.8)')};
  }
`;

const Labels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
`;

const Label = styled.span<{ $active: boolean }>`
  width: 24px;
  text-align: center;
  font-size: 12px;
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ $active }) => ($active ? '#FFD700' : 'rgba(179, 179, 179, 0.6)')};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  transition: color 0.15s;
`;

/* ---- component ---- */

function normalizeOption<T extends string | number>(
  opt: StepSliderOption<T> | T,
): StepSliderOption<T> {
  if (typeof opt === 'object' && opt !== null && 'value' in opt) return opt;
  return { value: opt as T, label: String(opt) };
}

export function StepSlider<T extends string | number = number>({
  options: rawOptions,
  value,
  onChange,
  className,
}: StepSliderProps<T>) {
  const options = rawOptions.map(normalizeOption);
  const activeIndex = options.findIndex((o) => o.value === value);
  const pct = options.length <= 1 ? 0 : (activeIndex / (options.length - 1)) * 100;

  return (
    <Container className={className}>
      <Track>
        <TrackLine />
        <ActiveLine $pct={pct} />
        <StepRow>
          {options.map((opt, i) => (
            <StepHit
              key={String(opt.value)}
              $active={i === activeIndex}
              onClick={() => onChange(opt.value)}
              aria-label={opt.label}
            >
              <Dot $active={i === activeIndex} />
            </StepHit>
          ))}
        </StepRow>
      </Track>
      <Labels>
        {options.map((opt, i) => (
          <Label key={String(opt.value)} $active={i === activeIndex}>
            {opt.label}
          </Label>
        ))}
      </Labels>
    </Container>
  );
}
