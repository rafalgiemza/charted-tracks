"use client";

import Link from "next/link";
import { forwardRef } from "react";
import type { KeyboardEvent } from "react";

export type SearchResult = {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  artistName: string;
  artistSlug: string;
};

type Props = {
  results: SearchResult[];
  query: string;
  isLoading: boolean;
  onClose: () => void;
  /** Przekazywany z SearchBar do obsługi Tab/Esc w dropdown */
  onKeyDown?: (e: KeyboardEvent<HTMLAnchorElement>, index: number) => void;
};

export const SearchResults = forwardRef<HTMLDivElement, Props>(
  ({ results, query, isLoading, onClose, onKeyDown }, ref) => {
    const showEmpty = !isLoading && query.length >= 2 && results.length === 0;

    return (
      <div
        ref={ref}
        role="listbox"
        aria-label="Search results"
        className="absolute top-full left-0 right-0 mt-1.5 z-50
                   rounded-xl border border-border bg-background shadow-lg
                   overflow-hidden"
      >
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin shrink-0" />
            Searching…
          </div>
        )}

        {/* Brak wyników */}
        {showEmpty && (
          <div className="px-4 py-3 text-sm text-muted-foreground">
            No results for{" "}
            <span className="font-medium text-foreground">"{query}"</span>
          </div>
        )}

        {/* Wyniki */}
        {!isLoading && results.length > 0 && (
          <ul>
            {results.map((result, index) => (
              <li key={result.id} role="option">
                <Link
                  href={`/songs/${result.slug}`}
                  onClick={onClose}
                  onKeyDown={(e) => onKeyDown?.(e, index)}
                  data-result-index={index}
                  className="flex items-center gap-3 px-3 py-2.5
                             hover:bg-muted/60 focus:bg-muted/60
                             focus:outline-none transition-colors"
                >
                  {/* Okładka */}
                  <div className="h-9 w-9 shrink-0 rounded overflow-hidden bg-muted">
                    {result.coverUrl ? (
                      <img
                        src={result.coverUrl}
                        alt={result.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-base">
                        🎵
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.artistName}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Hint — min 2 znaki */}
        {!isLoading && query.length > 0 && query.length < 2 && (
          <div className="px-4 py-3 text-xs text-muted-foreground">
            Type at least 2 characters…
          </div>
        )}
      </div>
    );
  }
);

SearchResults.displayName = "SearchResults";
