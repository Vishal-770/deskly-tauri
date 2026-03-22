import { useCallback, useEffect, useState } from "react";
import {
  authGetCredentialStatus,
  type CredentialStatus,
} from "@/lib/tauri-auth";

export type UseCredentialStatusReturn = {
  status: CredentialStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useCredentialStatus(): UseCredentialStatusReturn {
  const [status, setStatus] = useState<CredentialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await authGetCredentialStatus();
      setStatus(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, error, refresh };
}
