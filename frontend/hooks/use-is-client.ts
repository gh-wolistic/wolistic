"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => undefined;

export function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}