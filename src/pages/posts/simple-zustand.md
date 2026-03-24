---
title: simple zustand
description: 
date: 2026-02-04T16:00:00.000+00:00
duration: 3min
---


```javascript


export function create(createState: any) {
  let state: any
  const listeners = new Set<(state: any, prevState: any) => void>()
  const getState = () => state
  const setState = (partial: unknown) => {
    const prevState = state
    if (typeof partial === 'function') {
      state = { ...state, ...partial(state) }
    }
    else if (typeof partial === 'object' && partial !== null) {
      state = { ...state, ...partial }
    }
    listeners.forEach(l => l(state, prevState))
  }
  const subscribe = (l: (state: any, prevState: any) => void) => {
    listeners.add(l)
    return () => { listeners.delete(l) }
  }

  const api = { setState, getState, subscribe }
  state = createState(setState, getState)
  return api
}


interface Store {
  count: number
  increment: any
}

const store = create(set => ({
  count: 0,
  increment: () => set((state: Store) => ({ count: state.count + 1 })),
}))

export function useStore() {
  const [,tick] = useState(0)
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      tick(prev => prev + 1)
    })
    return () => unsubscribe()
  }, [])
  return [store.getState()]
}
```


```tsx
export default function Component() {
  const state = useClickPathStore.getState()
  const [store] = useStore()
  return (
    <div>
      <div onClick={store.increment}>
        Count:
        {' '}
        {store.count}
      </div>
    </div>
  )
}
```


