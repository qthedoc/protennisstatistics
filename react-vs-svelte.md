**Here's a clear mapping of React concepts to Svelte (Svelte 5+ with Runes) equivalents.**

Svelte 5's **Runes** (`$state`, `$derived`, etc.) make the comparison much more direct than in Svelte 4.

### Core React Hooks → Svelte Runes

| React Concept              | React Example                              | Svelte Equivalent                  | Svelte Example                              | Notes |
|---------------------------|--------------------------------------------|------------------------------------|---------------------------------------------|-------|
| **State** (`useState`)    | `const [count, setCount] = useState(0);`  | `$state` rune                      | `let count = $state(0);`                   | Direct mutation works (`count++`). No setter function needed. |
| **Computed / Memo** (`useMemo`) | `const doubled = useMemo(() => count * 2, [count]);` | `$derived` rune             | `let doubled = $derived(count * 2);`       | Automatically tracks dependencies. No array needed. |
| **Side Effects** (`useEffect`) | `useEffect(() => { ... }, [deps]);`     | `$effect` rune                     | `$effect(() => { console.log(count); });`  | Automatic dependency tracking. Runs after DOM update. |
| **Cleanup in Effect**     | `useEffect(() => { return () => cleanup(); }, []);` | Return cleanup from `$effect` | `$effect(() => { return () => cleanup(); });` | Very similar. |
| **Layout Effect** (`useLayoutEffect`) | Similar to `useEffect` but sync     | `$effect` (or custom)              | Same as above                               | Svelte's `$effect` is generally post- paint. |
| **Ref** (`useRef`)        | `const ref = useRef(null);`                | `let ref = $state(null);` or plain variable | `let el = $state(null);`                   | For DOM refs, use `bind:this={el}`. |
| **Callback Memo** (`useCallback`) | `const handler = useCallback(() => {}, [deps]);` | Just a function (or `$derived`) | `function handleClick() { ... }`           | Often unnecessary due to fine-grained reactivity. |
| **Context** (`useContext` + `createContext`) | Provider + `useContext(MyContext)` | Context API or Stores              | `setContext` / `getContext` or Svelte stores | Svelte has a built-in context API. |
| **Reducer** (`useReducer`) | Complex state logic                        | `$state` + logic or custom store   | `let state = $state({ ... });`             | For complex cases, use a class or writable store. |
| **Imperative Handle** (`useImperativeHandle`) | Expose methods to parent            | `$$props` / events / context       | Expose via context or events               | Less common pattern in Svelte. |

### Other Common Concepts

| Category                  | React                                      | Svelte Equivalent                          | Notes |
|---------------------------|--------------------------------------------|--------------------------------------------|-------|
| **Props**                 | `function Component({ name })`             | `let { name } = $props();`                 | `$props` rune in Svelte 5. |
| **Children**              | `{children}`                               | `{@render children()}` or slots            | Svelte uses slots by default. |
| **Lifecycle (Mount)**     | `useEffect(() => {}, [])`                  | `$effect(() => {})` or top-level code      | Top-level code runs on init. |
| **Lifecycle (Unmount)**   | Cleanup in `useEffect`                     | Return cleanup function from `$effect`     | Same as effect cleanup. |
| **Styling**               | CSS-in-JS, modules, Tailwind               | Scoped CSS (default), `<style>`, Tailwind  | Svelte's scoped styles are excellent. |
| **Events**                | `onClick={handler}`                        | `on:click={handler}`                       | Native-like. |
| **Conditional Rendering** | `{condition && <Comp />}`                  | `{#if condition} ... {/if}`                | More readable. |
| **Lists**                 | `.map()` with `key`                        | `{#each items as item (item.id)}`          | Key is optional but recommended. |
| **Global State**          | Redux, Zustand, Context + useReducer       | Svelte Stores (`writable`, `readable`) or Runes in `.svelte.ts` files | Stores still work great with `$` prefix auto-subscription. |

### Key Philosophical Differences

- **Reactivity Model**:
  - **React**: Virtual DOM + reconciliation + hooks rules + dependency arrays.
  - **Svelte**: Compiler-based, fine-grained reactivity. No VDOM in Svelte 5 (compiles to surgical DOM updates).

- **Mental Model**:
  - React: "Everything re-renders unless I memoize."
  - Svelte: "Only the things that actually change update."

- **Boilerplate**:
  - Svelte generally requires **much less** boilerplate once you're used to runes.

### Quick Code Comparison Example (Counter)

**React:**
```tsx
function Counter() {
  const [count, setCount] = useState(0);
  const doubled = useMemo(() => count * 2, [count]);

  useEffect(() => {
    console.log('Count changed:', count);
    return () => console.log('Cleanup');
  }, [count]);

  return <button onClick={() => setCount(c => c + 1)}>{count} (doubled: {doubled})</button>;
}
```

**Svelte 5:**
```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);

  $effect(() => {
    console.log('Count changed:', count);
    return () => console.log('Cleanup');
  });
</script>

<button on:click={() => count++}>
  {count} (doubled: {doubled})
</button>
```

Would you like me to expand this into a full side-by-side component examples (forms, todo list, data fetching, etc.)?