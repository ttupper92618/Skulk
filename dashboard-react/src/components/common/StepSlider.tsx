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
  position: relative;
  user-select: none;
`;

/** The grey background track line, inset so it starts/ends at dot centers. */
const TrackLine = styled.div<{ $inset: number }>`
  position: absolute;
  top: 12px;
  left: ${({ $inset }) => $inset}px;
  right: ${({ $inset }) => $inset}px;
  height: 2px;
  background: rgba(80, 80, 80, 0.6);
  border-radius: 1px;
`;

/** The gold active portion of the track. */
const ActiveLine = styled.div<{ $inset: number; $pct: number }>`
  position: absolute;
  top: 12px;
  left: ${({ $inset }) => $inset}px;
  height: 2px;
  width: calc((100% - ${({ $inset }) => $inset * 2}px) * ${({ $pct }) => $pct / 100});
  background: #FFD700;
  border-radius: 1px;
  transition: width 0.15s ease-out;
`;

/** Flex row holding all step columns. */
const Steps = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
`;

/** A single step: dot on top, label below, both centered. */
const StepCol = styled.button`
  all: unset;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 1;
`;

const Dot = styled.span<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? '18px' : '14px')};
  height: ${({ $active }) => ($active ? '18px' : '14px')};
  margin: ${({ $active }) => ($active ? '3px 0' : '5px 0')};
  border-radius: 50%;
  background: ${({ $active }) => ($active ? '#FFD700' : 'rgba(120, 120, 120, 0.7)')};
  transition: all 0.15s ease-out;
  box-shadow: ${({ $active }) => ($active ? '0 0 8px rgba(255, 215, 0, 0.4)' : 'none')};

  ${StepCol}:hover & {
    background: ${({ $active }) => ($active ? '#FFD700' : 'rgba(160, 160, 160, 0.8)')};
  }
`;

const Label = styled.span<{ $active: boolean }>`
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

  // Inset the track lines so they start/end at the center of the first/last dot.
  // Each dot hit area is roughly 18px wide; half = 9.
  const trackInset = 9;

  return (
    <Container className={className}>
      <TrackLine $inset={trackInset} />
      <ActiveLine $inset={trackInset} $pct={pct} />
      <Steps>
        {options.map((opt, i) => (
          <StepCol
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            aria-label={opt.label}
          >
            <Dot $active={i === activeIndex} />
            <Label $active={i === activeIndex}>{opt.label}</Label>
          </StepCol>
        ))}
      </Steps>
    </Container>
  );
}
