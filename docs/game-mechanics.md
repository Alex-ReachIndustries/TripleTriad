# Triple Triad – Game Mechanics

Source: [Triple Triad (Final Fantasy VIII) – Final Fantasy Wiki](https://finalfantasy.fandom.com/wiki/Triple_Triad_(Final_Fantasy_VIII))

## Overview

Triple Triad is a two-player card game played on a **3×3 grid**. Each player has **five cards**. The goal is to finish with a **majority of the total ten cards** (including the one card left in the second player’s hand) in your color.

## Setup

- **Grid**: 3×3 square of empty spaces.
- **Cards**: Each card has four **ranks** (numbers), one per side: **top**, **right**, **bottom**, **left**. Ranks are 1–10; **10 is shown as A**.
- **Elements**: Some cards have an element (Earth, Fire, Water, Poison, Holy, Lightning, Wind, Ice) shown in the upper-right; used only when the **Elemental** rule is active.
- **Colors**: Player’s cards = blue; Opponent’s cards = pink/red.
- **First player**: Chosen by coin flip. That player plays first.

## Flow of play

1. **Turn order**: Players alternate. Each turn, the active player plays **one card** from their hand onto **any empty space** on the grid.
2. **First turn**: The player who won the coin flip chooses one card and places it on any of the nine spaces.
3. **Later turns**: The other player places a card on any unoccupied space, and so on.
4. **Second player’s extra card**: The player who goes second still has one card left in hand when the board is full; that card **counts as theirs** for the final score (so there are effectively 10 “placed” cards for scoring).

## Capture rules

When you place a card **adjacent** to an opponent’s card:

- Compare the **rank on your card’s side** that touches the opponent’s card with the **rank on the opponent’s side** that touches your card.
- If **your rank is higher**, the opponent’s card is **captured**: it flips to your color.
- If ranks are equal or yours is lower, no capture.
- Captures are resolved using the card’s **current** ranks (after any Elemental rule modifiers on the board). **Same / Same Wall / Plus** use **original** (unmodified) ranks.

Multiple adjacent opponent cards can be captured in one turn if each touching side wins.

## Winning

- Count how many of the ten cards (nine on board + one in hand for the second player) are your color.
- **Win**: You have **more** than half (i.e. 6 or more).
- **Draw**: Each player has 5.
- **Loss**: Opponent has 6 or more.

## Draw and Sudden Death

- **Normal**: A draw ends the game as a tie; no card exchange (depending on trade rules, nothing is taken).
- **Sudden Death (rule)**: If the game is a draw, a **new game** is started with the **same cards already on the board** in the same positions and colors. Play continues (each player has 0 cards in hand) until one player has more cards in their color. No new cards are placed; only the existing board state is used to determine the winner.

## Rule-specific behavior

- **Same**: If your newly placed card touches two or more (opponent) cards and the **touching ranks are equal** (e.g. 8 vs 8), those adjacent cards are flipped. Combo applies.
- **Same Wall**: Board edges count as rank **A** (10) for Same. Combo applies. Only matters when Same is present.
- **Plus**: If your card touches two cards and the **sums** (your rank + their rank) for each pair are **equal**, both of those cards are captured. Combo applies.
- **Combo**: When Same or Plus causes a capture, any card adjacent to a **newly captured** card whose rank is **lower** than the capturing side is also captured. Not a separate rule; always on with Same/Plus.
- **Elemental**: Some board spaces get a random element. Matching element: +1 to all ranks of your card on that space. Non-matching: −1. Same/Plus/Same Wall use **original** ranks, not the ±1.

## Opponent hand behavior (original game)

- Opponents draw from a level-based pool; no duplicate cards in a single hand.
- Rare cards (e.g. GF/character) typically at most one per hand unless they already took yours.

This document is the reference for implementing the core flow, capture logic, and win/draw/sudden death in the app.
