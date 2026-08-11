'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Compute the ellipsis-aware page number array used in every list page.
 * Returns an array of numbers and/or the string 'ellipsis'.
 *
 * @param {number} totalPages
 * @param {number} currentPage
 * @returns {(number|'ellipsis')[]}
 */
export function getPageNumbers(totalPages, currentPage) {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        pages.push(1);
        if (currentPage > 3) {
            pages.push('ellipsis');
        }
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) {
                pages.push(i);
            }
        }
        if (currentPage < totalPages - 2) {
            pages.push('ellipsis');
        }
        if (!pages.includes(totalPages)) {
            pages.push(totalPages);
        }
    }
    return pages;
}

/**
 * useUrlFilters
 *
 * Manages URL-synced filter state for list pages.
 *
 * @param {Object} defaults  e.g. { page: 1, limit: 10, search: '', category: 'all', ... }
 * @returns {{ filters, updateFilter, resetFilters, getPageNums }}
 *
 * - filters: current state object
 * - updateFilter(key, value): update one key; resets page→1 for non-page keys
 * - resetFilters(defaults): reset entire state to the given defaults object
 * - getPageNums(totalPages): wrapper around getPageNumbers using filters.page
 */
export function useUrlFilters(defaults) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read a value from the current URL search params, falling back to the default.
    const getFromUrl = useCallback((key, defaultValue) => {
        return searchParams.get(key) || defaultValue;
    }, [searchParams]);

    // Build initial state from URL params (same pattern as every page).
    const [filters, setFilters] = useState(() => {
        const initial = {};
        for (const [key, defaultValue] of Object.entries(defaults)) {
            const raw = searchParams.get(key);
            if (raw !== null && raw !== '') {
                // Preserve numeric types for page/limit
                initial[key] = (typeof defaultValue === 'number') ? parseInt(raw, 10) : raw;
            } else {
                initial[key] = defaultValue;
            }
        }
        return initial;
    });

    // Sync state → URL whenever filters change.
    const updateURL = useCallback((newFilters) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(newFilters)) {
            // Skip "empty" values so the URL stays clean
            if (value !== null && value !== undefined && value !== '' && value !== 'all') {
                params.set(key, value);
            }
        }
        const queryString = params.toString();
        const newUrl = queryString ? `?${queryString}` : window.location.pathname;
        router.replace(newUrl, { scroll: false });
    }, [router]);

    useEffect(() => {
        updateURL(filters);
    }, [filters, updateURL]);

    /**
     * Update a single filter key.
     * - Empty / 'all' values are normalised to '' (or 1 for page).
     * - Any non-page update resets page → 1.
     */
    const updateFilter = useCallback((key, value) => {
        setFilters(prev => {
            const next = { ...prev };
            const isEmpty = value === null || value === undefined || value === '' || value === 'all';

            if (isEmpty) {
                next[key] = key === 'page' ? 1 : (typeof defaults[key] === 'number' ? defaults[key] : '');
            } else {
                next[key] = (typeof defaults[key] === 'number') ? Number(value) : value;
            }

            // Reset page whenever a non-page filter changes
            if (key !== 'page') {
                next.page = 1;
            }

            return next;
        });
    }, [defaults]);

    /**
     * Reset all filters to the provided defaults object.
     * Typically called by the "Clear Filters" button.
     */
    const resetFilters = useCallback((newDefaults) => {
        setFilters(newDefaults ?? defaults);
    }, [defaults]);

    /**
     * Convenience wrapper: compute page number array for the current page.
     */
    const getPageNums = useCallback((totalPages) => {
        return getPageNumbers(totalPages, filters.page);
    }, [filters.page]);

    return { filters, updateFilter, resetFilters, getPageNums };
}
