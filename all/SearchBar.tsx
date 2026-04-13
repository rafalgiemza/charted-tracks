"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { SearchResults, type SearchResult } from "./SearchResults";

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

export function SearchBar() {
  const router = useRouter();

  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen]       = useState(false);

  const inputRef      = useRef<HTMLInputElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef      = useRef<AbortController | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchResults = useCallback(async (q: string) => {
    // anuluj poprzednie żądanie
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}`,
        { signal: abortRef.current.signal }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.results ?? []);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Debounce po zmianie query ──────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < MIN_CHARS) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(() => fetchResults(query), DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  // ── Zamknij po kliknięciu poza dropdown ───────────────────────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Klawiatura — input ─────────────────────────────────────────────────

  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === "ArrowDown" && isOpen && results.length > 0) {
      e.preventDefault();
      // focus na pierwszy wynik
      const first = containerRef.current?.querySelector<HTMLAnchorElement>(
        "[data-result-index='0']"
      );
      first?.focus();
      return;
    }

    if (e.key === "Enter" && query.length >= MIN_CHARS) {
      // przejdź do strony wyszukiwania z pełnymi wynikami (V2 feature)
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  }

  // ── Klawiatura — wyniki (↑↓ nawigacja między linkami) ─────────────────

  function handleResultKeyDown(
    e: KeyboardEvent<HTMLAnchorElement>,
    index: number
  ) {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.focus();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = containerRef.current?.querySelector<HTMLAnchorElement>(
        `[data-result-index='${index + 1}']`
      );
      next ? next.focus() : inputRef.current?.focus();
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index === 0) {
        inputRef.current?.focus();
      } else {
        const prev = containerRef.current?.querySelector<HTMLAnchorElement>(
          `[data-result-index='${index - 1}']`
        );
        prev?.focus();
      }
    }
  }

  // ── Handlers ──────────────────────────────────────────────────────────

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(val.length > 0);
  }

  function handleClose() {
    setIsOpen(false);
    setQuery("");
  }

  const showDropdown = isOpen && (
    query.length > 0 || isLoading
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      {/* Input */}
      <div className="relative">
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search songs or artists…"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search songs or artists"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          className="w-full h-9 rounded-lg border border-input bg-background
                     pl-9 pr-3 text-sm placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
                     transition-all"
        />

        {/* Clear button */}
        {query.length > 0 && (
          <button
            onClick={handleClose}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2
                       h-4 w-4 rounded-full text-muted-foreground
                       hover:text-foreground transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <SearchResults
          results={results}
          query={query}
          isLoading={isLoading}
          onClose={handleClose}
          onKeyDown={handleResultKeyDown}
        />
      )}
    </div>
  );
}
