# World Design Guide — Triple Triad V3

## 7 Regions Overview

Based on FFVIII's canonical geography. Regions unlock in story order (0-6).

| # | Region | Rules | Trade Rule | Locations | Unlock |
|---|--------|-------|------------|-----------|--------|
| 0 | Balamb | Open | One | Balamb Town, Balamb Garden, Fire Cavern | Default (start) |
| 1 | Dollet | Random, Elemental | One | Dollet City | Beat Ifrit Guardian (Fire Cavern) |
| 2 | Galbadia | Same | One | Timber, Galbadia Garden, Deling City, D-District Prison, Winhill | Beat both duel NPCs in Dollet City |
| 3 | Fisherman's Horizon | Elemental, Sudden Death | One | Fisherman's Horizon | Beat 1 duel NPC in Winhill |
| 4 | Trabia | Random, Plus | One | Trabia Garden, Shumi Village | Beat both duel NPCs in FH |
| 5 | Centra | Same, Plus, Random | One | Edea's House, Centra Ruins | Beat Shumi Elder (Shumi Village) |
| 6 | Esthar | Elemental, Same Wall | One | Esthar City, Lunar Gate, Deep Sea Research Center | Beat Centra Guardian (Centra Ruins) |

---

## NPC Duel & Rematch System

### Duel States
Each duel NPC tracks their state relative to the player:

1. **`available`** — NPC is ready to duel (initial state). Shows challenge dialogue.
2. **`defeated`** — Player has beaten this NPC. NPC refuses to duel and shows post-defeat dialogue instead. This is a cooldown period.
3. **`rematch_available`** — Cooldown has expired. NPC shows rematch dialogue and can be challenged again.

### Cooldown → Rematch Triggers
A defeated NPC becomes available for rematch when **any** of these conditions are met:
- **Region unlock:** The player unlocks a new region (major story progression)
- **Other wins:** The player beats 3 other *unique* duel NPCs (anywhere in the world) after defeating this one
- **Quest completion:** The player completes any side quest

### Rematch Rules
- Rematched NPCs give **half** their original gil reward (diminishing returns discourage grinding one NPC)
- Rematched NPCs may pull from a slightly upgraded deck pool (occasionally include 1 card from 1 level higher)
- After a rematch win, the NPC enters cooldown again, but with a shorter trigger (2 other unique wins instead of 3)
- Win count for the NPC still increments (tracked in `npcStates`)

### Implementation
```typescript
// In WorldPlayerState
npcStates: Record<string, {
  wins: number             // Total times player has beaten this NPC
  lastDefeatedAtWins: number // Player's total unique NPC wins when this NPC was last beaten
  lastDefeatedAtRegions: number // Number of regions unlocked when last beaten
}>

// Check if NPC is available for rematch
function isRematchAvailable(npcId: string, state: WorldPlayerState): boolean {
  const npc = state.npcStates[npcId]
  if (!npc || npc.wins === 0) return true // Never beaten = available
  const totalWins = Object.values(state.npcStates).reduce((sum, n) => sum + n.wins, 0)
  const uniqueWinsSince = totalWins - npc.lastDefeatedAtWins
  const regionsUnlockedSince = state.unlockedRegions.length - npc.lastDefeatedAtRegions
  const threshold = npc.wins === 1 ? 3 : 2 // Shorter cooldown for rematches
  return uniqueWinsSince >= threshold || regionsUnlockedSince > 0
}
```

### Unlock Conditions
All location unlock conditions use **unique NPC wins** — beating the same NPC multiple times does not count multiple times toward unlocks. Every unlock condition has at least as many unique duel NPCs available as wins required.

---

## Location Types: Towns vs Dungeons

Locations are split into two distinct types with different UI and gameplay:

### Town / Field Locations
- **UI:** NPC grid/list — shows all NPCs at the location with portrait, name, and type icon
- **Gameplay:** Free-roam — player can interact with any NPC in any order
- **Contains:** Duel NPCs, shops, dialogue NPCs, tournaments, quest givers
- **Replay:** Individual NPCs follow the rematch cooldown system
- **Examples:** Balamb Town, Balamb Garden, Dollet City, Timber, Deling City, Winhill, FH, Esthar City

### Dungeon Locations
- **UI:** Vertical path/ladder showing sequential floors — current floor highlighted, completed floors checkmarked, boss floor with special icon
- **Gameplay:** Linear gauntlet — player must defeat each floor's opponent in sequence to reach the boss
- **Contains:** Only duel NPCs arranged as floors (no shops, no dialogue, no tournaments)
- **Entry:** Player selects their deck ONCE before entering — no deck changes between floors
- **Failure:** Losing on any floor kicks you back to the dungeon entrance (location screen). You keep any cards/gil won on earlier floors.
- **Boss:** Final floor opponent with better rewards, often unlocks the next region or location
- **Completion:** Once cleared, the dungeon shows a "Cleared" badge. Can be re-entered for rematches (all floors reset, follow rematch cooldown).
- **Floor narrative:** Brief flavour text between each floor to build atmosphere (e.g., "You descend deeper into the cavern... the heat intensifies.")
- **Examples:** Fire Cavern, D-District Prison, Centra Ruins, Lunar Gate, Deep Sea Research Center

### Dungeon UI Concept
```
┌─────────────────────────────────────┐
│ ← Back    FIRE CAVERN    Gil: 1200 │
├─────────────────────────────────────┤
│                                      │
│  Your Deck: [5 card preview]         │
│                                      │
│  ┌─────────────────────────────┐    │
│  │  🔥 BOSS: Ifrit Guardian    │    │
│  │     Tier ★★☆☆☆             │    │
│  └─────────────────────────────┘    │
│              │                       │
│  ┌─────────────────────────────┐    │
│  │  Floor 2: Fire Spirit       │    │
│  │     Tier ★☆☆☆☆    ✅      │    │
│  └─────────────────────────────┘    │
│              │                       │
│  ┌─────────────────────────────┐    │
│  │  Floor 1: Cave Bat          │    │
│  │     Tier ★☆☆☆☆    ✅      │    │
│  └─────────────────────────────┘    │
│                                      │
│  [Enter Dungeon] / [Continue]       │
│                                      │
│  ─── Dungeon cleared! ───           │
└─────────────────────────────────────┘
```

### Data Model Addition
```typescript
interface Location {
  id: string
  name: string
  regionId: string
  type: 'town' | 'dungeon'   // NEW: determines UI and gameplay flow
  // ... other fields
}

// Dungeon-specific: floors are ordered NPCs within the location
// NPC.order determines floor number (0 = floor 1, 1 = floor 2, ..., last = boss)
// NPC.isBoss: boolean — marks the final floor opponent
```

---

## Region Details

### Region 0: Balamb (Starter Region)
**Rules:** Open
**Description:** A small peaceful island with the prestigious Balamb Garden SeeD academy.

**Map Bounds (% of world map):** x1: 10, y1: 40, x2: 30, y2: 70

#### Locations:

**Balamb Town** (order 0, unlocked by default)
- mapX: 35, mapY: 75 (within region bounds)
- NPCs:
  - **Balamb Townsperson** (duel, tier 1) — Pool: geezard, funguar, bite_bug, red_bat, blobra, gayla, gesper, fastitocalon_f — Reward: 50 gil
    - Challenge: "Care for a friendly game? I'll go easy on you!"
    - Defeated: "Heh, you got me. Not bad for a beginner! I need to rethink my strategy..."
    - Rematch: "I've been practising since our last game. Ready for round two?"
  - **Balamb Fisher** (duel, tier 1) — Pool: geezard, funguar, red_bat, blobra, gayla, gesper, fastitocalon_f, blood_soul — Reward: 50 gil
    - Challenge: "Nothing like a card game while waiting for a bite. You in?"
    - Defeated: "You play cards better than I catch fish... I need to go think about my life choices."
    - Rematch: "The fish aren't biting today. Fancy another round of cards?"
  - **Card Shop Owner** (shop) — "Welcome! I've got cards for every budget." — Sells: cockatrice (80g), grat (120g), buel (120g)
  - **Zell** (dialogue) — "Yo! Triple Triad is the best game ever! You should check out the Garden — lots of players there." — Quest: "Zell's Request" (find_card: mesmerize → reward: 200 gil)
- **Unlock next:** Beat 1 unique duel NPC here → unlocks **Balamb Garden**

**Balamb Garden** (order 1, unlock: 1 unique win in Balamb Town)
- mapX: 55, mapY: 35
- NPCs:
  - **Garden Student** (duel, tier 1) — Pool: blood_soul, caterchipillar, cockatrice, grat, buel, mesmerize, glacial_eye, belhelmel — Reward: 75 gil
    - Challenge: "Think you can beat a SeeD candidate? Let's find out!"
    - Defeated: "I... I lost?! I need to study more. Card theory is part of the SeeD exam, you know."
    - Rematch: "I've studied every card combination in the library. This time will be different!"
  - **CC Club Jack** (duel, tier 2) — Pool: grat, buel, mesmerize, glacial_eye, belhelmel, thrustaevis, anacondaur, creeps — Reward: 100 gil
    - Challenge: "I'm Jack of the CC Group. Let's see what you've got!"
    - Defeated: "Not bad... You might be CC Group material yourself. But don't get cocky."
    - Rematch: "The CC Group demands I reclaim my honour. Let's go!"
  - **Quistis** (dialogue) — "Triple Triad teaches you to think strategically. That's a SeeD quality." — Quest: "Quistis's Test" (beat_npc: cc_club_jack → reward: card: thrustaevis)
  - **Library Girl** (shop) — "We have some cards the students donated." — Sells: mesmerize (150g), glacial_eye (180g), belhelmel (180g)
  - **Garden Tournament** (tournament) — Entry: 100 gil, Prizes: random level 2-3 card
- **Unlock next:** Beat 2 unique duel NPCs here → unlocks **Fire Cavern**

**Fire Cavern** (order 2, unlock: 2 unique wins at Balamb Garden) — **DUNGEON**
- mapX: 70, mapY: 55
- Flavour: "A volcanic cave where fire spirits dwell. The heat rises as you descend..."
- Floors:
  - **Floor 1: Cave Bat** (duel, tier 1) — Pool: geezard, funguar, bite_bug, red_bat, blobra, gayla, gesper, fastitocalon_f — Reward: 30 gil
    - Intro: "A creature stirs in the darkness... it challenges you to a duel!"
    - Defeated: *squeak*
  - **Floor 2: Fire Spirit** (duel, tier 1) — Pool: red_bat, gayla, blobra, cockatrice, grat, buel, blood_soul, caterchipillar — Reward: 50 gil
    - Intro: "Flames coalesce into a burning figure. It beckons you forward."
    - Defeated: "The flames flicker and fade..."
  - **BOSS — Ifrit Guardian** (duel, tier 2, isBoss: true) — Pool: red_bat, gayla, blobra, cockatrice, grat, buel, mesmerize, glacial_eye, belhelmel, thrustaevis — Reward: 125 gil
    - Challenge: "You dare challenge me within my cavern? So be it, mortal!"
    - Defeated: "Hmph. You have earned my respect. Perhaps the world beyond this island will test you further."
    - Rematch: "Back for more? The flames of competition never die!"
- **Completion:** Unlocks **Dollet region** (+ story cutscene)

---

### Region 1: Dollet
**Rules:** Random, Elemental
**Description:** An independent dukedom known for its communication tower. Tricky rules make card games here unpredictable.

**Map Bounds:** x1: 5, y1: 55, x2: 20, y2: 75

#### Locations:

**Dollet City** (order 0, unlocked with region)
- mapX: 50, mapY: 50
- NPCs:
  - **Dollet Citizen** (duel, tier 2) — Pool: glacial_eye, belhelmel, thrustaevis, anacondaur, tri_face, fastitocalon, snow_lion, ochu — Reward: 125 gil
    - Challenge: "In Dollet, we play with Elemental cards on the board. Watch out!"
    - Defeated: "Those Random hands... I swear the cards conspire against me. Well played."
    - Rematch: "I've figured out how to read the Elemental board. Try me again!"
  - **Dollet Soldier** (duel, tier 2) — Pool: belhelmel, thrustaevis, anacondaur, creeps, grendel, jelleye, grand_mantis, forbidden — Reward: 125 gil
    - Challenge: "A soldier's got to have a hobby. Mine's Triple Triad. Yours?"
    - Defeated: "At ease, soldier... I mean me. I'm at ease. You win."
    - Rematch: "I've been drilling card strategies in my downtime. Ready for inspection?"
  - **Dollet Pub Owner** (shop) — "Finest cards from across the sea." — Sells: thrustaevis (200g), anacondaur (200g), creeps (220g), grendel (220g)
  - **Queen of Cards** (dialogue) — "I travel the world playing Triple Triad. Perhaps we'll meet again in your travels." — Quest: "Queen's Favour" (find_card: forbidden → reward: card: armadodo x2)
  - **Dollet Tournament** (tournament) — Entry: 150 gil, Prizes: random level 2-3 card
- **Unlock next:** Beat 2 unique duel NPCs here → unlocks **Galbadia region** (+ story cutscene)

---

### Region 2: Galbadia
**Rules:** Same
**Description:** The militaristic Galbadian continent. The Same rule makes positioning crucial — one wrong move and your cards get chain-captured.

**Map Bounds:** x1: 20, y1: 35, x2: 55, y2: 70

#### Locations:

**Timber** (order 0, unlocked with region)
- mapX: 35, mapY: 40
- NPCs:
  - **Timber Maniac** (duel, tier 2) — Pool: thrustaevis, anacondaur, creeps, grendel, jelleye, grand_mantis, forbidden, armadodo — Reward: 100 gil
    - Challenge: "I write for the Timber Maniacs magazine. Let's play — I need material for my column!"
    - Defeated: "What a story! 'Local reporter trounced at cards.' ...please don't tell my editor."
    - Rematch: "I wrote an article analysing your play style. Now let's see if my research pays off!"
  - **Forest Fox** (duel, tier 2) — Pool: grendel, jelleye, grand_mantis, forbidden, armadodo, tri_face, fastitocalon, snow_lion — Reward: 100 gil
    - Challenge: "I'm part of the Forest Owls resistance. We play cards to pass the time between operations."
    - Defeated: "The resistance will rise again... at cards, I mean."
    - Rematch: "The Owls have been training me. This time, vive la résistance!"
  - **Resistance Member** (dialogue) — "We fight for Timber's independence. A card game would lighten the mood." — Quest: "Resistance Supplies" (find_card: grand_mantis → reward: 300 gil)
  - **Timber Card Dealer** (shop) — "Got some rare finds from the forest." — Sells: forbidden (300g), armadodo (300g), jelleye (250g), grand_mantis (250g)
- **Unlock next:** Beat 2 unique duel NPCs here → unlocks **Galbadia Garden**

**Galbadia Garden** (order 1, unlock: 2 unique wins in Timber)
- mapX: 45, mapY: 55
- NPCs:
  - **Galbadia Student** (duel, tier 3) — Pool: forbidden, armadodo, tri_face, fastitocalon, snow_lion, ochu, sam08g, death_claw — Reward: 150 gil
    - Challenge: "Galbadia Garden students are the best duelists! Prove me wrong!"
    - Defeated: "Impossible... Galbadia's finest, beaten? I'll report this to the headmaster."
    - Rematch: "The headmaster says I need to redeem Galbadia's honour. Let's settle this!"
  - **Galbadia Instructor** (duel, tier 3) — Pool: tri_face, fastitocalon, snow_lion, ochu, sam08g, death_claw, cactuar, abyss_worm — Reward: 150 gil
    - Challenge: "I teach combat tactics here. Card strategy is just another form of warfare."
    - Defeated: "Well. It seems I have something to learn after all. Dismissed."
    - Rematch: "I've revised my curriculum based on our last match. Class is in session!"
  - **Irvine** (dialogue) — "Hey there! I'm quite the card player myself. Beat the instructor here and I might have something for you." — Quest: "Irvine's Challenge" (beat_npc: galbadia_instructor → reward: card: cactuar)
- **Unlock next:** Beat 1 unique duel NPC here → unlocks **Deling City**

**Deling City** (order 2, unlock: 1 unique win at Galbadia Garden)
- mapX: 25, mapY: 50
- NPCs:
  - **Deling City Guard** (duel, tier 3) — Pool: tri_face, fastitocalon, snow_lion, ochu, sam08g, death_claw, cactuar, tonberry — Reward: 175 gil
    - Challenge: "General Caraway permits recreational card games. En garde!"
    - Defeated: "I'll be filing a report about this... a report on how to improve my game."
    - Rematch: "My shift partner taught me some new moves. Official rematch time!"
  - **General's Aide** (duel, tier 3) — Pool: sam08g, death_claw, cactuar, tonberry, abyss_worm, turtapod, bomb, blitz — Reward: 175 gil
    - Challenge: "The General himself plays Triple Triad. I learned from the best."
    - Defeated: "The General won't be pleased... but he'd respect a good game. Well played."
    - Rematch: "I've been studying the General's personal card strategies. Ready?"
  - **Deling Card Emporium** (shop) — "The finest cards in Galbadia." — Sells: tri_face (350g), fastitocalon (350g), snow_lion (350g), ochu (350g)
  - **Deling Tournament** (tournament) — Entry: 200 gil, Prizes: random level 3-4 card
- **Unlock next:** Beat 1 unique duel NPC here → unlocks **D-District Prison**

**D-District Prison** (order 3, unlock: 1 unique win in Deling City) — **DUNGEON**
- mapX: 60, mapY: 45
- Flavour: "A towering desert prison. Fight your way through the guards to escape..."
- Floors:
  - **Floor 1: Prison Inmate** (duel, tier 2) — Pool: thrustaevis, anacondaur, creeps, grendel, jelleye, grand_mantis, forbidden, armadodo — Reward: 50 gil
    - Intro: "A fellow prisoner challenges you. 'Win and I'll tell you how to get past the next guard.'"
    - Defeated: "Good luck up there... you'll need it."
  - **Floor 2: Prison Enforcer** (duel, tier 3) — Pool: forbidden, armadodo, tri_face, fastitocalon, snow_lion, ochu, sam08g, death_claw — Reward: 75 gil
    - Intro: "A hulking enforcer blocks the stairwell. 'Nobody gets past me without a game.'"
    - Defeated: "Tch. Fine. Go on through."
  - **BOSS — Warden** (duel, tier 3, isBoss: true) — Pool: sam08g, death_claw, cactuar, tonberry, abyss_worm, turtapod, vysage, t_rexaur — Reward: 200 gil
    - Challenge: "Leaving so soon? Not without beating the Warden first!"
    - Defeated: "Don't tell the General I lost to a prisoner... Get out of here."
    - Rematch: "Back in my prison? You must really enjoy losing. Let's go!"
- **Completion:** Unlocks **Winhill**

**Winhill** (order 4, unlock: 1 unique win at D-District Prison)
- mapX: 15, mapY: 65
- NPCs:
  - **Winhill Villager** (duel, tier 3) — Pool: ochu, abyss_worm, turtapod, bomb, blitz, wendigo, torama, blue_dragon — Reward: 175 gil
    - Challenge: "This quiet village has surprisingly strong card players. Try me."
    - Defeated: "The flowers here bring good luck... just not to me today, it seems."
    - Rematch: "I've been tending my garden and my deck. Both are blooming!"
  - **Winhill Flower Girl** (duel, tier 3) — Pool: turtapod, bomb, blitz, wendigo, torama, imp, blue_dragon, adamantoise — Reward: 175 gil
    - Challenge: "I sell flowers, but my real passion is cards. Want to play?"
    - Defeated: "Oh my! You're really good. I'll need to rearrange my whole deck."
    - Rematch: "I arranged my cards like a bouquet — each one in the perfect spot!"
  - **Laguna** (dialogue) — "Winhill... brings back memories. Beat the flower girl here and I'll share something special with you." — Quest: "Laguna's Memento" (beat_npc: winhill_flower_girl → reward: card: imp, 500 gil)
- **Unlock next:** Beat 1 unique duel NPC here → unlocks **Fisherman's Horizon region**

---

### Region 3: Fisherman's Horizon
**Rules:** Elemental, Sudden Death
**Description:** A pacifist settlement on the transcontinental bridge. Sudden Death means draws never end — you keep playing until someone wins.

**Map Bounds:** x1: 40, y1: 45, x2: 55, y2: 60

#### Locations:

**Fisherman's Horizon** (order 0, unlocked with region)
- mapX: 50, mapY: 50
- NPCs:
  - **FH Resident** (duel, tier 3) — Pool: sam08g, death_claw, cactuar, tonberry, abyss_worm, turtapod, vysage, t_rexaur — Reward: 150 gil
    - Challenge: "We're peaceful folk, but we take our card games seriously."
    - Defeated: "No hard feelings. Peace and cards — that's the FH way."
    - Rematch: "The bridge gives you time to think. I've thought up a new strategy!"
  - **Bridge Mechanic** (duel, tier 3) — Pool: death_claw, cactuar, tonberry, abyss_worm, turtapod, vysage, t_rexaur, bomb — Reward: 150 gil
    - Challenge: "I fix the bridge by day, play cards by night. Fancy a game?"
    - Defeated: "Guess I should stick to fixing bridges... nah, I'll get you next time."
    - Rematch: "I've calibrated my deck like I calibrate my tools — precision engineering!"
  - **FH Fisherman** (dialogue) — "I once caught a card in my net. No, really!" — Quest: "Fisher's Catch" (find_card: fastitocalon → reward: 400 gil)
  - **FH Card Trader** (shop) — "Found these washed up on the bridge." — Sells: sam08g (400g), death_claw (400g), cactuar (450g), tonberry (450g)
  - **FH Tournament** (tournament) — Entry: 200 gil, Prizes: random level 3-4 card
  - **Mayor Dobe** (dialogue) — "Triple Triad? I suppose it's a peaceful pursuit..."
- **Unlock next:** Beat 2 unique duel NPCs here → unlocks **Trabia region**

---

### Region 4: Trabia
**Rules:** Random, Plus
**Description:** The frozen northern continent. The Plus rule rewards mathematical thinking, but Random hands make it a gamble.

**Map Bounds:** x1: 30, y1: 10, x2: 60, y2: 35

#### Locations:

**Trabia Garden** (order 0, unlocked with region)
- mapX: 40, mapY: 60
- NPCs:
  - **Trabia Student** (duel, tier 3) — Pool: snow_lion, ochu, abyss_worm, turtapod, bomb, blitz, wendigo, torama — Reward: 175 gil
    - Challenge: "Our Garden was destroyed, but our card skills survived!"
    - Defeated: "We've lost our Garden but not our spirit. Good game though."
    - Rematch: "We rebuilt our decks from the rubble. Time for revenge!"
  - **Trabia Scout** (duel, tier 3) — Pool: abyss_worm, turtapod, bomb, blitz, wendigo, torama, imp, blue_dragon — Reward: 175 gil
    - Challenge: "I scout the frozen wastes. A card game warms the soul!"
    - Defeated: "The cold must have frozen my brain... well played."
    - Rematch: "The tundra taught me patience. I'm ready for another go!"
  - **Selphie** (dialogue) — "Booyaka! Let's play cards! It'll cheer everyone up! Beat the scout here and I'll give you something special!" — Quest: "Selphie's Morale Boost" (beat_npc: trabia_scout → reward: card: hexadragon, 300 gil)
- **Unlock next:** Beat 2 unique duel NPCs here → unlocks **Shumi Village**

**Shumi Village** (order 1, unlock: 2 unique wins at Trabia Garden)
- mapX: 70, mapY: 30
- NPCs:
  - **Shumi Elder** (duel, tier 4) — Pool: imp, blue_dragon, adamantoise, hexadragon, iron_giant, behemoth, chimera, pupu — Reward: 250 gil
    - Challenge: "The Shumi have played card games for centuries. You honour us with your challenge."
    - Defeated: "Centuries of card wisdom... and you surpassed it. Remarkable."
    - Rematch: "I have meditated upon our last game. I believe I understand now."
  - **Shumi Artisan** (shop) — "We craft the finest cards. Each one is a work of art." — Sells: bomb (500g), blitz (500g), wendigo (500g), torama (550g), imp (600g)
  - **Shumi Sculptor** (dialogue) — "I carve statues... but I also know card secrets." — Quest: "The Sculptor's Muse" (find_card: pupu → reward: card: blue_dragon, 500 gil)
- **Unlock next:** Beat Shumi Elder → unlocks **Centra region** (+ story cutscene)

---

### Region 5: Centra
**Rules:** Same, Plus, Random
**Description:** The ruined southern continent, devastated by the Lunar Cry. The toughest rule combination — Same + Plus + Random together make every match brutal.

**Map Bounds:** x1: 30, y1: 65, x2: 65, y2: 90

#### Locations:

**Edea's House** (order 0, unlocked with region)
- mapX: 50, mapY: 85
- NPCs:
  - **White SeeD** (duel, tier 4) — Pool: torama, imp, blue_dragon, adamantoise, hexadragon, iron_giant, behemoth, chimera — Reward: 225 gil
    - Challenge: "We protect the Sorceress. Show us your strength at cards."
    - Defeated: "A worthy opponent. The Sorceress would be impressed."
    - Rematch: "The sea has given me new perspective. Face me again!"
  - **White SeeD Captain** (duel, tier 4) — Pool: blue_dragon, adamantoise, hexadragon, iron_giant, behemoth, chimera, malboro, ruby_dragon — Reward: 250 gil
    - Challenge: "I command the White SeeD ship. My card strategy is equally disciplined."
    - Defeated: "You've outmanoeuvred me. That takes real skill in Centra's brutal ruleset."
    - Rematch: "I've charted new tactical waters. Prepare to be boarded!"
  - **Edea** (dialogue) — "Children... this is where your journey began. And where it continues." — Quest: "Matron's Request" (beat_npc: centra_ruins_boss → reward: card: elnoyle, 600 gil)
  - **Ruin Explorer** (shop) — "I've excavated some rare cards from the ruins. I sell them here where it's safe." — Sells: blue_dragon (650g), adamantoise (650g), hexadragon (700g), iron_giant (800g)
  - **Tonberry King** (dialogue) — "..." — Quest: "Tonberry's Treasure" (find_card: tonberry_king → reward: card: wedge_biggs, 800 gil)
- **Unlock next:** Beat 2 unique duel NPCs here → unlocks **Centra Ruins**

**Centra Ruins** (order 1, unlock: 2 unique wins at Edea's House) — **DUNGEON**
- mapX: 40, mapY: 50
- Flavour: "Ancient ruins of a lost civilisation. Strange energies pulse through crumbling corridors..."
- Floors:
  - **Floor 1: Ruin Spirit** (duel, tier 3) — Pool: torama, imp, blue_dragon, adamantoise, hexadragon, iron_giant, behemoth, chimera — Reward: 75 gil
    - Intro: "A spectral figure materialises from the ancient stonework. It gestures toward its cards."
    - Defeated: "The spirit fades into the walls, opening the path forward..."
  - **Floor 2: Ancient Sentinel** (duel, tier 4) — Pool: blue_dragon, adamantoise, hexadragon, iron_giant, behemoth, chimera, malboro, ruby_dragon — Reward: 100 gil
    - Intro: "A towering stone guardian blocks the inner chamber. Its eyes glow with challenge."
    - Defeated: "The sentinel crumbles. The final chamber lies ahead..."
  - **BOSS — Centra Guardian** (duel, tier 4, isBoss: true) — Pool: blitz, wendigo, torama, blue_dragon, adamantoise, hexadragon, iron_giant, behemoth, malboro, ruby_dragon — Reward: 275 gil
    - Challenge: "These ruins hold ancient power... and ancient cards. Prove you are worthy!"
    - Defeated: "The ancients would be proud of your skill. You have earned passage beyond."
    - Rematch: "The ruins have whispered new secrets to me. Shall we test them?"
- **Completion:** Unlocks **Esthar region**

---

### Region 6: Esthar (+ Lunar)
**Rules:** Elemental, Same Wall
**Description:** The technologically advanced Esthar continent and the Lunar Gate. Same Wall makes board edges dangerous — every edge acts like a rank-10 card for the Same rule.

**Map Bounds:** x1: 60, y1: 30, x2: 95, y2: 65

#### Locations:

**Esthar City** (order 0, unlocked with region)
- mapX: 30, mapY: 50
- NPCs:
  - **Esthar Scientist** (duel, tier 4) — Pool: iron_giant, behemoth, malboro, ruby_dragon, elnoyle, tonberry_king, wedge_biggs, fujin_raijin — Reward: 300 gil
    - Challenge: "Our calculations show a 47.3% chance you'll lose. Shall we test it?"
    - Defeated: "Recalculating... Error: opponent skill exceeded parameters. Fascinating."
    - Rematch: "I've updated my probability model. The new calculations favour me. Shall we?"
  - **Esthar Soldier** (duel, tier 4) — Pool: behemoth, malboro, ruby_dragon, elnoyle, tonberry_king, wedge_biggs, fujin_raijin, elvoret — Reward: 300 gil
    - Challenge: "Esthar's military doesn't just fight with weapons. Cards are training too."
    - Defeated: "Stand down... I mean, I stand down. You've earned this victory."
    - Rematch: "New orders from command: defeat you at cards. Let's go!"
  - **Esthar Card Lab** (shop) — "State-of-the-art cards, engineered for victory." — Sells: behemoth (900g), malboro (900g), ruby_dragon (950g), elnoyle (1000g), iron_giant (850g)
  - **Rinoa** (dialogue) — "Squall never wants to play cards with me... Will you? Beat the soldier here and I'll give you something special." — Quest: "Rinoa's Wish" (beat_npc: esthar_soldier → reward: card: fujin_raijin, 1000 gil)
  - **Space Engineer** (dialogue) — "The view from up here changes your perspective on everything... even card games. Clear Lunar Gate and I'll have something for you." — Quest: "Final Frontier" (beat_npc: lunar_gate_boss → reward: card: mobile_type_8, 2000 gil)
  - **Esthar Tournament** (tournament) — Entry: 300 gil, Prizes: random level 5-6 card
- **Unlock next:** Beat 2 unique duel NPCs here → unlocks **Lunar Gate**

**Lunar Gate** (order 1, unlock: 2 unique wins in Esthar City) — **DUNGEON**
- mapX: 70, mapY: 35
- Flavour: "The launch facility to space. Security clearance required — in the form of card battles."
- Floors:
  - **Floor 1: Gate Sentry** (duel, tier 4) — Pool: iron_giant, behemoth, malboro, ruby_dragon, elnoyle, tonberry_king, wedge_biggs, fujin_raijin — Reward: 100 gil
    - Intro: "A sentry blocks the first checkpoint. 'Security clearance? Show me your cards.'"
    - Defeated: "Clearance granted for sector 2..."
  - **Floor 2: Lunar Soldier** (duel, tier 5) — Pool: elvoret, x_atm092, granaldo, gerogero, iguion, abadon, propagator, jumbo_cactuar, tri_point, gargantua — Reward: 150 gil
    - Intro: "A hardened soldier stands at the launch pad entrance. 'Last chance to turn back.'"
    - Defeated: "You'd survive in space. That takes guts... and good cards."
  - **BOSS — Lunar Officer** (duel, tier 5, isBoss: true) — Pool: x_atm092, granaldo, gerogero, iguion, abadon, propagator, jumbo_cactuar, tri_point, gargantua, mobile_type_8 — Reward: 400 gil
    - Challenge: "I oversee all operations at Lunar Gate. Including the card table. Final clearance — defeat me."
    - Defeated: "Mission status: failed. But I respect a good opponent. You have full clearance."
    - Rematch: "I've requisitioned new cards from the space station. Engage!"
- **Completion:** Unlocks **Deep Sea Research Center** (requires also 5 completed side quests) (+ story cutscene)

**Deep Sea Research Center** (order 2, unlock: clear Lunar Gate + 5 completed quests) — **DUNGEON (Final)**
- mapX: 15, mapY: 70
- Flavour: "The deepest facility in the world. Four levels of increasingly dangerous opponents guard the ultimate prize..."
- Floors:
  - **Floor 1: Deep Sea Drone** (duel, tier 4) — Pool: iron_giant, behemoth, malboro, ruby_dragon, elnoyle, tonberry_king, wedge_biggs, fujin_raijin — Reward: 100 gil
    - Intro: "An automated security drone activates. Its screen displays a Triple Triad board."
    - Defeated: "SECURITY BREACH ACCEPTED. DESCENDING TO LEVEL 2..."
  - **Floor 2: Abyssal Creature** (duel, tier 5) — Pool: elvoret, x_atm092, granaldo, gerogero, iguion, abadon, propagator, jumbo_cactuar — Reward: 150 gil
    - Intro: "Something stirs in the dark water below. A creature emerges, cards in hand."
    - Defeated: "The creature sinks back into the depths, clearing the way forward..."
  - **Floor 3: Research Subject** (duel, tier 5) — Pool: propagator, jumbo_cactuar, tri_point, gargantua, mobile_type_8, sphinxara, tiamat, bgh251f2 — Reward: 200 gil
    - Intro: "A containment pod opens. The escaped research subject knows only one thing — Triple Triad."
    - Defeated: "The subject returns to stasis. The final chamber awaits..."
  - **BOSS — Deep Sea Researcher** (duel, tier 5, isBoss: true) — Pool: propagator, jumbo_cactuar, tri_point, gargantua, mobile_type_8, sphinxara, tiamat, bgh251f2, red_giant, catoblepas, ultima_weapon — Reward: 500 gil
    - Challenge: "The deepest secrets... and the strongest cards. You've made it this far. Are you ready for the end?"
    - Defeated: "In the deep, pressure creates diamonds. You are one such diamond. You've conquered the world of Triple Triad."
    - Rematch: "The abyss has revealed new card formations. Dive back in?"
- **Post-Boss:** After clearing, **Bahamut** appears (dialogue): "You have proven yourself worthy. The ultimate card master." — (End-game flavour, no quest)
- **Completion:** Game completion! Final dungeon cleared.

---

## Starter Deck (5 Cards — Never Lost)

The player begins with exactly 5 cards (reduced from V2's 10 to match the user's request):
1. **Geezard** (Level 1: 1/4/1/5)
2. **Funguar** (Level 1: 5/1/1/3)
3. **Bite Bug** (Level 1: 1/3/3/5)
4. **Red Bat** (Level 1: 6/1/1/2)
5. **Blobra** (Level 1: 2/3/1/5)

These 5 cards have `inventory[cardId] >= 1` enforced — they can never be reduced below 1.
The "Starter Deck" saved deck references these 5 cards and cannot be deleted.

---

## Progressive Difficulty Curve

| Tier | AI Level | Deck Pool Levels | Regions | Description |
|------|----------|-----------------|---------|-------------|
| 1 | Easy (random moves) | L1-L2 | Balamb (early) | Beginner — makes random placements |
| 2 | Easy (random but avoids obvious mistakes) | L1-L3 | Balamb (late), Dollet | Novice — slightly better deck, still easy AI |
| 3 | Medium (greedy 1-ply) | L2-L4 | Galbadia, FH, Trabia (early) | Intermediate — maximises immediate captures |
| 4 | Medium (greedy with rule awareness) | L3-L5 | Trabia (late), Centra, Esthar (early) | Advanced — understands Same/Plus, stronger deck |
| 5 | Hard (alpha-beta pruning) | L4-L7 | Esthar (late), Lunar, Deep Sea | Expert — strategic play with powerful cards |

---

## Story Cutscenes

### Opening Cutscene (New Game)
**Panels:**
1. A view of Balamb Garden at sunset — "In a world of Guardians and Sorceresses, there exists a simpler way to prove your worth..."
2. Two students playing Triple Triad — "Triple Triad. A card game played by everyone from students to soldiers."
3. Close-up of a hand of 5 cards — "Your journey begins with 5 humble cards and a dream of collecting them all."
4. The world map zooming out — "Travel the world. Challenge opponents. Build the ultimate deck."

### Key Story Beat Cutscenes (~3 additional)
- **Entering Galbadia (after clearing Dollet):** "Beyond the sea, the Galbadian continent awaits. The Same rule dominates here — one wrong move can turn the tide."
- **Entering Centra (after clearing Shumi Village):** "The ruined continent of Centra. Here, Same, Plus, AND Random all combine. Only the strongest survive."
- **Reaching Deep Sea (final):** "You've reached the deepest point in the world. The ultimate opponents await."

---

## Side Quests Summary

All "beat_npc" quests require defeating a specific NPC **once** (not multiple times). For dungeon bosses, clearing the dungeon counts as beating the boss. Quest givers are always in **town** locations (never inside dungeons).

| # | Quest Name | Giver | Type | Target | Reward |
|---|-----------|-------|------|--------|--------|
| 1 | Zell's Request | Zell (Balamb Town) | find_card | mesmerize | 200 gil |
| 2 | Quistis's Test | Quistis (Balamb Garden) | beat_npc | cc_club_jack | card: thrustaevis |
| 3 | Queen's Favour | Queen of Cards (Dollet) | find_card | forbidden | card: armadodo x2 |
| 4 | Resistance Supplies | Resistance Member (Timber) | find_card | grand_mantis | 300 gil |
| 5 | Irvine's Challenge | Irvine (Galbadia Garden) | beat_npc | galbadia_instructor | card: cactuar |
| 6 | Fisher's Catch | FH Fisherman | find_card | fastitocalon | 400 gil |
| 7 | Selphie's Morale | Selphie (Trabia Garden) | beat_npc | trabia_scout | card: hexadragon + 300 gil |
| 8 | Sculptor's Muse | Shumi Sculptor | find_card | pupu | card: blue_dragon + 500 gil |
| 9 | Laguna's Memento | Laguna (Winhill) | beat_npc | winhill_flower_girl | card: imp + 500 gil |
| 10 | Matron's Request | Edea (Edea's House) | clear_dungeon | centra_ruins | card: elnoyle + 600 gil |
| 11 | Tonberry's Treasure | Tonberry King (Edea's House) | find_card | tonberry_king | card: wedge_biggs + 800 gil |
| 12 | Rinoa's Wish | Rinoa (Esthar City) | beat_npc | esthar_soldier | card: fujin_raijin + 1000 gil |
| 13 | Final Frontier | Space Engineer (Esthar City) | clear_dungeon | lunar_gate | card: mobile_type_8 + 2000 gil |

---

## Location Type & NPC Verification

### Town Locations (NPC grid, free-roam)

| Location | Type | Duel NPCs | Other NPCs | Wins for Next Unlock | Valid? |
|----------|------|-----------|-----------|---------------------|--------|
| Balamb Town | Town | 2 (Townsperson, Fisher) | Shop, Zell (quest) | 1 | ✅ |
| Balamb Garden | Town | 2 (Garden Student, CC Club Jack) | Shop, Quistis (quest), Tournament | 2 | ✅ |
| Dollet City | Town | 2 (Citizen, Soldier) | Shop, Queen of Cards (quest), Tournament | 2 (unlocks region) | ✅ |
| Timber | Town | 2 (Maniac, Forest Fox) | Shop, Resistance Member (quest) | 2 | ✅ |
| Galbadia Garden | Town | 2 (Student, Instructor) | Irvine (quest) | 1 | ✅ |
| Deling City | Town | 2 (Guard, General's Aide) | Shop, Tournament | 1 | ✅ |
| Winhill | Town | 2 (Villager, Flower Girl) | Laguna (quest) | 1 (unlocks region) | ✅ |
| Fisherman's Horizon | Town | 2 (Resident, Mechanic) | Shop, FH Fisherman (quest), Tournament, Mayor Dobe | 2 (unlocks region) | ✅ |
| Trabia Garden | Town | 2 (Student, Scout) | Selphie (quest) | 2 | ✅ |
| Shumi Village | Town | 1 (Elder) | Shop, Sculptor (quest) | 1 (unlocks region) | ✅ |
| Edea's House | Town | 2 (White SeeD, Captain) | Edea (quest), Ruin Explorer (shop), Tonberry King (quest) | 2 | ✅ |
| Esthar City | Town | 2 (Scientist, Soldier) | Shop, Rinoa (quest), Space Engineer (quest), Tournament | 2 | ✅ |

**Total town duel NPCs: 23**

### Dungeon Locations (linear gauntlet → boss)

| Location | Floors | Boss | Completion Unlocks | Valid? |
|----------|--------|------|--------------------|--------|
| Fire Cavern | 2 + boss (Cave Bat → Fire Spirit → **Ifrit Guardian**) | Tier 2 | Dollet region | ✅ |
| D-District Prison | 2 + boss (Prison Inmate → Prison Enforcer → **Warden**) | Tier 3 | Winhill | ✅ |
| Centra Ruins | 2 + boss (Ruin Spirit → Ancient Sentinel → **Centra Guardian**) | Tier 4 | Esthar region | ✅ |
| Lunar Gate | 2 + boss (Gate Sentry → Lunar Soldier → **Lunar Officer**) | Tier 5 | Deep Sea (+ 5 quests) | ✅ |
| Deep Sea Research | 3 + boss (Drone → Abyssal → Research Subject → **Deep Sea Researcher**) | Tier 5 | Game complete | ✅ |

**Total dungeon floor NPCs: 14 (11 floors + 3 non-floor: post-boss Bahamut is dialogue only)**

### Grand Total: 37 unique duel NPCs (23 town + 14 dungeon)

---

## Region Map SVG Overlay Coordinates

Approximate polygon coordinates for each region overlay on the world map (as % of image dimensions). These will need fine-tuning once we see the actual world.jpg rendering:

```
Balamb:    10,48 → 28,48 → 30,65 → 12,68 → 10,48
Dollet:    5,55 → 14,55 → 16,70 → 7,72 → 5,55
Galbadia:  14,35 → 50,35 → 52,68 → 16,70 → 14,35
FH:        42,48 → 55,48 → 55,58 → 42,58 → 42,48
Trabia:    28,8 → 58,8 → 60,32 → 30,32 → 28,8
Centra:    28,68 → 62,68 → 64,92 → 30,92 → 28,68
Esthar:    58,28 → 95,28 → 95,65 → 60,65 → 58,28
```

These are rough starting points. The implementation should use SVG `<polygon>` elements positioned over the world map image, with `fill` set to a semi-transparent region colour and `stroke` for borders.
