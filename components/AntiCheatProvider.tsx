"use client";

import { useEffect, useRef, useCallback } from "react";

interface AntiCheatConfig {
  sessionId: string;
  onViolation: () => void;
  enabled: boolean;
  maxViolations?: number;
}

export function useAntiCheat(config: AntiCheatConfig) {
  const { sessionId, onViolation, enabled, maxViolations = 5 } = config;
  const sessionIdRef = useRef(sessionId);
  const isLockedRef = useRef(false);
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const violationCountRef = useRef(0);
  const maxViolationsRef = useRef(maxViolations);

  // Update maxViolations ref when it changes
  useEffect(() => {
    maxViolationsRef.current = maxViolations;
  }, [maxViolations]);

  // Update refs when props change
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }
    };
  }, []);

  // CRITICAL: Only one violation can be counted at a time
  const reportViolation = useCallback(async (type: string) => {
    // Guard: disabled or already locked
    if (!enabled || isLockedRef.current) {
      return;
    }

    // Check if max already reached
    if (violationCountRef.current >= maxViolationsRef.current) {
      return;
    }

    // IMMEDIATELY set lock - nothing can bypass this
    isLockedRef.current = true;

    // Increment counter
    violationCountRef.current += 1;

    // Call the onViolation callback
    onViolation();

    // If max reached, just return (parent will handle submit)
    if (violationCountRef.current >= maxViolationsRef.current) {
      return;
    }

    // Report to server
    try {
      await fetch(`/api/sessions/${sessionIdRef.current}/violation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
    } catch (e) {
      console.error("Failed to report violation");
    }

    // Release lock after delay
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
    }
    lockTimeoutRef.current = setTimeout(() => {
      isLockedRef.current = false;
    }, 1000);
  }, [enabled, onViolation]);

  // Prevent right-click
  useEffect(() => {
    if (!enabled) return;

    const handle = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation("RIGHT_CLICK");
    };

    document.addEventListener("contextmenu", handle);
    return () => document.removeEventListener("contextmenu", handle);
  }, [enabled, reportViolation]);

  // Prevent copy
  useEffect(() => {
    if (!enabled) return;

    const handle = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation("COPY_ATTEMPT");
    };

    document.addEventListener("copy", handle);
    return () => document.removeEventListener("copy", handle);
  }, [enabled, reportViolation]);

  // Prevent paste
  useEffect(() => {
    if (!enabled) return;

    const handle = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation("PASTE_ATTEMPT");
    };

    document.addEventListener("paste", handle);
    return () => document.removeEventListener("paste", handle);
  }, [enabled, reportViolation]);

  // Prevent cut
  useEffect(() => {
    if (!enabled) return;

    const handle = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation("CUT_ATTEMPT");
    };

    document.addEventListener("cut", handle);
    return () => document.removeEventListener("cut", handle);
  }, [enabled, reportViolation]);

  // Tab switch
  useEffect(() => {
    if (!enabled) return;

    const handle = () => {
      if (document.hidden) {
        reportViolation("TAB_SWITCH");
      }
    };

    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, [enabled, reportViolation]);

  // Window blur
  useEffect(() => {
    if (!enabled) return;

    const handle = () => {
      reportViolation("WINDOW_BLUR");
    };

    window.addEventListener("blur", handle);
    return () => window.removeEventListener("blur", handle);
  }, [enabled, reportViolation]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enabled) return;

    const handle = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "v", "x", "a", "p", "s", "u"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        reportViolation("SHORTCUT_USED");
      }
      if (e.key === "F12") {
        e.preventDefault();
        reportViolation("DEV_TOOLS");
      }
      if (e.key === "PrintScreen") {
        e.preventDefault();
        reportViolation("PRINT_SCREEN");
      }
    };

    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [enabled, reportViolation]);
}
