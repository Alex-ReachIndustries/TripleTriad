/**
 * Tutorial definitions — triggered when new game mechanics are encountered.
 * Each tutorial has 1-3 pages explaining the mechanic.
 */

import type { SpecialRule } from '../types/world'

export interface TutorialPage {
  heading: string
  body: string
  icon: string
}

export interface Tutorial {
  id: string
  title: string
  pages: TutorialPage[]
}

/** Trigger conditions for automatically showing tutorials. */
export type TutorialTrigger =
  | { type: 'first_duel' }
  | { type: 'special_rule'; rule: SpecialRule }
  | { type: 'trade_rule'; rule: string }
  | { type: 'rule_spread' }
  | { type: 'queen_of_cards' }

export interface TutorialDef extends Tutorial {
  trigger: TutorialTrigger
}

export const TUTORIALS: TutorialDef[] = [
  {
    id: 'tut_basic_gameplay',
    title: 'How to Play',
    trigger: { type: 'first_duel' },
    pages: [
      {
        icon: '\u{1F3B4}',
        heading: 'Welcome to Triple Triad!',
        body: 'Each player has 5 cards. Take turns placing cards on a 3\u00D73 grid. When your card\'s number is higher than an adjacent opponent\'s card, you capture it!',
      },
      {
        icon: '\u{1F522}',
        heading: 'Card Numbers',
        body: 'Each card has 4 numbers: Top, Right, Bottom, Left (values 1-10, where A = 10). Compare the number facing your opponent\'s card \u2014 higher wins and flips their card to your colour.',
      },
      {
        icon: '\u{1F3C6}',
        heading: 'Winning',
        body: 'After all 9 spaces are filled, the player with more cards on the board (plus cards still in hand) wins! Keep an eye on the score at the top of the screen.',
      },
    ],
  },
  {
    id: 'tut_open',
    title: 'Open Rule',
    trigger: { type: 'special_rule', rule: 'Open' },
    pages: [
      {
        icon: '\u{1F441}\uFE0F',
        heading: 'Open',
        body: 'Both players can see each other\'s cards face-up! This lets you plan your moves strategically, knowing exactly what your opponent has.',
      },
    ],
  },
  {
    id: 'tut_trade_one',
    title: 'Trade Rule: One',
    trigger: { type: 'trade_rule', rule: 'One' },
    pages: [
      {
        icon: '\u261D\uFE0F',
        heading: 'Trade Rule: One',
        body: 'The winner picks ONE card from the loser\'s hand as a prize. Choose wisely \u2014 you can only take one! If you lose, your opponent takes one of yours.',
      },
    ],
  },
  {
    id: 'tut_same',
    title: 'Same Rule',
    trigger: { type: 'special_rule', rule: 'Same' },
    pages: [
      {
        icon: '\u{1F504}',
        heading: 'Same',
        body: 'When you place a card and TWO or more of its numbers match the adjacent numbers of neighbouring cards, all those matching cards are captured \u2014 even your opponent\'s!',
      },
      {
        icon: '\u26A1',
        heading: 'Same Combo',
        body: 'Cards captured by Same can then trigger normal number comparisons with their other sides, potentially flipping even more cards in a chain reaction!',
      },
    ],
  },
  {
    id: 'tut_elemental',
    title: 'Elemental Rule',
    trigger: { type: 'special_rule', rule: 'Elemental' },
    pages: [
      {
        icon: '\u{1F525}',
        heading: 'Elemental',
        body: 'Some board spaces have elemental icons. If your card matches the element, all its numbers get +1. If it doesn\'t match, all numbers get -1.',
      },
      {
        icon: '\u{1F4A7}',
        heading: 'Element Strategy',
        body: 'Place elemental cards on matching spaces for a boost! Be careful \u2014 placing the wrong element on a space weakens your card.',
      },
    ],
  },
  {
    id: 'tut_sudden_death',
    title: 'Sudden Death',
    trigger: { type: 'special_rule', rule: 'Sudden Death' },
    pages: [
      {
        icon: '\u{1F480}',
        heading: 'Sudden Death',
        body: 'If the game ends in a draw, it doesn\'t end! Each player takes back the cards they currently own on the board, and a new round begins. This repeats until someone wins.',
      },
    ],
  },
  {
    id: 'tut_trade_diff',
    title: 'Trade Rule: Diff',
    trigger: { type: 'trade_rule', rule: 'Diff' },
    pages: [
      {
        icon: '\u2696\uFE0F',
        heading: 'Trade Rule: Diff',
        body: 'The winner takes cards equal to the score DIFFERENCE. Win 6-4? You take 2 cards. A dominant victory means more prizes \u2014 so every capture counts!',
      },
    ],
  },
  {
    id: 'tut_plus',
    title: 'Plus Rule',
    trigger: { type: 'special_rule', rule: 'Plus' },
    pages: [
      {
        icon: '\u2795',
        heading: 'Plus',
        body: 'When you place a card and the SUM of your card\'s number + an adjacent card\'s number is the same for two or more sides, all those adjacent cards are captured!',
      },
      {
        icon: '\u{1F9EE}',
        heading: 'Plus Example',
        body: 'Your card has Right=3, Bottom=7. The card to the right has Left=5, the card below has Top=1. Sums: 3+5=8 and 7+1=8 \u2014 Same sums! Both captured!',
      },
    ],
  },
  {
    id: 'tut_random',
    title: 'Random Rule',
    trigger: { type: 'special_rule', rule: 'Random' },
    pages: [
      {
        icon: '\u{1F3B2}',
        heading: 'Random',
        body: 'Your hand of 5 cards is chosen randomly from your deck! You can\'t pick which cards to play \u2014 you get a random selection. Build a strong, well-rounded deck to compensate.',
      },
    ],
  },
  {
    id: 'tut_combo',
    title: 'Combo Rule',
    trigger: { type: 'special_rule', rule: 'Combo' },
    pages: [
      {
        icon: '\u{1F4A5}',
        heading: 'Combo',
        body: 'When Same or Plus captures cards, those captured cards then check their OTHER sides against adjacent cards using normal number rules. This can cause chain reactions of captures!',
      },
      {
        icon: '\u26D3\uFE0F',
        heading: 'Chain Reactions',
        body: 'A single well-placed card can flip the entire board! Combo makes Same and Plus much more powerful \u2014 look for placements that trigger cascading captures.',
      },
    ],
  },
  {
    id: 'tut_trade_direct',
    title: 'Trade Rule: Direct',
    trigger: { type: 'trade_rule', rule: 'Direct' },
    pages: [
      {
        icon: '\u{1F91D}',
        heading: 'Trade Rule: Direct',
        body: 'Each player takes the cards they captured during the game. Whatever cards you flipped to your colour on the board, you keep! The loser keeps their remaining cards.',
      },
    ],
  },
  {
    id: 'tut_same_wall',
    title: 'Same Wall Rule',
    trigger: { type: 'special_rule', rule: 'Same Wall' },
    pages: [
      {
        icon: '\u{1F9F1}',
        heading: 'Same Wall',
        body: 'The edges of the board count as value 10 (A) for the Same rule! Place a card with A on the wall edge and it counts as matching \u2014 making Same captures easier near walls.',
      },
    ],
  },
  {
    id: 'tut_trade_all',
    title: 'Trade Rule: All',
    trigger: { type: 'trade_rule', rule: 'All' },
    pages: [
      {
        icon: '\u{1F4B0}',
        heading: 'Trade Rule: All',
        body: 'Winner takes ALL! The loser gives every single card from their hand to the winner. The highest stakes \u2014 make sure your deck is one you\'re willing to bet!',
      },
    ],
  },
  {
    id: 'tut_rule_spreading',
    title: 'Rule Spreading',
    trigger: { type: 'rule_spread' },
    pages: [
      {
        icon: '\u{1F30D}',
        heading: 'Rule Spreading',
        body: 'As you travel between regions, card game rules can spread! When you duel in a new region, there\'s a chance rules from your previous region will be adopted here.',
      },
      {
        icon: '\u{1F6AB}',
        heading: 'Rule Abolishment',
        body: 'Sometimes a local rule may be abolished when foreign rules arrive. Check the region rules before each duel \u2014 they may have changed since your last visit!',
      },
    ],
  },
  {
    id: 'tut_queen_of_cards',
    title: 'Queen of Cards',
    trigger: { type: 'queen_of_cards' },
    pages: [
      {
        icon: '\u{1F451}',
        heading: 'Queen of Cards',
        body: 'The Queen of Cards can manipulate rules across the world! For a fee, she can spread a rule to any region or abolish an unwanted rule.',
      },
      {
        icon: '\u{1F4B8}',
        heading: 'Her Services',
        body: 'Spreading a rule costs 1000 Gil. Abolishing a rule costs 500 Gil. Use her wisely to shape the card game rules in your favour!',
      },
    ],
  },
  {
    id: 'tut_trade_friendly',
    title: 'Friendly Trade Rule',
    trigger: { type: 'trade_rule', rule: 'Friendly' },
    pages: [
      {
        icon: '\u{1F91D}',
        heading: 'Friendly Match',
        body: 'This is a friendly duel \u2014 no cards will be exchanged after the match! Play without fear of losing your best cards.',
      },
    ],
  },
]

/** Get a tutorial by ID. */
export function getTutorialById(id: string): TutorialDef | undefined {
  return TUTORIALS.find(t => t.id === id)
}

/** Get all tutorials that should trigger for a given set of special rules and trade rule. */
export function getTutorialsForRules(
  specialRules: string[],
  tradeRule: string,
  seenTutorials: string[],
  isFirstDuel: boolean,
): TutorialDef[] {
  const unseen: TutorialDef[] = []

  for (const tut of TUTORIALS) {
    if (seenTutorials.includes(tut.id)) continue

    switch (tut.trigger.type) {
      case 'first_duel':
        if (isFirstDuel) unseen.push(tut)
        break
      case 'special_rule':
        if (specialRules.includes(tut.trigger.rule)) unseen.push(tut)
        break
      case 'trade_rule':
        if (tradeRule === tut.trigger.rule) unseen.push(tut)
        break
      // rule_spread and queen_of_cards are triggered elsewhere
    }
  }

  return unseen
}
