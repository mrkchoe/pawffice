"use client";

import { IconContext } from "@phosphor-icons/react";
import type { ReactNode } from "react";

/** App-wide Phosphor defaults: fill weight; color inherits unless overridden. */
export function PhosphorProvider({ children }: { children: ReactNode }) {
  return (
    <IconContext.Provider
      value={{
        weight: "fill",
        color: "currentColor",
        mirrored: false,
      }}
    >
      {children}
    </IconContext.Provider>
  );
}
