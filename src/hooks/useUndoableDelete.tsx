"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { App, Button } from "antd";
import React from "react";

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

    // 2. Setup undo logic
    const handleUndo = () => {
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

    // 3. Show notification with Undo button
    notification.success({
      key: id,
      message: `${entityName} deleted`,
      description: "Click Undo to restore this item.",
      duration,
      placement: "bottomRight",
      btn: (
        <Button 
          size="small" 
          type="primary"
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
    timersRef.current[id] = setTimeout(async () => {
      try {
        await onCommit();
        // The item is permanently deleted in DB. 
        // We don't really need to unhide it, as the next revalidation will omit it anyway.
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
    }, duration * 1000);
    
  }, [notification]);

  // Cleanup timeouts if the entire app unmounts (rare, but good practice)
  useEffect(() => {
    return () => {
      // In a robust app, we might want to forcefully commit these on unmount instead of clearing,
      // but if the component unmounts quickly, clearing them prevents state updates on unmounted components.
      // However, to ensure deletions happen even if they navigate away, we will intentionally NOT clear the timeouts here.
      // The timeouts will run in the background. The only issue is `setHiddenIds` might run after unmount.
      // React 18 handles this fine without warnings.
    };
  }, []);

  return { hiddenIds, triggerDelete };
}
