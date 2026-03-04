"""
Generate location backgrounds and NPC portraits for Triple Triad using SDXL-Turbo.
Runs on GPU via Docker. Output: /output/locations/*.png and /output/portraits/*.png
"""
import os
import json
import time
import torch
from diffusers import AutoPipelineForText2Image
from PIL import Image

OUTPUT_DIR = "/output"
LOCATIONS_DIR = os.path.join(OUTPUT_DIR, "locations")
PORTRAITS_DIR = os.path.join(OUTPUT_DIR, "portraits")
os.makedirs(LOCATIONS_DIR, exist_ok=True)
os.makedirs(PORTRAITS_DIR, exist_ok=True)

# ──────────────────────────────────────────────────────────────────────────────
# Location prompts — FF8-faithful backgrounds
# ──────────────────────────────────────────────────────────────────────────────

LOCATION_PROMPTS = {
    "balamb_garden": "futuristic military academy floating above ocean, Final Fantasy VIII Balamb Garden, circular building with blue dome and ring structure, lush green courtyard, clear sky, anime style, detailed background art, vibrant colors",
    "balamb_town": "small peaceful coastal town, Final Fantasy VIII Balamb, harbour with fishing boats, Mediterranean style houses, ocean view, palm trees, warm sunlight, anime style background art",
    "fire_cavern": "volcanic cave interior, glowing lava rivers, orange and red light, rocky stalactites, fire elementals, dark atmosphere, Final Fantasy dungeon, anime style",
    "dollet": "elegant coastal city with Victorian architecture, Dollet from Final Fantasy VIII, stone buildings along waterfront, clock tower, paved streets, overcast sky, anime style background",
    "radio_tower": "tall communication tower on mountain cliff, Dollet radio tower from FF8, military antenna structure, dramatic sky, industrial metal platforms, anime style",
    "timber": "forested town built on railroad tracks, Timber from Final Fantasy VIII, train station, resistance hideouts, wooden buildings among trees, warm lighting, anime style",
    "galbadia_garden": "massive military academy, Galbadia Garden from FF8, imposing red and grey building, angular architecture, parade grounds, authoritarian atmosphere, anime style",
    "deling_city": "grand metropolitan city at night, Deling City from FF8, presidential palace, neon lights, wide boulevards, arc de triomphe style gate, dark elegant atmosphere, anime style",
    "tomb_of_unknown_king": "ancient stone tomb interior, labyrinthine corridors, crumbling pillars, ghostly blue light, moss-covered walls, mysterious atmosphere, Final Fantasy dungeon, anime style",
    "deling_sewers": "dark underground sewer tunnels, green murky water, brick walls, dim lanterns, rats, damp atmosphere, urban dungeon, anime style",
    "winhill": "idyllic hilltop village, Winhill from FF8, stone cottages with flower gardens, cobblestone paths, golden sunset, rural countryside, peaceful, anime style",
    "d_district_prison": "towering desert prison complex, D-District Prison from FF8, cylindrical multi-level structure in barren wasteland, harsh sunlight, sand dunes, oppressive, anime style",
    "galbadia_missile_base": "underground military missile base, control rooms with screens, metal corridors, red warning lights, countdown timer, tense atmosphere, sci-fi military, anime style",
    "balamb_garden_basement": "hidden underground facility beneath academy, dark metal corridors, ancient machinery, blue emergency lights, mysterious mechanical structure, anime style",
    "fishermans_horizon": "massive bridge-city spanning the ocean, Fisherman's Horizon from FF8, industrial cranes, metal walkways, solar panels, pacifist community, golden hour over water, anime style",
    "balamb_under_siege": "coastal town under military occupation, soldiers patrolling streets, damaged buildings, barricades, tense atmosphere, smoke in the air, anime style",
    "roaming_forest": "enchanted mystical forest, glowing mushrooms, fog between ancient trees, supernatural creatures, ethereal green and purple light, mysterious, anime style",
    "trabia_garden": "destroyed military academy in snowy mountains, Trabia Garden from FF8, ruined buildings, snow drifts, crater from missile impact, cold desolate atmosphere, anime style",
    "galbadia_garden_revolution": "military academy during battle, explosions, students fighting, damaged hallways, red emergency lighting, chaotic warfare scene, anime style",
    "edeas_house": "small stone orphanage on rocky coast, Edea's House from FF8, lighthouse nearby, crashing waves, flowers growing on cliff, melancholic sunset, anime style",
    "white_seed_ship": "white sailing vessel on open ocean, White SeeD Ship from FF8, elegant white-hulled ship, billowing sails, blue sea, clear sky, adventure, anime style",
    "great_salt_lake": "vast dried salt flat landscape, blindingly white terrain, crystalline formations, heat haze, sparse vegetation, harsh sunlight, desolate, anime style",
    "esthar_city": "futuristic utopian city, Esthar from FF8, transparent tubes and walkways, floating buildings, blue and purple lighting, advanced technology, holographic displays, anime style",
    "lunar_base": "orbital space station interior, Lunar Base from FF8, command center with Earth visible through windows, zero gravity, control panels, sci-fi atmosphere, anime style",
    "sorceress_memorial": "crystalline monument building, Sorceress Memorial from FF8, frozen sorceress encased in crystal, blue ethereal glow, solemn atmosphere, futuristic architecture, anime style",
    "deep_sea_research_center": "deep underwater research facility, metal walls with porthole windows showing ocean, bioluminescent creatures outside, dark blue atmosphere, sci-fi laboratory, anime style",
    "shumi_village": "underground village of gentle creatures, Shumi Village from FF8, organic architecture with domed buildings, warm golden interior lighting, mushroom gardens, peaceful, anime style",
    "lunatic_pandora": "massive floating crystalline structure, Lunatic Pandora from FF8, transparent crystal walls, energy beams, hovering above cityscape, ominous purple glow, anime style",
    "centra_excavation_site": "archaeological dig site in ancient ruins, crumbling stone structures, excavation equipment, underground caverns, mysterious glyphs on walls, torchlight, anime style",
    "centra_ruins": "vast crumbling ancient civilisation ruins, Centra Ruins from FF8, towering broken pillars, overgrown with vines, strange energy pulsing through cracks, dramatic sky, anime style",
}

# ──────────────────────────────────────────────────────────────────────────────
# NPC portrait prompts — character descriptions
# ──────────────────────────────────────────────────────────────────────────────

# FF8 canon characters get specific descriptions
FF8_CHARACTERS = {
    "zell": "Zell Dincht from FF8, young man with spiky blonde hair and tribal face tattoo, blue eyes, martial artist, energetic expression, wearing SeeD uniform",
    "zell_balamb": "Zell Dincht from FF8, young man with spiky blonde hair and tribal face tattoo, blue eyes, martial artist, determined expression, wearing casual clothes",
    "quistis": "Quistis Trepe from FF8, beautiful young woman with long blonde hair and glasses, blue eyes, elegant, instructor outfit, composed expression",
    "quistis_gg": "Quistis Trepe from FF8, beautiful young woman with long blonde hair and glasses, blue eyes, elegant, instructor outfit, serious expression",
    "selphie": "Selphie Tilmitt from FF8, cheerful girl with flipped brown hair, green eyes, yellow dress, energetic happy expression",
    "selphie_trabia": "Selphie Tilmitt from FF8, cheerful girl with flipped brown hair, green eyes, yellow dress, sad concerned expression",
    "irvine": "Irvine Kinneas from FF8, tall young man with long brown hair in ponytail, cowboy hat, trench coat, confident smirk, sharpshooter",
    "rinoa": "Rinoa Heartilly from FF8, young woman with black hair, brown eyes, blue duster outfit, gentle warm expression, dog Angelo nearby",
    "rinoa_timber": "Rinoa Heartilly from FF8, young woman with black hair, brown eyes, blue duster outfit, determined resistance fighter expression",
    "laguna": "Laguna Loire from FF8, middle-aged man with long dark hair, kind face, journalist outfit, warm smile",
    "laguna_esthar": "Laguna Loire from FF8, middle-aged man with long dark hair, wearing presidential suit, dignified expression, leader of Esthar",
    "edea": "Edea Kramer from FF8, elegant mature woman with black hair, ornate dark sorceress dress, mysterious but kind expression",
    "edea_centra": "Edea Kramer from FF8, elegant mature woman with black hair, simple dress, warm motherly expression, standing by orphanage",
    "edea_final": "Edea Kramer from FF8, elegant mature woman with black hair, worn dress, urgent expression, final mission briefing",
    "seifer": "Seifer Almasy from FF8, tall young man with blonde hair and scar across face, grey trench coat, arrogant smirk, rival character",
    "seifer_final": "Seifer Almasy from FF8, tall young man with blonde hair and scar, grey trench coat, battle-worn, desperate expression, final confrontation",
    "cid": "Headmaster Cid Kramer from FF8, older man with glasses and short brown hair, wearing suit, kind fatherly expression, headmaster of Balamb Garden",
    "xu": "Xu from FF8, young woman with short dark hair, SeeD uniform, professional serious expression, second in command",
    "raijin_boss": "Raijin from FF8, large muscular man with dark skin and short hair, simple clothes, friendly but tough expression, holding staff",
    "fujin_boss": "Fujin from FF8, young woman with short silver hair and eyepatch, serious stoic expression, wearing dark outfit",
    "biggs_wedge": "Biggs and Wedge from FF8, two Galbadian soldiers in red uniforms, comedic duo, one large one thin, bumbling expressions",
    "sacred_minotaur": "Sacred and Minotaur from FF8, two guardian brothers, one red bull-like creature one blue, massive stone guardians in ancient tomb",
    "norg": "NORG from FF8, large grotesque creature in mechanical pod, Garden Faculty master, golden skin, threatening expression",
    "queen_of_cards": "Queen of Cards from FF8, elegant woman with dark hair wearing ornate card-themed outfit, mysterious knowing smile, card collector",
    "dr_odine": "Dr Odine from FF8, eccentric old scientist with wild white hair, large collar, gleeful mad scientist expression, Esthar researcher",
    "bahamut": "Bahamut the dragon king, massive dark dragon with spread wings, glowing energy in mouth, imposing guardian creature, Final Fantasy summon",
    "omega_weapon": "Omega Weapon from FF8, massive mechanical monster, dark metal body with glowing red eyes, ultimate boss creature, terrifying",
    "abadon_boss": "Abadon from FF8, large undead creature, skeletal with dark purple body, glowing eyes, swamp monster, menacing",
}

# Generic NPC types with location-appropriate descriptions
NPC_TYPE_TEMPLATES = {
    "duel": {
        "balamb": "young student in blue SeeD cadet uniform, bright expression, military academy setting",
        "galbadia": "soldier in red Galbadian military uniform, stern expression, authoritarian",
        "fh": "peaceful civilian in work clothes, friendly expression, industrial bridge town",
        "trabia": "young student in cold weather gear, determined expression, snowy setting",
        "centra": "weathered explorer in travelling clothes, mysterious expression, ancient ruins",
        "esthar": "person in futuristic white and blue Esthar uniform, calm expression, high-tech setting",
    },
    "shop": "friendly merchant behind counter, display of trading cards, warm lighting, welcoming expression",
    "dialogue": "civilian NPC character, casual clothes, conversational expression, standing in town",
    "tournament": "official tournament announcer behind podium, formal outfit, cards displayed, arena setting",
}

def get_npc_prompt(npc_id, npc_name, npc_type, location_id, region_id):
    """Build a portrait prompt for an NPC."""
    # Check for canon FF8 character first
    if npc_id in FF8_CHARACTERS:
        return FF8_CHARACTERS[npc_id]

    # Build contextual prompt based on NPC name and type
    base = f"portrait of {npc_name}"

    # Special creature/monster NPCs (dungeon enemies)
    creature_npcs = {
        "cave_bat": "giant cave bat creature with glowing eyes, dark wings spread, volcanic cave background",
        "fire_spirit": "fire elemental spirit, humanoid shape made of flames, ember particles, volcanic cave",
        "ifrit_guardian": "Ifrit fire guardian from Final Fantasy, muscular horned fire demon, flames surrounding body",
        "tomb_wraith": "ghostly wraith in ancient tomb, translucent form, blue spectral glow, tattered robes",
        "tomb_knight": "armoured undead knight with glowing eyes, rusted ancient armor, sword and shield, tomb setting",
        "sewer_rat": "giant mutant rat creature, glowing eyes, sewer tunnel, menacing",
        "sewer_creep": "shadowy sewer creature, amorphous dark form, glowing eyes in darkness",
        "sewer_guardian": "large armoured creature guarding sewer passage, reptilian features, underground",
        "basement_creature": "strange mechanical creature in underground facility, part machine part organic",
        "basement_guardian": "ancient mechanical guardian, glowing blue core, metal plating, underground facility",
        "galbadian_invader": "Galbadian soldier in full battle gear, red uniform, aggressive expression, occupied town",
        "galbadian_soldier": "Galbadian soldier in red uniform, standing guard at tower, stern military bearing",
        "elite_soldier": "elite Galbadian special forces soldier, advanced red armor, communication tower",
        "forest_sprite": "magical forest sprite, small glowing winged creature, ethereal green light, enchanted forest",
        "forest_wolf": "mystical wolf creature with glowing fur, enchanted forest, supernatural predator",
        "forest_guardian": "ancient tree spirit guardian, bark-like skin, glowing green eyes, massive forest being",
        "gg_loyalist": "Galbadia Garden loyalist soldier, red cadet uniform, combat ready, academy battle",
        "gg_elite": "Galbadia Garden elite guard in full armor, defending academy, fierce expression",
        "salt_creature": "crystalline salt creature, white translucent body, salt flat environment",
        "salt_behemoth": "massive behemoth creature on salt flats, armored hide, towering over landscape",
        "memorial_guard": "guard in ceremonial armor at memorial building, solemn, futuristic Esthar design",
        "memorial_scholar": "scholarly researcher in Esthar robes, studying at memorial, glasses, academic",
        "pandora_soldier": "soldier inside crystal structure, Galbadian uniform with crystal interference, confused",
        "pandora_guardian": "crystalline guardian entity, formed from Lunatic Pandora energy, geometric body",
        "excavation_drone": "ancient mechanical drone reactivated in excavation site, hovering, scanning beam",
        "excavation_golem": "stone golem awakened in ruins, ancient Centra construction, massive rock body",
        "ruin_spirit": "spectral ancient spirit in crumbling ruins, ghostly robes, faded civilization echo",
        "ancient_sentinel": "ancient stone sentinel statue come to life, massive guardian, Centra ruins design",
        "centra_guardian": "ultimate guardian of Centra Ruins, massive ancient construct, glowing energy core",
        "deep_sea_drone": "underwater mechanical drone, sleek design, bioluminescent accents, deep sea facility",
        "abyssal_creature": "deep sea abyssal creature, bioluminescent tentacles, massive dark form, terrifying",
        "research_subject": "escaped research subject creature, hybrid organic-mechanical, containment broken",
        "deep_sea_researcher": "scientist in pressurized underwater suit, research facility, analytical expression",
        "gate_sentry": "lunar base security guard, space suit with visor, zero gravity boots, orbital station",
        "lunar_soldier": "space marine in lunar base, armored space suit, floating in zero-g, orbital combat",
        "lunar_officer": "lunar base commanding officer, formal space uniform, command center background",
        "prison_inmate": "desperate prison inmate in orange jumpsuit, haggard expression, cell background",
        "prison_enforcer": "brutal prison enforcer in guard uniform, intimidating muscular build, baton",
        "warden": "prison warden in formal uniform, cold calculating expression, office with monitors",
        "base_guard": "missile base security guard in hazmat suit, military facility, warning lights",
        "base_technician": "military technician at console, missile base, nervous expression, countdown screens",
        "base_commander": "missile base commander in officer uniform, stern expression, war room",
        "cell_block_boss": "prison cell block boss, scarred tough inmate leader, dim prison corridor, menacing",
        "solitary_guard": "solitary confinement guard, heavy armor, cruel grin, dark prison basement",
        "ruin_revenant": "ancient warrior revenant rising from stone sarcophagus, ghostly armor, glowing cards",
        "centra_obelisk": "massive obsidian obelisk humming with energy, ancient Centra artifact, glowing runes",
        "zero_g_phantom": "spectral phantom floating in zero gravity, space station corridor, ethereal glow",
        "pressure_phantom": "deep sea phantom formed from crushing pressure, translucent deep water form, eerie",
        "ultima_sentinel": "massive mechanical guardian, glowing red core, armored plating, deep sea facility",
        "comm_officer": "communications officer at radio tower, military headset, stern, relay equipment",
        "tomb_phantom": "ghostly phantom drifting through labyrinth walls, spectral light, ancient tomb",
        "launch_engineer": "missile launch engineer at control panel, countdown screens, nervous, military base",
        "silo_guardian": "heavily armored robot in missile silo, red warning lights, mechanical menace",
        "occupation_captain": "Galbadian occupation captain, decorated military uniform, town square, authoritative",
        "gg_berserker": "crazed Galbadia Garden student, wild eyes, torn red uniform, battle damage",
        "gg_commander": "Galbadia Garden military commander, formal red officer uniform, strategic pose",
        "salt_golem": "massive crystalline salt golem, translucent body with salt formations, glowing core",
        "pandora_shade": "shadowy entity born from crystal walls, Sorceress energy, dark purple form",
        "pandora_core": "pulsating crystalline core entity, geometric energy patterns, Lunatic Pandora interior",
    }

    if npc_id in creature_npcs:
        return creature_npcs[npc_id]

    # Named location-specific NPCs
    named_npcs = {
        "garden_student": "young SeeD cadet student in blue uniform at Balamb Garden, eager expression, training grounds",
        "cc_club_jack": "mysterious CC Club member Jack, young man in SeeD uniform, confident grin, card player from Balamb Garden",
        "library_girl": "shy Library Girl from Balamb Garden, young woman with brown hair and glasses, books and cards around her",
        "garden_tournament": "Tournament Master at Balamb Garden, official in formal attire behind announcement podium, card arena",
        "balamb_townsperson": "friendly townsperson from Balamb, middle-aged person in casual coastal clothing, warm smile",
        "balamb_fisher": "old fisherman from Balamb harbour, weathered face, fishing hat, sitting by boats",
        "card_shop_owner": "card shop keeper in Balamb, middle-aged merchant, apron, cards displayed on counter",
        "dollet_citizen": "well-dressed citizen of Dollet, formal Victorian-style clothing, coastal city",
        "dollet_soldier": "Dollet military soldier in green uniform, standing guard, coastal garrison",
        "dollet_pub_owner": "jovial pub owner in Dollet, large man with apron, behind bar counter, warm pub interior",
        "dollet_tournament": "Dollet Tournament host, elegant outfit, arena setting, coastal tournament",
        "timber_maniac": "eccentric Timber Maniac magazine reporter, disheveled appearance, press credentials, notepad",
        "forest_fox": "Forest Fox resistance member from Timber, young rebel in forest camouflage, determined",
        "resistance_member": "Timber resistance fighter, civilian clothes with hidden weapons, guerrilla fighter",
        "timber_card_dealer": "underground card dealer in Timber, shady but friendly, forest town market stall",
        "galbadia_student": "Galbadia Garden student in red cadet uniform, disciplined expression, military bearing",
        "galbadia_instructor": "strict Galbadia Garden instructor, older officer in red uniform, authoritative",
        "deling_city_guard": "Deling City palace guard, ornate uniform, standing at attention, night city lights",
        "generals_aide": "General's aide in Deling City, sharp military dress uniform, political figure",
        "deling_card_emporium": "upscale card shop owner in Deling City, well-dressed merchant, elegant store interior",
        "deling_tournament": "Deling City Tournament organiser, formal event coordinator, grand arena, night setting",
        "winhill_villager": "peaceful Winhill villager, elderly person in simple country clothes, flower garden",
        "winhill_flower_girl": "young flower girl from Winhill, carrying bouquet, simple dress, gentle countryside",
        "fh_resident": "Fisherman's Horizon resident, mechanic in work clothes, bridge city, peaceful",
        "bridge_mechanic": "bridge mechanic at FH, muscular worker with tools, oil-stained clothes, crane background",
        "fh_fisherman": "old fisherman at Fisherman's Horizon, patient expression, fishing rod, ocean bridge",
        "fh_card_trader": "FH card trader, relaxed merchant on bridge walkway, ocean breeze, cards displayed",
        "fh_tournament": "FH Tournament referee, casual official, bridge arena, ocean backdrop",
        "mayor_dobe": "Mayor Dobe of Fisherman's Horizon, elderly pacifist leader, simple clothes, wise expression",
        "fh_master": "FH Card Master, elderly master player, years of experience, knowing smile, bridge setting",
        "trabia_student": "Trabia Garden student, young person in heavy winter coat, cold breath visible, snowy ruins",
        "trabia_scout": "Trabia Garden scout, agile young person in white winter gear, binoculars, mountain lookout",
        "trabia_champion": "Trabia's strongest card player, confident young duelist in fur-lined coat, snow background",
        "shumi_elder": "Shumi Elder, tall gentle creature with long arms and kind face, underground village, wise",
        "shumi_artisan": "Shumi Artisan, creative creature with tools, crafting cards, underground workshop",
        "shumi_sculptor": "Shumi Sculptor, artistic creature with chisel, underground village, thoughtful expression",
        "shumi_attendant": "Shumi Attendant, helpful creature at village entrance, welcoming gesture, underground dome",
        "white_seed": "White SeeD warrior on ship, white uniform, sword at side, ocean background, noble",
        "white_seed_captain": "White SeeD Ship Captain, mature warrior in white captain's uniform, commanding presence, ship helm",
        "white_seed_merchant": "White SeeD merchant on ship, trader in white robes, cards and goods displayed on deck",
        "ruin_explorer": "adventurous ruin explorer near Edea's House, weathered traveller with maps and supplies",
        "tonberry_king_npc": "Tonberry King, small green creature with crown and lantern, cute but dangerous, Final Fantasy",
        "esthar_scientist": "Esthar scientist in white futuristic lab coat, holographic displays, high-tech laboratory",
        "esthar_soldier": "Esthar soldier in advanced blue-white armor, energy weapon, futuristic city patrol",
        "esthar_card_lab": "Esthar Card Lab technician, white coat, analysing cards with holographic scanner",
        "space_engineer": "space engineer from Esthar, technical jumpsuit, blueprints, orbital mechanics diagrams",
        "esthar_official": "Esthar government official, formal futuristic robes, dignified, presidential palace",
        "esthar_tournament": "Esthar Tournament director, futuristic formal attire, holographic arena, high-tech setting",
        "memorial_curator": "Sorceress Memorial curator, scholarly person in Esthar robes, crystal displays, solemn",
    }

    if npc_id in named_npcs:
        return named_npcs[npc_id]

    # Fallback: generate from type and region
    if npc_type == "duel" and isinstance(NPC_TYPE_TEMPLATES["duel"], dict):
        region_desc = NPC_TYPE_TEMPLATES["duel"].get(region_id, "warrior in fantasy outfit, determined expression")
        return f"portrait of {npc_name}, {region_desc}"
    elif npc_type in NPC_TYPE_TEMPLATES:
        return f"portrait of {npc_name}, {NPC_TYPE_TEMPLATES[npc_type]}"
    else:
        return f"portrait of {npc_name}, fantasy character, detailed face, anime style"


def main():
    mode = os.environ.get("MODE", "all")  # "locations", "portraits", or "all"
    print(f"=== Triple Triad Art Generator ===")
    print(f"Mode: {mode}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")

    # Load SDXL-Turbo for fast generation
    print("\nLoading SDXL-Turbo model...")
    pipe = AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sdxl-turbo",
        torch_dtype=torch.float16,
        variant="fp16",
    )
    pipe.to("cuda")
    print("Model loaded!\n")

    style_suffix = ", high quality, detailed, anime art style, Final Fantasy VIII aesthetic, vivid colors"
    neg_prompt = "blurry, low quality, text, watermark, signature, deformed, ugly, bad anatomy, extra limbs, disfigured, poorly drawn face, mutation, extra fingers"

    total_generated = 0
    start_time = time.time()

    # ── Generate location backgrounds ────────────────────────────────────
    if mode in ("all", "locations"):
        print(f"=== Generating {len(LOCATION_PROMPTS)} location backgrounds ===")
        for loc_id, prompt in LOCATION_PROMPTS.items():
            out_path = os.path.join(LOCATIONS_DIR, f"{loc_id}.png")
            if os.path.exists(out_path):
                print(f"  [skip] {loc_id} (already exists)")
                continue
            full_prompt = prompt + style_suffix
            print(f"  [{total_generated+1}] {loc_id}: {prompt[:60]}...")
            image = pipe(
                prompt=full_prompt,
                negative_prompt=neg_prompt,
                num_inference_steps=4,
                guidance_scale=0.0,
                width=768,
                height=512,
            ).images[0]
            image.save(out_path)
            total_generated += 1

    # ── Generate NPC portraits ───────────────────────────────────────────
    if mode in ("all", "portraits"):
        # Load NPC data
        npcs_file = "/app/npcs.json"
        if not os.path.exists(npcs_file):
            print("ERROR: npcs.json not found at /app/npcs.json")
            return

        with open(npcs_file) as f:
            npcs = json.load(f)

        # Map locationId → regionId
        locs_file = "/app/locations.json"
        loc_to_region = {}
        if os.path.exists(locs_file):
            with open(locs_file) as f:
                locs = json.load(f)
                loc_to_region = {l["id"]: l["regionId"] for l in locs}

        # Deduplicate by name — some NPCs appear in multiple locations (Rinoa, Zell, etc.)
        # We only want one portrait per unique NPC appearance
        seen_ids = set()
        unique_npcs = []
        for npc in npcs:
            if npc["id"] not in seen_ids:
                seen_ids.add(npc["id"])
                unique_npcs.append(npc)

        print(f"\n=== Generating {len(unique_npcs)} NPC portraits ===")
        for npc in unique_npcs:
            npc_id = npc["id"]
            out_path = os.path.join(PORTRAITS_DIR, f"{npc_id}.png")
            if os.path.exists(out_path):
                print(f"  [skip] {npc_id} (already exists)")
                continue

            region_id = loc_to_region.get(npc["locationId"], "balamb")
            prompt = get_npc_prompt(npc_id, npc["name"], npc["type"], npc["locationId"], region_id)
            full_prompt = "character portrait, " + prompt + ", anime art style, Final Fantasy VIII aesthetic, detailed face, high quality"

            print(f"  [{total_generated+1}] {npc_id}: {prompt[:60]}...")
            image = pipe(
                prompt=full_prompt,
                negative_prompt=neg_prompt,
                num_inference_steps=4,
                guidance_scale=0.0,
                width=512,
                height=512,
            ).images[0]
            image.save(out_path)
            total_generated += 1

    elapsed = time.time() - start_time
    print(f"\n=== Done! Generated {total_generated} images in {elapsed:.1f}s ({elapsed/max(total_generated,1):.1f}s per image) ===")


if __name__ == "__main__":
    main()
