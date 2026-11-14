import { useEffect, useRef, useCallback } from 'react';
import { SSEEvent } from '../types/api.types';
import { useAuthStore } from '../store/authStore';

interface UseSSEOptions {
  onEvent: (event: SSEEvent) => void;
  onError?: (error: Event) => void;
  onComplete?: () => void;
}

/**
 * Custom hook for consuming Server-Sent Events from the verification endpoint.
 *
 * Uses the native EventSource API with Authorization header via fetch + ReadableStream
 * (since EventSource doesn't support custom headers natively).
 */
export function useSSE(url: string | null, options: UseSSEOptions) {
  const { onEvent, onError, onComplete } = options;
  const accessToken = useAuthStore((s) => s.accessToken);
  const abortRef = useRef<AbortController | null>(null);
  const activeRef = useRef(false);

  const start = useCallback(
    async (streamUrl: string) => {
      if (activeRef.current) return;
      activeRef.current = true;

      abortRef.current = new AbortController();

      try {
        const response = await fetch(streamUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'text/event-stream',
          },
          signal: abortRef.current.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(6)) as SSEEvent;
                onEvent(eventData);
                if (eventData.stage === 'COMPLETE' || eventData.stage === 'FAILED') {
                  onComplete?.();
                  activeRef.current = false;
                  return;
                }
              } catch {
                // Malformed SSE line — ignore
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          onError?.(new Event('error'));
        }
      } finally {
        activeRef.current = false;
      }
    },
    [accessToken, onEvent, onError, onComplete],
  );

  useEffect(() => {
    if (url) {
      start(url);
    }
    return () => {
      abortRef.current?.abort();
      activeRef.current = false;
    };
  }, [url, start]);
}
