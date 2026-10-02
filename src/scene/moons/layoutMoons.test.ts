import { describe, expect, it } from 'vitest'
import { layoutMoons, MORE_ID } from './layoutMoons'

const works = (n: number, featured: number[] = []) =>
  Array.from({ length: n }, (_, i) => ({ id: `work-${i}`, featured: featured.includes(i) }))

/** Smallest angular gap between moons sharing a shell. */
function minGap(slots: ReturnType<typeof layoutMoons>['slots']) {
  let min = Infinity
  const shells = new Set(slots.map((s) => s.shell))
  for (const k of shells) {
    const a = slots.filter((s) => s.shell === k).map((s) => ((s.phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).sort((x, y) => x - y)
    if (a.length < 2) continue
    for (let i = 0; i < a.length; i++) min = Math.min(min, (a[(i + 1) % a.length] - a[i] + 2 * Math.PI) % (2 * Math.PI))
  }
  return min
}

describe('layoutMoons', () => {
  it('handles no works', () => {
    const l = layoutMoons([], 1)
    expect(l.slots).toHaveLength(0)
    expect(l.extent).toBe(1)
  })

  it('puts a single work on one orbit outside the planet', () => {
    const l = layoutMoons(works(1), 1)
    expect(l.slots).toHaveLength(1)
    expect(l.slots[0].radius).toBeGreaterThan(1.5)
  })

  it('gives every work a moon up to maxVisible, with no "+N" moon', () => {
    const l = layoutMoons(works(8), 1, 8)
    expect(l.slots).toHaveLength(8)
    expect(l.overflow).toHaveLength(0)
    expect(l.slots.some((s) => s.id === MORE_ID)).toBe(false)
  })

  it('caps visible moons and adds a "+N" moon when over the limit', () => {
    const l = layoutMoons(works(12, [11]), 1, 8)
    expect(l.slots).toHaveLength(8)
    expect(l.slots.at(-1)!.id).toBe(MORE_ID)
    expect(l.overflow).toHaveLength(5)
    // Featured works are always visible.
    expect(l.slots.some((s) => s.id === 'work-11')).toBe(true)
  })

  it('keeps moons on a shell well separated', () => {
    for (const n of [2, 5, 9, 12, 20]) {
      const l = layoutMoons(works(n), 1, 30)
      // Even spacing minus at most 30% jitter on each side.
      expect(minGap(l.slots)).toBeGreaterThan(((2 * Math.PI) / 9) * 0.6)
    }
  })

  it('grows outward and slows down with more works', () => {
    const small = layoutMoons(works(3), 1)
    const big = layoutMoons(works(12), 1, 12)
    expect(big.extent).toBeGreaterThan(small.extent)
    const inner = big.slots.find((s) => s.shell === 0)!
    const outer = big.slots.find((s) => s.shell === Math.max(...big.slots.map((x) => x.shell)))!
    expect(outer.speed).toBeLessThan(inner.speed)
  })

  it('is deterministic and stable when a work is added', () => {
    const a = layoutMoons(works(4), 1)
    const b = layoutMoons(works(4), 1)
    expect(a).toEqual(b)
    // Adding a 5th work to the same shell changes spacing, but each moon keeps its own jitter.
    const c = layoutMoons(works(5), 1)
    expect(c.slots.map((s) => s.id).slice(0, 4)).toEqual(a.slots.map((s) => s.id))
  })
})
