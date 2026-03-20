import { useCallback, useEffect, useState } from "react";
import {
  authClearSemester,
  authGetSemester,
  authGetSemesters,
  authSetSemester,
  type Semester,
} from "@/lib/tauri-auth";

type UseSemesterReturn = {
  currentSemester: Semester | null;
  semesters: Semester[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setSemester: (semester: Semester) => Promise<boolean>;
  clearSemester: () => Promise<boolean>;
};

export function useSemester(): UseSemesterReturn {
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [selected, available] = await Promise.all([
        authGetSemester(),
        authGetSemesters(),
      ]);
      setCurrentSemester(selected);
      setSemesters(available);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSemesters([]);
      setCurrentSemester(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const setSemester = useCallback(async (semester: Semester) => {
    setLoading(true);
    setError(null);
    try {
      const success = await authSetSemester(semester);
      if (success) {
        setCurrentSemester(semester);
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSemester = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const success = await authClearSemester();
      if (success) {
        setCurrentSemester(null);
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    currentSemester,
    semesters,
    loading,
    error,
    refresh,
    setSemester,
    clearSemester,
  };
}
