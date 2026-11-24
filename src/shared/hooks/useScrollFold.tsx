"use client";

import { createContext, useContext } from "react";

// Whether the page's top band is folded away. Ported from R&R's AppShell: it
// folds as you scroll down into the content and comes back as soon as you
// scroll up (or reach the top). The shell owns the scroll; pages read this.
export const ScrollFoldContext = createContext(false);
export const useScrollFold = () => useContext(ScrollFoldContext);
