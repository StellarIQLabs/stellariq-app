/**
 * Registers jest-dom matchers (toBeInTheDocument, toHaveAttribute, …) in the
 * type system for colocated Vitest suites. Runtime registration lives in
 * apps/web/vitest.setup.ts, which tsc does not include.
 */
import '@testing-library/jest-dom/vitest';
