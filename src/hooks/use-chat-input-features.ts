"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Declarative feature configuration
 */
type FeatureDefinition<T = any> = {
  key: string;
  defaultValue: T;
  persist?: boolean;
  onChanged?: (value: T) => void;
};

/**
 * The resolved feature state + controls
 */
type Feature<T = any> = {
  value: T;
  setValue: (value: T) => void;
  reset: () => void;
};

/**
 * Hook to manage chat input features declaratively
 *
 * Handles:
 * - State management for each feature
 * - localStorage persistence (if enabled)
 * - Ref management for closure over latest values
 *
 * @param definitions Feature definitions to manage
 * @returns Features object and utility to get latest values
 *
 * @example
 * const { features, getLatestValues } = useChatInputFeatures(
 *   { key: "search", defaultValue: false, persist: true },
 *   { key: "model", defaultValue: "gpt-4", persist: true }
 * );
 */
export function useChatInputFeatures(...definitions: FeatureDefinition[]) {
  // Initialize state from definitions, restoring from localStorage if persisted
  const [state, setState] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    for (const def of definitions) {
      if (def.persist && typeof window !== "undefined") {
        const stored = localStorage.getItem(`chat_feature_${def.key}`);
        initial[def.key] = stored !== null ? JSON.parse(stored) : def.defaultValue;
      }
      else {
        initial[def.key] = def.defaultValue;
      }
    }
    return initial;
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    for (const def of definitions) {
      if (def.persist && typeof window !== "undefined") {
        localStorage.setItem(
          `chat_feature_${def.key}`,
          JSON.stringify(state[def.key]),
        );
      }
    }
  }, [state, definitions]);

  // Keep ref for closure over latest values (needed for prepareSendMessagesRequest)
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Create setter callbacks for each feature
  const features = {} as Record<string, Feature>;
  for (const def of definitions) {
    features[def.key] = {
      value: state[def.key],
      setValue: (value: any) => {
        setState((prev) => {
          const updated = { ...prev, [def.key]: value };
          def.onChanged?.(value);
          return updated;
        });
      },
      reset: () => {
        setState(prev => ({ ...prev, [def.key]: def.defaultValue }));
      },
    };
  }

  return {
    features,
    getLatestValues: useCallback((): Record<string, any> => stateRef.current, []),
  };
}
