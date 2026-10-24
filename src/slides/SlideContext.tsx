import { createContext, useContext } from 'react';
import { DEFAULT_SESSION, type SessionState } from '../lib/types';

export type SlideMode = 'student' | 'present' | 'preview';

export interface SlideCtx {
  session: SessionState;
  mode: SlideMode;
}

export const SlideContext = createContext<SlideCtx>({ session: DEFAULT_SESSION, mode: 'student' });

export function useSlide() {
  return useContext(SlideContext);
}
