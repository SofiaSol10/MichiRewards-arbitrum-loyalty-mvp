"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";

type Directory = Record<string, Address>;

const isAddress = (value: string): boolean => /^0x[a-fA-F0-9]{40}$/.test(value.trim());

const storageKey = (merchantAddress?: string) => `michi:client-directory:${merchantAddress?.toLowerCase() ?? "anon"}`;

/**
 * Maps client emails to wallet addresses, scoped per merchant and persisted in
 * localStorage. There is no backend, so the mapping only exists on this device.
 */
export function useClientDirectory(merchantAddress?: string) {
  const [directory, setDirectory] = useState<Directory>({});

  useEffect(() => {
    if (!merchantAddress) {
      setDirectory({});
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(merchantAddress));
      setDirectory(raw ? JSON.parse(raw) : {});
    } catch {
      setDirectory({});
    }
  }, [merchantAddress]);

  const save = useCallback(
    (email: string, address: Address) => {
      if (!merchantAddress) return;
      setDirectory(prev => {
        const next = { ...prev, [email.trim().toLowerCase()]: address };
        localStorage.setItem(storageKey(merchantAddress), JSON.stringify(next));
        return next;
      });
    },
    [merchantAddress],
  );

  const resolve = useCallback(
    (identifier: string): Address | null => {
      const trimmed = identifier.trim();
      if (!trimmed) return null;
      if (isAddress(trimmed)) return trimmed as Address;
      return directory[trimmed.toLowerCase()] ?? null;
    },
    [directory],
  );

  return { directory, resolve, save, isAddress };
}
