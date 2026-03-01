# Triple Triad – Card List (FFVIII)

Source: [Final Fantasy VIII Triple Triad cards](https://finalfantasy.fandom.com/wiki/Final_Fantasy_VIII_Triple_Triad_cards) and individual card pages.

## Card structure

Each card has:

- **Name**: Display name (e.g. Geezard, Squall).
- **Level**: 1–10. Level 1–5 = monster, 6–7 = boss, 8–9 = GF, 10 = player. Higher level ≈ stronger ranks in general.
- **Ranks**: Four values for **top**, **right**, **bottom**, **left**. Each is 1–10 (10 shown as **A** in-game). Order is fixed: top, right, bottom, left (clockwise from top).
- **Element** (optional): Earth, Fire, Water, Poison, Holy, Lightning, Wind, Ice. Used only when the **Elemental** rule is active.
- **Rarity**: Level 1–7 = multiple copies allowed. Level 8–10 = **one-of-a-kind** (GF and player cards); only one in the deck at a time.

**Starter deck (Squall)**: The seven cards given at the start are Level 1. In the original game they are obtained from the man in front of the elevator on 2F Balamb Garden (Geezard, Funguar, Red Bat, etc.). For our game, treat a fixed set of seven Level 1 cards as the protected “starter” deck that cannot be lost.

**Example (from wiki)**: Geezard — Level 1, no element. Ranks: **Top 1, Right 5, Bottom 4, Left 1**.

Exact ranks for all 110 cards can be found on the Fandom wiki (e.g. [Geezard](https://finalfantasy.fandom.com/wiki/Geezard_(Final_Fantasy_VIII_card))). For implementation, use `docs/cards-data.json` (or similar) as the single source of truth; the table below is the canonical name/level/element list.

---

## Monster cards (Level 1–5)

### Level 1 (11 cards)

| Name            | Element   | Notes        |
|-----------------|-----------|-------------|
| Geezard         | —         | Ranks: 1, 5, 4, 1 |
| Funguar         | —         | |
| Bite Bug        | —         | |
| Red Bat         | —         | |
| Blobra          | —         | |
| Gayla           | Lightning | |
| Gesper          | —         | |
| Fastitocalon-F  | Earth     | |
| Blood Soul      | —         | |
| Caterchipillar  | —         | |
| Cockatrice      | Lightning | |

### Level 2 (11 cards)

| Name        | Element   |
|-------------|-----------|
| Grat        | —         |
| Buel        | —         |
| Mesmerize   | —         |
| Glacial Eye | Ice       |
| Belhelmel   | —         |
| Thrustaevis | Wind      |
| Anacondaur  | Poison    |
| Creeps      | Lightning |
| Grendel     | Lightning |
| Jelleye     | —         |
| Grand Mantis| —         |

### Level 3 (11 cards)

| Name        | Element |
|-------------|---------|
| Forbidden   | —       |
| Armadodo    | Earth   |
| Tri-Face    | Poison  |
| Fastitocalon| Earth   |
| Snow Lion   | Ice     |
| Ochu        | —       |
| SAM08G      | Fire    |
| Death Claw   | Fire   |
| Cactuar     | —       |
| Tonberry    | —       |
| Abyss Worm  | —       |

### Level 4 (11 cards)

| Name        | Element |
|-------------|---------|
| Turtapod    | —       |
| Vysage      | —       |
| T-Rexaur    | —       |
| Bomb        | Fire    |
| Blitz       | —       |
| Wendigo     | —       |
| Torama      | —       |
| Imp         | —       |
| Blue Dragon | —       |
| Adamantoise | —       |
| Hexadragon  | Fire    |

### Level 5 (11 cards)

| Name         | Element | Notes              |
|--------------|---------|--------------------|
| Iron Giant   | —       |                    |
| Behemoth     | —       |                    |
| Chimera      | —       |                    |
| PuPu         | —       | Rare; one-of-a-kind (UFO quest) |
| Elastoid     | —       |                    |
| GIM47N       | —       |                    |
| Malboro      | —       |                    |
| Ruby Dragon  | Fire    |                    |
| Elnoyle      | —       |                    |
| Tonberry King| —       |                    |
| Wedge, Biggs | —       | (Wedge/Biggs)      |

---

## Boss cards (Level 6–7)

### Level 6 (11 cards)

| Name        |
|-------------|
| Krysta      |
| Shumi Tribe |
| Oilboyle    |
| Trauma      |
| Abadon      |
| Iguion      |
| Gerogero    |
| Granaldo    |
| X-ATM092    |
| Elvoret     |
| Fujin, Raijin|

### Level 7 (11 cards)

| Name          |
|---------------|
| Propagator    |
| Jumbo Cactuar |
| Tri-Point     |
| Gargantua     |
| Mobile Type 8 |
| Sphinxara     |
| Tiamat        |
| BGH251F2      |
| Red Giant     |
| Catoblepas    |
| Ultima Weapon |

---

## Guardian Force cards (Level 8–9, one-of-a-kind)

### Level 8 (11 cards)

| Name           |
|----------------|
| Minotaur       |
| Sacred         |
| Siren          |
| Ifrit          |
| Shiva          |
| Quezacotl      |
| Chicobo        |
| MiniMog        |
| Gilgamesh      |
| Angelo         |
| Chubby Chocobo |

### Level 9 (11 cards)

| Name      |
|-----------|
| Eden      |
| Doomtrain |
| Bahamut   |
| Phoenix   |
| Alexander |
| Cerberus  |
| Pandemona |
| Odin      |
| Leviathan |
| Diablos   |
| Carbuncle |

---

## Player cards (Level 10, one-of-a-kind)

| Name    |
|---------|
| Squall  |
| Seifer  |
| Edea    |
| Rinoa   |
| Zell    |
| Irvine  |
| Quistis |
| Selphie |
| Laguna  |
| Kiros   |
| Ward    |

---

## Total

- **Monster**: 55 (Level 1–5).
- **Boss**: 22 (Level 6–7).
- **GF**: 22 (Level 8–9).
- **Player**: 11 (Level 10).  
- **Total**: **110 cards**.

For implementation: provide a `cards-data.json` (or equivalent) with for each card: `id`, `name`, `level`, `top`, `right`, `bottom`, `left`, `element` (optional). Ranks can be filled from the wiki or from game data; level and element above are the reference.
