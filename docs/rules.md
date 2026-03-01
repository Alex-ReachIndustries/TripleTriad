# Triple Triad – Rules (Special, Regional, Trade)

Source: [Triple Triad (Final Fantasy VIII) – Final Fantasy Wiki](https://finalfantasy.fandom.com/wiki/Triple_Triad_(Final_Fantasy_VIII))

## Special rules (game mechanics)

| Rule        | Description |
|------------|-------------|
| **Open**   | Player can see the opponent’s hand (which five cards they are using). |
| **Same**   | When your card is placed next to two or more (opponent) cards and the **touching sides have the same rank** (e.g. 8 vs 8), those adjacent cards are captured. **Combo** applies. |
| **Same Wall** | Board edges count as rank **A** (10) for Same. Combo applies. Has no effect without Same; can still be “carried” and spread. |
| **Sudden Death** | If the game ends in a draw, a new game starts with the same board (same positions and colors); play continues until one side has more cards. |
| **Random** | Your five cards are chosen **at random** from your deck instead of you choosing them. |
| **Plus**   | When your card touches two cards and the **sums** of (your rank + their rank) for each pair are **equal**, both of those cards are captured. Combo applies. |
| **Combo**  | When Same, Same Wall, or Plus captures cards, any card **adjacent** to a newly captured card is also captured if the rank on the side facing the captured card is **lower**. Always active with Same/Plus. |
| **Elemental** | Some board spaces get a random element. Your card on **matching** element: +1 to all four ranks on that space. **Non-matching** element: −1. Same/Plus/Same Wall use **original** ranks. |

**Retry** is listed in the wiki as dummied/unused in the original game.

---

## Rules per region (default)

When playing in a region, that region’s **default** special rules apply unless mixed rules or the Queen of Cards change them.

| Region    | Areas / players | Default rules |
|----------|------------------|--------------|
| **Balamb** | Balamb Town, Balamb Garden, CC Jack (endgame) | Open |
| **Galbadia** | Timber, Forest Owls' Base, Galbadia Garden & East Train Station, Deling City, D-District Prison, Watts (White SeeD Ship) | Same |
| **Dollet** | Dollet, CC Club (endgame) | Random, Elemental |
| **FH** (Fisherman’s Horizon) | Fisherman’s Horizon, CC Heart (endgame) | Elemental, Sudden Death |
| **Trabia** | T-Garden Student (G-Garden locker room), Trabia Garden, Shumi Village, CC Diamond (endgame) | Random, Plus |
| **Centra** | Winhill, Edea’s House, CC Joker (endgame) | Same, Plus, Random |
| **Esthar** | Esthar City, Lunatic Pandora Laboratory, President (Ragnarok), CC Spade (endgame) | Elemental, Same Wall* |
| **Lunar** | Lunar Gate, Lunar Base, Lunar Base Crash Site, CC King (endgame) | Open, Same, Plus, Elemental, Same Wall, Random, Sudden Death |

\* Same Wall in Esthar has no effect until **Same** is spread to the region.

**Student Skipping Class** (Balamb Town harbor): Plays with **no rules**; playing him clears Balamb of all special rules (including Open). Does not affect trade rules.

---

## Mixed rules and rule spread/abolish

- When you challenge someone in a **different** region, they may offer a **mixed-rules** game (both your previous region’s rules and the new region’s rules). This only happens if your previous region had at least one rule the new region doesn’t have.
- After a mixed-rules game (win, lose, or **quit**), one of three things is chosen at random:
  1. A rule from the previous region **spreads** to the new region.
  2. A rule in the new region is **abolished** in that region.
  3. **No change**.
- You can refuse mixed rules; eventually the opponent will offer a normal game with only their region’s rules.
- Even in a region that already has every rule (e.g. Lunar), playing there can still randomly **abolish** a rule after some games.

---

## Trade rules (what the winner takes)

| Rule        | Rank | Description |
|------------|------|-------------|
| **One**    | 1    | Winner chooses **one** card from the loser. |
| **Difference (Diff)** | 2 | Winner takes **one card per point of score difference** (e.g. 6–4 → 2 cards). |
| **Direct** | 3    | Each player keeps the cards that are **their color** on the board at the end (no “choosing from loser”). |
| **All**    | 4    | Winner takes **all** of the loser’s cards that were in play (or all cards used in the match, depending on interpretation; typically “winner takes all cards that were in the game”). |

Trade rule changes are triggered when **asking** someone to play (before the rules screen or the match). The current trade rule can change in three ways:

1. **Queen of Cards**: If she is in the region, each challenge in that region has ~1/3 chance to make the region adopt her **personal** trade rule. Challenging the Queen has ~6/7 chance to move her personal rule one step up or down after the region rule check.
2. **Dominance**: Each challenge has a chance that the **dominant region’s** trade rule is adopted by a random region. Playing in the dominant region increases its Dominance (max 10); playing elsewhere decreases that region’s Dominance or makes a new region dominant. The Queen tells you which region is dominant.
3. **Degeneration**: When dominance is triggered, there is a chance a random region adopts **One**. A “degeneration” counter builds; when it’s high enough, the Queen says people are avoiding risky trades.

For implementation, at minimum: support **One**, **Difference**, **Direct**, and **All** as trade rule options per game or per region, and optionally model spread/dominance/Queen for single-player.

This document is the reference for implementing special rules, regional defaults, and trade rules in the app.
