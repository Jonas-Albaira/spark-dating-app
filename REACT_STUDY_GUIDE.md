# React Hooks Study Guide
### Built for Senior Engineer Interview Prep ($200k–$300k roles)
*Using the Spark Dating App as reference code*

---

## TABLE OF CONTENTS

1. [The Mental Model](#1-the-mental-model)
2. [useState](#2-usestate)
3. [useEffect](#3-useeffect)
4. [useReducer](#4-usereducer)
5. [useContext](#5-usecontext)
6. [useRef](#6-useref)
7. [useMemo](#7-usememo)
8. [useCallback](#8-usecallback)
9. [useId](#9-useid)
10. [useTransition](#10-usetransition)
11. [useDeferredValue](#11-usedeferredvalue)
12. [useLayoutEffect](#12-uselayouteffect)
13. [useImperativeHandle + forwardRef](#13-useimperativehandle--forwardref)
14. [Custom Hooks](#14-custom-hooks)
15. [Rules of Hooks](#15-rules-of-hooks)
16. [Hook Decision Tree](#16-hook-decision-tree)
17. [Common Interview Questions](#17-common-interview-questions)
18. [Performance Patterns](#18-performance-patterns)
19. [Anti-Patterns to Avoid](#19-anti-patterns-to-avoid)

---

## 1. THE MENTAL MODEL

Before memorizing APIs, internalize these two facts:

**Fact 1: Every render is a snapshot.**
When React calls your component function, it creates a snapshot of that moment in time.
Every variable, prop, and state value inside that render is FROZEN to that snapshot.
Event handlers and effects "close over" those frozen values — this is called a "stale closure."

**Fact 2: Hooks are memory slots.**
React keeps an array of "slots" for each component instance.
On every render, hooks are called in order and each hook reads/writes its slot.
This is why hooks cannot be inside conditionals — the slot order must be stable.

```
Render 1: useState[0]=0, useEffect[1]=fn, useMemo[2]=42
Render 2: useState[0]=1, useEffect[1]=fn, useMemo[2]=42  ← same slot order
```

---

## 2. useState

**What it does:** Stores a value and triggers a re-render when it changes.

**Signature:**
```js
const [state, setState] = useState(initialValue)
const [state, setState] = useState(() => expensiveComputation()) // lazy init
```

**Key behaviors:**
- `setState` with the SAME value (Object.is comparison) does NOT re-render
- `setState` is ASYNCHRONOUS — reading state immediately after set gives the OLD value
- Multiple `setState` calls in an event handler are BATCHED (React 18 batches all of them)

**Functional update pattern (avoid stale closure):**
```js
// BAD — count might be stale if called multiple times
setCount(count + 1)

// GOOD — always gets the latest value
setCount(prev => prev + 1)
```

**Where in the app:**
- `SwipeStack.jsx`: `currentIndex` — tracks which card is on top
- `ProfileCard.jsx`: `currentPhoto` — which photo is displayed
- `FilterPanel.jsx`: `searchInput`, `selectedInterest` — filter form values

**Interview Q:** *"When does React re-render a component?"*
A: When state changes (via setState), when props change, when the parent re-renders,
or when a context value it subscribes to changes.

---

## 3. useEffect

**What it does:** Runs side effects AFTER the browser has painted the screen.
Side effects = anything outside React's rendering (API calls, subscriptions, timers, DOM manipulation).

**Signature:**
```js
useEffect(() => {
  // effect
  return () => { /* cleanup */ } // optional
}, [dependency, array])
```

**The dependency array:**
| deps array  | When effect runs                          |
|-------------|-------------------------------------------|
| omitted     | After EVERY render                        |
| `[]`        | Once on mount, cleanup on unmount         |
| `[a, b]`    | On mount + whenever a or b changes        |

**The cleanup function:**
React calls cleanup BEFORE running the effect again (deps changed) and on unmount.
Always clean up: event listeners, timers, WebSocket connections, AbortController.

```js
// Correct cleanup pattern (from useOnlineStatus.js)
useEffect(() => {
  const handler = () => setIsOnline(true)
  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)  // cleanup!
}, [])
```

**Where in the app:**
- `AuthContext.jsx`: Persist user to localStorage on auth state change
- `AuthContext.jsx`: Restore session from localStorage on mount (empty deps)
- `MatchNotification.jsx`: Auto-dismiss timer (cleanup clears the timer)
- `ChatList.jsx`: Auto-scroll chat to bottom when messages change

**Common gotcha — infinite loop:**
```js
// BAD — object created in render, new reference every time
useEffect(() => { fetchUser() }, [{ id: 1 }])  // runs forever!

// GOOD — primitive value, stable reference
useEffect(() => { fetchUser() }, [userId])
```

**Interview Q:** *"Why do we return a cleanup function from useEffect?"*
A: To prevent memory leaks and stale behavior. If we subscribe to an event but
never unsubscribe, the handler keeps running even after the component unmounts,
referencing values from a dead component — can cause crashes and memory leaks.

---

## 4. useReducer

**What it does:** Manages state with a pure reducer function.
Think of it as useState with an explicit state machine.

**Signature:**
```js
const [state, dispatch] = useReducer(reducerFn, initialState)
// dispatch({ type: 'ACTION_NAME', payload: data })
```

**Reducer function:**
```js
function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT': return { ...state, count: state.count + 1 }
    case 'RESET':     return initialState
    default:          return state  // always return state for unknown actions
  }
}
```

**When to use useReducer over useState:**
- Multiple state values that change together
- Next state depends on previous state
- State transitions have complex logic
- You want to centralize update logic for testability

**Where in the app:**
- `appReducer.js`: Manages likes/passes/matches — all state transitions in one file
- `AuthContext.jsx`: Auth state machine (LOGIN, LOGOUT, UPDATE_PROFILE)
- `ProfileSettings.jsx`: Form state (SET_FIELD, SET_PREFERENCE, TOGGLE_INTEREST)

**The (state, action) => newState pattern:**
This is a PURE function — no side effects, no async, no random values.
Given the same state + action, always returns the same next state.
This makes it trivially testable.

```js
test('LIKE action adds to likedIds', () => {
  const state = appReducer(initialState, { type: 'LIKE', payload: { id: 1 } })
  expect(state.likedIds).toContain(1)
})
```

**Interview Q:** *"What's the difference between useState and useReducer?"*
A: useState is syntactic sugar for a single-value useReducer. useReducer is better
when state transitions are complex, when multiple values must update atomically,
or when you want to centralize logic for testability. Redux is essentially a global useReducer.

---

## 5. useContext

**What it does:** Reads a value from the nearest matching Context.Provider above it in the tree.
Solves "prop drilling" — passing props through many layers of components.

**Pattern (3 steps):**
```js
// Step 1: Create context
const ThemeContext = createContext(defaultValue)

// Step 2: Provide value (wrap subtree)
<ThemeContext.Provider value={{ theme, toggleTheme }}>
  {children}
</ThemeContext.Provider>

// Step 3: Consume anywhere in the tree
const { theme } = useContext(ThemeContext)
```

**Performance consideration:**
ALL consumers re-render when the context value changes.
To prevent unnecessary re-renders, memoize the context value:
```js
const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])
```

**Context does NOT replace state management:**
Context is a dependency injection mechanism, not a state manager.
It distributes state — the state itself lives in useState/useReducer in the provider.

**Where in the app:**
- `ThemeContext.jsx`: Dark/light mode distributed to all components
- `AuthContext.jsx`: Current user + auth actions
- `MatchContext.jsx`: Match state + dispatch (combines context + useReducer)

**Custom hook wrapper pattern (best practice):**
```js
// Wrap useContext in a custom hook for:
// 1. Error boundary if used outside provider
// 2. Cleaner import (useTheme vs useContext(ThemeContext))
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}
```

**Interview Q:** *"How does Context API differ from Redux?"*
A: Context is built-in, simpler, and great for low-frequency updates (theme, auth).
Redux has middleware (async), DevTools time-travel, selectors for granular subscriptions,
and batched updates. Context re-renders ALL consumers on any change — Redux only
re-renders components whose selected slice changed.

---

## 6. useRef

**What it does:** Returns a mutable object `{ current: value }` that persists across renders
WITHOUT causing re-renders when changed. Two main use cases:

**Use case 1 — DOM reference:**
```js
const inputRef = useRef(null)
// Attach: <input ref={inputRef} />
// Access: inputRef.current.focus()
```

**Use case 2 — Mutable value without re-render:**
```js
// Tracking whether component is mounted (from MatchNotification.jsx)
const isMountedRef = useRef(true)
useEffect(() => {
  isMountedRef.current = true
  return () => { isMountedRef.current = false }
}, [])

// Safe async callback
setTimeout(() => {
  if (isMountedRef.current) setState(newValue) // won't setState on unmounted component
}, 1000)
```

**useState vs useRef:**
| Feature            | useState          | useRef            |
|--------------------|-------------------|-------------------|
| Triggers re-render | YES               | NO                |
| Persists across renders | YES          | YES               |
| Use for            | UI state          | Mutable values, DOM refs |

**Where in the app:**
- `useSwipe.js`: `startPos.current` — stores drag origin without causing re-renders
- `ProfileCard.jsx`: DOM ref for `getBoundingClientRect()` measurement
- `ChatList.jsx`: `chatEndRef` — scroll target, `inputRef` — focus after send
- `MatchNotification.jsx`: `isMountedRef` — prevent setState on unmounted component
- `SwipeStack.jsx`: `topCardRef` — calls useImperativeHandle methods on child

**Interview Q:** *"When would you use useRef instead of useState?"*
A: Use useRef when you need to store a value that should persist across renders but
should NOT trigger a re-render when it changes. Common cases: DOM refs, previous values,
timers/intervals, tracking mount state, mutable cache values.

---

## 7. useMemo

**What it does:** Memoizes (caches) the result of an expensive computation.
Only recomputes when dependencies change.

**Signature:**
```js
const memoizedValue = useMemo(() => expensiveCalc(a, b), [a, b])
```

**When to use:**
1. Computationally expensive calculation (filtering/sorting large lists)
2. Creating a stable object/array reference to prevent child re-renders
3. Derived state that depends on multiple inputs

**When NOT to use:**
- Simple calculations (string concatenation, arithmetic) — the overhead exceeds the savings
- Values that change on every render anyway
- Premature optimization without profiling

**Where in the app:**
- `MatchContext.jsx`: `sortedMatches` — sorting every render is wasteful
- `MatchContext.jsx`: `stats` — derived metrics only recalculate when source data changes
- `FilterPanel.jsx`: `filtered` — runs on deferredSearch, not live input
- `MatchesGrid.jsx`: Separates new matches from older ones

```js
// From MatchContext.jsx
const sortedMatches = useMemo(() => {
  return [...state.matches].sort(
    (a, b) => new Date(b.matchedAt) - new Date(a.matchedAt)
  )
}, [state.matches]) // Only re-sorts when matches array changes
```

**Interview Q:** *"What's the difference between useMemo and useCallback?"*
A: useMemo memoizes a COMPUTED VALUE. useCallback memoizes a FUNCTION.
`useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

---

## 8. useCallback

**What it does:** Returns a memoized version of a callback function.
The function reference stays the same between renders unless deps change.

**Why it matters:**
In JavaScript, `() => {}` creates a NEW function object on every render.
If you pass this to a child component as a prop, the child re-renders every time
even if the function logic didn't change.

```js
// Without useCallback — new function reference on every render
const handleClick = () => doSomething(value)

// With useCallback — same reference until `value` changes
const handleClick = useCallback(() => doSomething(value), [value])
```

**Works with React.memo:**
`useCallback` only prevents re-renders in children wrapped with `React.memo`.
Without `React.memo`, children re-render regardless of prop stability.

**Where in the app:**
- `SwipeStack.jsx`: `handleLike`, `handlePass` — passed to ProfileCard and buttons
- `ChatList.jsx`: `handleSend` — stable reference for the send button
- `ThemeContext.jsx`: `toggleTheme` — stable reference for nav/header buttons
- All custom hooks: handlers returned from hooks should be stable

```js
// From SwipeStack.jsx
const handleLike = useCallback(() => {
  if (!currentProfile) return
  likeProfile(currentProfile)
  startTransition(() => setCurrentIndex(prev => prev + 1))
}, [currentProfile, likeProfile])  // Stable until currentProfile changes
```

**Interview Q:** *"Should I wrap every function in useCallback?"*
A: No. useCallback has overhead — it still runs on every render to check deps.
Only use it when: (1) the function is a dep of a useEffect/useMemo/another useCallback,
or (2) it's passed to a React.memo child and you want to prevent unnecessary re-renders.
Profile first, optimize second.

---

## 9. useId

**What it does:** Generates a stable, unique ID that's consistent between server and client renders.

**Why it exists:**
Before useId, developers used `Math.random()` or counters for form label IDs.
These caused hydration mismatches in SSR — server and client generated different IDs.
useId solves this: the same component renders the same ID on server AND client.

**Signature:**
```js
const id = useId()
// Returns something like ":r0:", ":r1:", etc.
```

**Use case — accessible forms:**
```js
// From FilterPanel.jsx
const searchId = useId()
// ...
<label htmlFor={searchId}>Search</label>
<input id={searchId} />
```

**Multiple IDs from one useId:**
```js
const baseId = useId()
const nameId = `${baseId}-name`
const emailId = `${baseId}-email`
```

**Where in the app:**
- `FilterPanel.jsx`: Associates labels with inputs for screen reader accessibility
- Multiple filter inputs each get unique IDs without collision

**Interview Q:** *"Why can't I just use Math.random() for element IDs?"*
A: In SSR (Next.js, Remix), the server renders HTML with one random ID, then the
client re-renders and generates a DIFFERENT random ID. React can't reconcile these
differences — this is a "hydration mismatch" and causes errors or layout flicker.
useId generates IDs deterministically based on component position in the tree.

---

## 10. useTransition

**What it does:** Marks state updates as "non-urgent" so React can keep the UI responsive
by handling urgent updates (like typing) first.

**Signature:**
```js
const [isPending, startTransition] = useTransition()

// Mark an update as non-urgent
startTransition(() => {
  setSlowState(newValue) // React can pause this if something urgent comes in
})
```

**How it works:**
React categorizes updates:
- **Urgent:** typing, clicking, pressing — must respond instantly
- **Transition (non-urgent):** tab switches, navigation, non-interactive updates

If a new urgent update arrives while a transition is in progress, React can
interrupt the transition, handle the urgent update, then resume.

`isPending`: true while the deferred update is in-progress. Use this to show a spinner.

**Where in the app:**
- `SwipeStack.jsx`: `startTransition(() => setCurrentIndex(...))` — advancing the card
  deck doesn't need to block the swipe gesture animation
- `App.jsx`: `startTabTransition(() => setActiveTab(tab))` — tab switching is non-urgent

```js
// From App.jsx
const [isTabPending, startTabTransition] = useTransition()

const handleTabChange = useCallback((tab) => {
  startTabTransition(() => setActiveTab(tab)) // non-urgent
}, [])

// In JSX: dim content while loading new tab
<main style={{ opacity: isTabPending ? 0.7 : 1 }}>
```

**Interview Q:** *"What's the difference between useTransition and debouncing?"*
A: Debouncing delays the state update. useTransition marks the update as interruptible
but it still starts immediately. React can render the current state while preparing the
transition state in the background, then commit it atomically. Debouncing is simpler
but causes artificial delays; useTransition is smarter and CPU-aware.

---

## 11. useDeferredValue

**What it does:** Defers a value to a lower priority, keeping the UI responsive.
It's like useTransition but for values you don't control (e.g., a prop).

**Signature:**
```js
const deferredValue = useDeferredValue(value)
// deferredValue lags behind value during high-frequency updates
```

**How to detect stale state:**
```js
const isStale = value !== deferredValue
// Show loading indicator when isStale is true
```

**useTransition vs useDeferredValue:**
| Hook              | Use when                                            |
|-------------------|-----------------------------------------------------|
| useTransition     | You control the state update (you call setState)    |
| useDeferredValue  | You receive the value (from props, context, input)  |

**Where in the app:**
- `FilterPanel.jsx`: Defers the search string so typing stays responsive even while
  filtering hundreds of matches

```js
// From FilterPanel.jsx
const [searchInput, setSearchInput] = useState('')
const deferredSearch = useDeferredValue(searchInput)
const isStale = searchInput !== deferredSearch

// Filter uses deferredSearch — lags behind input
const filtered = useMemo(() => {
  return matches.filter(m => m.name.includes(deferredSearch))
}, [matches, deferredSearch])

// Input uses searchInput — always instant
<input value={searchInput} onChange={e => setSearchInput(e.target.value)} />
```

**Interview Q:** *"When would you use useDeferredValue over debouncing?"*
A: useDeferredValue is CPU-adaptive — React decides when to commit the deferred
value based on available CPU time. With debouncing, 300ms might be too slow on fast
machines and too fast on slow ones. useDeferredValue lets React be smart about it.
It also doesn't introduce artificial delays on fast hardware.

---

## 12. useLayoutEffect

**What it does:** Like useEffect, but fires SYNCHRONOUSLY after DOM mutations and
BEFORE the browser paints. Used for DOM measurements.

**Signature:** Same as useEffect.

**When to use:**
- Reading DOM measurements (width, height, scroll position)
- Synchronously mutating the DOM after React updates it
- Preventing visual flicker from layout jumps

**useEffect vs useLayoutEffect:**
```
RENDER → DOM update → useLayoutEffect → browser paint → useEffect
```

useLayoutEffect runs before the user sees the page, so DOM measurements
and mutations happen "invisibly" — no flicker.

**Warning:** useLayoutEffect is synchronous and blocks painting. Heavy work here
causes frame drops. Use it only for DOM measurements, not data fetching.

**Where in the app:**
- `ProfileCard.jsx`: Measures card dimensions right after it renders
  Using useEffect here would cause one frame where dimensions are 0

```js
// From ProfileCard.jsx
const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

useLayoutEffect(() => {
  if (cardRef.current) {
    const { width, height } = cardRef.current.getBoundingClientRect()
    setDimensions({ width: Math.round(width), height: Math.round(height) })
  }
}, []) // Measure once after first paint
```

**SSR note:** useLayoutEffect doesn't run on the server.
For SSR-safe measurement, use useEffect and accept one frame of inaccuracy,
or use a library that handles the SSR case.

---

## 13. useImperativeHandle + forwardRef

**What it does:** Customizes the ref value that a parent component gets when they
attach a ref to a child component.

**Why it exists:**
By default, React doesn't let you put a ref on a function component.
`forwardRef` enables this. Then `useImperativeHandle` controls WHAT the parent can access.

```js
// Child — exposes a controlled API
const MyInput = forwardRef(function MyInput(props, ref) {
  const inputRef = useRef(null)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => inputRef.current.value = '',
    // NOT exposing the raw DOM node — parent can only call these methods
  }), [])

  return <input ref={inputRef} {...props} />
})

// Parent — calls controlled methods
const inputRef = useRef(null)
<MyInput ref={inputRef} />
inputRef.current.focus() // Works!
inputRef.current.style   // ERROR — not exposed!
```

**Philosophy:** useImperativeHandle follows "principle of least privilege."
Don't expose the raw DOM node (too much power); expose only what's needed.

**Where in the app:**
- `ProfileCard.jsx`: Exposes `swipeLeft()`, `swipeRight()`, `swipeSuperLike()`, `getDimensions()`
- `SwipeStack.jsx`: Calls `topCardRef.current.swipeRight()` from action buttons

This allows buttons ("Like", "Pass") to trigger the same action as dragging the card,
without having access to the card's internal DOM or implementation details.

**Interview Q:** *"When would you use useImperativeHandle in production?"*
A: For component libraries (date pickers, modals, inputs, carousels) where consumers
need programmatic control without coupling to internals. Examples: calling `.open()` on
a modal, `.scrollToItem(id)` on a virtual list, `.reset()` on a form. It's the escape
hatch for imperative interactions that don't fit React's declarative model.

---

## 14. Custom Hooks

**What they are:** Regular JavaScript functions that:
1. Start with `use`
2. Can call other hooks
3. Return whatever the consumer needs

**Why they matter:**
Custom hooks extract stateful logic from components into reusable units.
The same logic can be shared across components without HOCs or render props.

### useLocalStorage (src/hooks/useLocalStorage.js)
```js
const [value, setValue, removeValue] = useLocalStorage('key', defaultValue)
```
Syncs state with localStorage. Demonstrates lazy initialization and cleanup.

### useDebounce (src/hooks/useDebounce.js)
```js
const debouncedValue = useDebounce(rawValue, 300)
```
Delays value updates. Demonstrates useEffect cleanup pattern (timer cancellation).

### useSwipe (src/hooks/useSwipe.js)
```js
const { position, rotation, direction, dragHandlers } = useSwipe({
  onSwipeLeft, onSwipeRight, threshold: 100
})
```
Encapsulates touch/mouse drag logic. Demonstrates useRef vs useState for performance.

### useOnlineStatus (src/hooks/useOnlineStatus.js)
```js
const isOnline = useOnlineStatus()
```
Subscribes to browser network events. Shows the subscribe/cleanup pattern.

### useIntersectionObserver (src/hooks/useIntersectionObserver.js)
```js
const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.8 })
```
Detects when an element enters the viewport (lazy loading, read receipts).

**Custom hook interview tips:**
- Name starts with `use` (required — enables linting rules)
- Each call to a custom hook creates ISOLATED state (not shared)
- Custom hooks don't share state — they share LOGIC
- You can test custom hooks directly with `renderHook` from @testing-library/react

```js
// Two components using the same custom hook have SEPARATE state
function ComponentA() { const [v, setV] = useLocalStorage('key', 0) }
function ComponentB() { const [v, setV] = useLocalStorage('key', 0) }
// ComponentA's state and ComponentB's state are independent
```

---

## 15. RULES OF HOOKS

These are enforced by the `eslint-plugin-react-hooks` linter.

### Rule 1: Only call hooks at the TOP LEVEL
```js
// BAD
if (condition) {
  const [state, setState] = useState(0) // breaks slot ordering!
}

// BAD
for (let i = 0; i < 3; i++) {
  useEffect(() => {}) // different number of hooks per render!
}

// GOOD — always at the top level
const [state, setState] = useState(0)
if (condition) { /* use state here */ }
```

**Why:** React identifies hooks by their call order. If the order changes between renders,
React reads the wrong slot and state gets corrupted.

### Rule 2: Only call hooks in React functions
- Function components ✓
- Custom hooks ✓
- Class components ✗
- Regular JavaScript functions ✗
- Event handlers ✗ (unless the event handler IS a component... it's not)

---

## 16. HOOK DECISION TREE

```
Need to store UI state?
├── Simple value (boolean, string, number) → useState
├── Complex state with multiple fields → useReducer
└── Needs to persist to disk → useLocalStorage (custom)

Need to run side effects?
├── After paint (API calls, subscriptions) → useEffect
├── Before paint (DOM measurements) → useLayoutEffect
└── Both? Use useLayoutEffect for measurements, useEffect for everything else

Need to share state across components?
├── Parent-child → props
├── Distant relatives → useContext
└── Complex global state → useContext + useReducer

Need to optimize performance?
├── Expensive computation → useMemo
├── Stable function reference → useCallback
├── Non-urgent state update → useTransition
└── Non-urgent value → useDeferredValue

Need to access DOM imperatively?
├── Reference to DOM node → useRef
└── Expose API from child to parent → useImperativeHandle + forwardRef

Need a unique ID?
└── useId

Need reusable stateful logic?
└── Custom hook
```

---

## 17. COMMON INTERVIEW QUESTIONS

**Q: What causes a component to re-render?**
A: (1) setState called with a new value, (2) parent re-renders, (3) context value changes,
(4) forceUpdate (class components). React.memo can prevent re-renders from (2) if props are same.

**Q: What is the "stale closure" problem?**
A: When a useEffect or event handler captures a value from a previous render.
Example: setInterval closing over `count = 0` even after count has been updated.
Fix: use the functional update form `setCount(prev => prev + 1)` or add `count` to deps.

**Q: Explain the useEffect dependency array.**
A: It tells React when to re-run the effect. React uses Object.is() to compare values.
Missing deps cause stale data bugs. Extra deps cause unnecessary re-runs.
The `exhaustive-deps` ESLint rule helps catch both.

**Q: How do you avoid prop drilling?**
A: (1) Context API + useContext, (2) Component composition (render props), (3) State
management (Redux, Zustand, Jotai), (4) Lifting state up to a common ancestor.

**Q: What is React reconciliation?**
A: The algorithm that determines what changed between renders. React compares the
previous and new virtual DOM trees (diffing). Uses the `key` prop to identify list items.
If keys change, React unmounts/remounts — if they're stable, it updates in-place.

**Q: When does React batch state updates?**
A: React 18 batches ALL setState calls automatically (event handlers, timeouts, Promises,
native events). Before React 18, only event handlers were batched. Use `flushSync` from
react-dom to opt out of batching when needed.

**Q: What's the difference between controlled and uncontrolled inputs?**
A: Controlled: value driven by React state (`value={state}` + `onChange`). React is the source of truth.
Uncontrolled: DOM is the source of truth, accessed via `useRef`. Controlled is preferred for validation,
dynamic fields, and resetting. Uncontrolled is simpler for file inputs and large forms.

**Q: How would you optimize a slow React app?**
A: (1) React.memo to skip re-renders of pure components, (2) useMemo for expensive computations,
(3) useCallback for stable callbacks passed to memoized children, (4) virtualization (react-window)
for large lists, (5) code splitting (React.lazy + Suspense), (6) useTransition for non-urgent updates,
(7) Profile with React DevTools Profiler before optimizing.

---

## 18. PERFORMANCE PATTERNS

### React.memo — skip re-renders
```js
const ProfileCard = React.memo(function ProfileCard({ profile, onClick }) {
  return <div>{profile.name}</div>
})
// Only re-renders when profile or onClick reference changes
```

### Stable references (useMemo + useCallback)
```js
// Without memoization: new object every render → ProfileCard always re-renders
const user = { name, age }  // new reference!

// With memoization: same reference until name/age changes
const user = useMemo(() => ({ name, age }), [name, age])
```

### Virtualization — only render visible items
```js
import { FixedSizeList } from 'react-window'
// Renders only ~10 items in DOM even with 10,000 items in the list
<FixedSizeList height={500} itemCount={10000} itemSize={60}>
  {({ index, style }) => <div style={style}>{items[index].name}</div>}
</FixedSizeList>
```

### Code splitting — load on demand
```js
const ProfileSettings = React.lazy(() => import('./ProfileSettings'))
<Suspense fallback={<Spinner />}>
  <ProfileSettings />
</Suspense>
```

---

## 19. ANTI-PATTERNS TO AVOID

### 1. Derived state in useState
```js
// BAD — filter is derived from profiles, keep it derived
const [profiles, setProfiles] = useState([])
const [filtered, setFiltered] = useState([]) // redundant!

// GOOD — compute it
const filtered = useMemo(() => profiles.filter(...), [profiles])
```

### 2. useEffect for derived state
```js
// BAD — unnecessary effect just to compute derived state
const [fullName, setFullName] = useState('')
useEffect(() => {
  setFullName(`${firstName} ${lastName}`)
}, [firstName, lastName])

// GOOD — just compute it during render
const fullName = `${firstName} ${lastName}`
```

### 3. Missing cleanup in useEffect
```js
// BAD — interval keeps running after unmount
useEffect(() => {
  setInterval(() => setCount(c => c + 1), 1000)
}, [])

// GOOD
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000)
  return () => clearInterval(id)  // cleanup!
}, [])
```

### 4. Object/array in deps without memoization
```js
// BAD — { id: 1 } is a NEW object every render → infinite loop
useEffect(() => { fetch(user) }, [{ id: 1 }])

// GOOD
useEffect(() => { fetch(userId) }, [userId])
```

### 5. Over-memoizing
```js
// BAD — useMemo overhead > computation cost
const doubled = useMemo(() => count * 2, [count])

// GOOD — just compute it
const doubled = count * 2
```

### 6. Calling hooks conditionally
```js
// BAD — breaks hook ordering rules
if (isLoggedIn) {
  const user = useContext(AuthContext) // ERROR!
}

// GOOD
const auth = useContext(AuthContext)
if (isLoggedIn) { /* use auth */ }
```

---

## Quick Reference Card

| Hook                  | Returns               | Triggers re-render | Timing          |
|-----------------------|-----------------------|--------------------|-----------------|
| useState              | [value, setter]       | YES                | Before paint    |
| useReducer            | [state, dispatch]     | YES                | Before paint    |
| useEffect             | cleanup fn            | NO                 | After paint     |
| useLayoutEffect       | cleanup fn            | NO                 | Before paint    |
| useRef                | { current }           | NO                 | Anytime         |
| useMemo               | memoized value        | NO                 | During render   |
| useCallback           | memoized function     | NO                 | During render   |
| useContext            | context value         | YES (on change)    | During render   |
| useId                 | unique string ID      | NO                 | During render   |
| useTransition         | [isPending, startFn]  | YES (isPending)    | Deferred        |
| useDeferredValue      | deferred value        | YES (when ready)   | Deferred        |
| useImperativeHandle   | void                  | NO                 | After layout    |

---

*Good luck with the interview. Study the WHY behind each hook, not just the API.
Interviewers at senior level test your understanding of React's rendering model.*
