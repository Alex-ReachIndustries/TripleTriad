export type Element = 'Earth' | 'Fire' | 'Water' | 'Poison' | 'Holy' | 'Lightning' | 'Wind' | 'Ice' | null

export interface Card {
  id: string
  name: string
  level: number
  top: number
  right: number
  bottom: number
  left: number
  element: Element
}

export function rankLabel(n: number): string {
  return n === 10 ? 'A' : String(n)
}
