"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { App, Button } from "antd";
import React from "react";

/**
 * Countdown progress bar that shrinks from 100% to 0% over the given duration.
 */
function CountdownBar({ durationMs }: { durationMs: number }) {
  return (
    <div
      style={{
        height: 3,
        borderRadius: 2,
        background: "rgba(255,255,255,0.15)",
        marginTop: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 2,
          background: "linear-gradient(90deg, #1677ff 0%, #4096ff 100%)",
          width: "100%",
          animation: `undoCountdown ${durationMs}ms linear forwards`,
        }}
      />
      <style>{`
        @keyframes undoCountdown {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

/**
 * A hook to perform optimistic UI deletion with a 10-second undo notification.
 * 
 * Usage:
 * const { hiddenIds, triggerDelete } = useUndoableDelete();
 * 
 * // In your render:
 * items.filter(item => !hiddenIds.has(item._id)).map(...)
 * 
 * // On delete click:
 * triggerDelete({
 *   id: item._id,
 *   entityName: "Account", // or item.name
 *   onCommit: async () => await deleteAccount(item._id)
 * });
 */
export function useUndoableDelete() {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const { notification } = App.useApp();
  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const triggerDelete = useCallback(({ 
    id, 
    entityName = "Item", 
    onCommit 
  }: { 
    id: string, 
    entityName?: string, 
    onCommit: () => Promise<void> 
  }) => {
    // 1. Optimistically hide
    setHiddenIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    const duration = 10; // 10 seconds
    const durationMs = duration * 1000;

    // Track why the notification closed so we don't double-commit
    let reason: 'timeout' | 'undo' | 'manual' = 'manual';

    const commitDeletion = async () => {
      try {
        await onCommit();
        // The item is permanently deleted in DB. 
      } catch (err: any) {
        console.error("Failed to commit deletion:", err);
        notification.error({
          message: `Failed to delete ${entityName}`,
          description: err.message || "Unknown error",
          duration: 6,
          placement: "bottomRight",
        });
        // If it fails, un-hide it so user can try again
        setHiddenIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } finally {
        delete timersRef.current[id];
      }
    };

    // 2. Setup undo logic
    const handleUndo = () => {
      reason = 'undo';
      if (timersRef.current[id]) {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }
      setHiddenIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      notification.destroy(id);
    };

    // 3. Show notification with Undo button and countdown bar
    notification.open({
      key: id,
      message: (
        <span className="font-semibold text-foreground">
          {entityName} deleted
        </span>
      ),
      description: (
        <div>
          <span className="text-xs text-muted-foreground">Action will be permanent in 10 seconds.</span>
          <CountdownBar durationMs={durationMs} />
        </div>
      ),
      duration: 0, // Handled exclusively by setTimeout to prevent double-commit race conditions
      placement: "bottomRight",
      className: "!z-[1000] shadow-xl border border-border/80 rounded-xl",
      style: {
        marginBottom: 68, // Ensures clearance above mobile bottom nav
      },
      onClose: () => {
        // If closed manually by the user clicking 'x'
        if (reason === 'manual') {
          if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
          }
          commitDeletion();
        }
      },
      btn: (
        <Button 
          size="small" 
          type="primary"
          className="font-bold shadow-xs !h-8 !px-3"
          onClick={(e) => {
            e.stopPropagation();
            handleUndo();
          }}
        >
          Undo
        </Button>
      ),
    });

    // 4. Setup commit timer
    timersRef.current[id] = setTimeout(() => {
      reason = 'timeout';
      // Close the notification when the countdown ends
      notification.destroy(id);
      
      commitDeletion();
    }, durationMs);
    
  }, [notification]);

  // Cleanup timeouts if the entire app unmounts (rare, but good practice)
  useEffect(() => {
    return () => {
      // Intentionally NOT clearing timeouts here so deletions commit even on navigate-away.
      // React 18 handles stale setHiddenIds calls gracefully.
    };
  }, []);

  return { hiddenIds, triggerDelete };
}
