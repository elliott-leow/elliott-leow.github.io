'use client'

import { createContext, useContext, type RefObject } from 'react'

/** the paper sheet itself: draggable things are kept on it */
export const SheetContext = createContext<RefObject<HTMLDivElement | null> | null>(null)
export const useSheet = () => useContext(SheetContext)
