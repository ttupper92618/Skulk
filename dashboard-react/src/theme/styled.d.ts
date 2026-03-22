/**
 * Augments styled-components DefaultTheme so every styled component
 * gets full TypeScript intellisense on `props.theme`.
 */
import type { Theme } from './theme';

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}
