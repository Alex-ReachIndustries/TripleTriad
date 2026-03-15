"""
Generate background music tracks for Triple Triad by calling the ACE-Step API.
Requires the musicgen service to be running:
  docker compose -f docker-compose.yml -f docker-compose.music.yml up musicgen

Then run this script locally:
  python musicgen/generate_music.py

Or generate specific tracks:
  python musicgen/generate_music.py title battle_early boss_tier3

Output: frontend/public/music/*.mp3
"""

import os
import sys
import time
import json
import urllib.request
import urllib.error
import urllib.parse

API_URL = os.environ.get("MUSICGEN_API", "http://localhost:8090")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "music")
POLL_INTERVAL = 5  # seconds between result polls
TIMEOUT = 600      # max seconds to wait per track

# ── Track definitions ────────────────────────────────────────────────────────

# ── Nobuo Uematsu-inspired prompts: layered orchestration, lyrical piano,
#    waltz rhythms, Latin guitar, electronic textures, emotional counterpoint.
#    Each prompt references the specific FF8 story beat and location. ──────────

UI_TRACKS = [
    {"id": "title", "caption": "Nobuo Uematsu style, solo piano opening with melancholic descending melody, strings slowly enter with warm countermelody, theme of fate and lost memories, gentle harp arpeggios underneath, builds to hopeful orchestral swell then returns to intimate piano, Liberi Fatali influence, cinematic and nostalgic, loopable", "bpm": 72, "duration": 60, "keyscale": "Eb Major"},
    {"id": "world_map", "caption": "Nobuo Uematsu style, sweeping orchestral overworld theme, adventurous French horn melody over flowing string accompaniment, flute countermelody, harp arpeggios like Blue Fields, sense of vast open plains and endless ocean, young mercenaries exploring the world, timpani accents on downbeats, majestic but youthful energy, loopable", "bpm": 110, "duration": 75, "keyscale": "D Major"},
    {"id": "victory", "caption": "Nobuo Uematsu style, classic Final Fantasy victory fanfare, bright trumpet melody ascending in triumph, snare roll into full brass and strings climax, joyful and celebratory, short and punchy", "bpm": 120, "duration": 12, "keyscale": "Bb Major"},
    {"id": "defeat", "caption": "Nobuo Uematsu style, somber piano descending in minor key, soft sustained strings beneath, a single card falling, quiet and reflective, brief melancholic resolution", "bpm": 65, "duration": 12, "keyscale": "F minor"},
    {"id": "shop", "caption": "Nobuo Uematsu style, lighthearted pizzicato strings with glockenspiel melody, playful woodwind accents, browsing rare cards at a merchant stall, gentle bounce rhythm, whimsical and inviting like a cozy card shop, loopable", "bpm": 105, "duration": 45, "keyscale": "F Major"},
]

TOWN_TRACKS = [
    {"id": "town_balamb_garden", "caption": "Nobuo Uematsu style, bright and youthful academy theme, flowing flute melody over light marching snare, young SeeD cadets training and studying, hopeful brass undertones like morning assembly, piano provides warmth, the excitement of first days at a military school, loopable", "bpm": 100, "duration": 60, "keyscale": "C Major"},
    {"id": "town_balamb_town", "caption": "Nobuo Uematsu style, peaceful coastal town, gentle nylon guitar melody with soft piano accompaniment, sea breeze and harbor bells, Squall's quiet hometown by the ocean, warm and unhurried, light tambourine rhythm, nostalgic longing for simpler times, loopable", "bpm": 84, "duration": 55, "keyscale": "G Major"},
    {"id": "town_dollet", "caption": "Nobuo Uematsu style, charming European port town, accordion waltz with violin melody, cobblestone streets and cafe terraces, the site of the SeeD field exam, elegant but with an undercurrent of tension, light percussion like distant footsteps, old world grace, loopable", "bpm": 90, "duration": 55, "keyscale": "A Major"},
    {"id": "town_timber", "caption": "Nobuo Uematsu style, resistance hideout theme, muted trumpet over brushed snare jazz groove, the Forest Owls and Rinoa's fight for independence, secretive night atmosphere, walking bass line, tension mixed with youthful idealism, underground and smoky, loopable", "bpm": 95, "duration": 55, "keyscale": "Bb minor"},
    {"id": "town_galbadia_garden", "caption": "Nobuo Uematsu style, imposing rival academy theme, heavy brass march with militaristic timpani, cold discipline and rigid hierarchy, where Seifer's ambitions were forged, stern string ostinato underneath, impressive but unwelcoming, loopable", "bpm": 96, "duration": 55, "keyscale": "D minor"},
    {"id": "town_deling_city", "caption": "Nobuo Uematsu style, grand capital city at night, sophisticated piano with jazz saxophone, the seat of Galbadian power where the sorceress reveals herself, elegant orchestral swells, cosmopolitan glamour hiding political darkness, nightclub ambience, loopable", "bpm": 108, "duration": 60, "keyscale": "Ab Major"},
    {"id": "town_winhill", "caption": "Nobuo Uematsu style, tender pastoral village, delicate music box melody joined by solo violin, Laguna's quiet life raising Ellone among flower fields, deeply nostalgic and bittersweet, gentle piano chords like afternoon sunlight, a father's hidden love, loopable", "bpm": 72, "duration": 50, "keyscale": "F Major"},
    {"id": "town_fishermans_horizon", "caption": "Nobuo Uematsu style, pacifist harbor town, warm acoustic guitar with harmonica melody, the town that refused to fight built on a bridge over the sea, folk feel like Fisherman's Horizon theme, gentle optimism, ocean waves and seagulls in the distance, peaceful refuge after crisis, loopable", "bpm": 80, "duration": 55, "keyscale": "E Major"},
    {"id": "town_trabia_garden", "caption": "Nobuo Uematsu style, snow-covered ruins, melancholic celesta over sustained strings, Selphie's destroyed school, gentle snowfall, hope persisting through devastation, soft piano enters with a fragile melody, childhood friends reunited among rubble, bittersweet, loopable", "bpm": 76, "duration": 55, "keyscale": "Db Major"},
    {"id": "town_edeas_house", "caption": "Nobuo Uematsu style, childhood orphanage lullaby, intimate music box melody with tender solo piano, the stone house by the lighthouse where it all began, Edea and Cid raised them all, deeply emotional nostalgia, strings swell gently then recede, innocence before the storm, loopable", "bpm": 68, "duration": 55, "keyscale": "Eb Major"},
    {"id": "town_white_seed_ship", "caption": "Nobuo Uematsu style, mysterious vessel at sea, wooden flute melody over gentle harp arpeggios, the White SeeD ship carrying Ellone across the ocean, eastern-tinged instrumentation, exotic and secretive, waves lapping against the hull, a hidden mission, loopable", "bpm": 88, "duration": 55, "keyscale": "E minor"},
    {"id": "town_esthar_city", "caption": "Nobuo Uematsu style, futuristic hidden city revealed, shimmering synth pads building to orchestral grandeur, the most advanced civilization on the planet sealed away for decades, electronic textures blending with soaring strings, overwhelming awe and wonder, Laguna's secret kingdom, loopable", "bpm": 100, "duration": 60, "keyscale": "B Major"},
    {"id": "town_sorceress_memorial", "caption": "Nobuo Uematsu style, solemn memorial shrine, haunting sustained choir with slow cello melody, sorceress Adel sealed in orbit above, sacred and heavy with centuries of fear, ethereal organ pads, crystalline imprisonment, the weight of magical power contained, loopable", "bpm": 66, "duration": 50, "keyscale": "C minor"},
    {"id": "town_shumi_village", "caption": "Nobuo Uematsu style, mystical underground village, ethereal tubular bells with flowing harp, the gentle Shumi artisans who sculpt and evolve, ancient wisdom in caverns of light, ambient nature textures, contemplative and otherworldly, tribal rhythms beneath serene melody, loopable", "bpm": 78, "duration": 55, "keyscale": "Gb Major"},
]

DUNGEON_TRACKS = [
    {"id": "dungeon_fire_cavern", "caption": "Nobuo Uematsu style, volcanic trial under a time limit, deep taiko drums with ominous low brass, Squall's SeeD exam to prove his worth against Ifrit, heat shimmer strings tremolo, building tension with each step deeper, ticking urgency beneath the fire, loopable", "bpm": 98, "duration": 65, "keyscale": "D minor"},
    {"id": "dungeon_radio_tower", "caption": "Nobuo Uematsu style, Dollet communication tower infiltration, tense snare patterns with urgent staccato strings, Seifer charges ahead recklessly, the SeeD field exam turns dangerous, radio static texture underneath, military precision crumbling into chaos, loopable", "bpm": 120, "duration": 65, "keyscale": "C minor"},
    {"id": "dungeon_tomb_of_unknown_king", "caption": "Nobuo Uematsu style, ancient royal tomb deep underground, eerie reverberant choir with solo cello, searching for the GF Brothers in haunted corridors, mysterious harp echoing off stone walls, creeping dread, the minotaur brothers guard their domain, loopable", "bpm": 82, "duration": 65, "keyscale": "Eb minor"},
    {"id": "dungeon_deling_sewers", "caption": "Nobuo Uematsu style, sewer infiltration before the sorceress assassination, sneaking bass clarinet over brushed snare, dark jazz tension, the team splits up beneath Deling City, dripping water ambience, muted trumpet like a noir thriller, the plan is set in motion, loopable", "bpm": 92, "duration": 60, "keyscale": "Bb minor"},
    {"id": "dungeon_d_district_prison", "caption": "Nobuo Uematsu style, desert prison oppression, relentless industrial percussion with metallic clangs, Squall tortured and imprisoned after the failed assassination, claustrophobic low strings, desperate rhythmic urgency, the team must break free or die, loopable", "bpm": 105, "duration": 65, "keyscale": "F minor"},
    {"id": "dungeon_galbadia_missile_base", "caption": "Nobuo Uematsu style, missile base countdown infiltration, alarm klaxon texture over driving electronic beat, Selphie's team must stop the missiles targeting Balamb and Trabia Garden, frantic brass stabs, ticking clock tension building to crisis, self-destruct sequence initiated, loopable", "bpm": 135, "duration": 65, "keyscale": "A minor"},
    {"id": "dungeon_balamb_garden_basement", "caption": "Nobuo Uematsu style, hidden facility beneath the school, mysterious synth drones with distant piano echoes, discovering that Balamb Garden was built on ancient Centra technology, mechanical hums, decades of secrets underground, eerie wonder turning to revelation, loopable", "bpm": 88, "duration": 60, "keyscale": "G minor"},
    {"id": "dungeon_balamb_under_siege", "caption": "Nobuo Uematsu style, hometown under Galbadian occupation, defiant march rhythm with heroic trumpet melody, the townspeople held hostage while Squall returns to liberate Balamb, snare and brass building courage, streets he grew up in now a battlefield, loopable", "bpm": 118, "duration": 65, "keyscale": "E minor"},
    {"id": "dungeon_roaming_forest", "caption": "Nobuo Uematsu style, enchanted forest that moves between continents, ethereal woodwinds with mystical harp and light tribal percussion, searching for the way to Esthar through shifting magical paths, whimsical yet unsettling, nature alive with ancient power, loopable", "bpm": 90, "duration": 60, "keyscale": "F# minor"},
    {"id": "dungeon_galbadia_garden_revolution", "caption": "Nobuo Uematsu style, two flying Gardens clash in aerial battle, epic full orchestra with pounding timpani and blazing brass, SeeD versus Galbadia in a school-against-school war, Squall leads the charge against Seifer, heroic chaos and determination at maximum intensity, loopable", "bpm": 140, "duration": 70, "keyscale": "D minor"},
    {"id": "dungeon_great_salt_lake", "caption": "Nobuo Uematsu style, desolate salt flats before Esthar, sparse lonely piano over ambient wind drones, endless white wasteland, the long march to find Ellone, haunting isolation, each footstep echoing across crystallised ground, minimal and vast, loopable", "bpm": 75, "duration": 60, "keyscale": "C# minor"},
    {"id": "dungeon_lunar_base", "caption": "Nobuo Uematsu style, orbital space station, weightless electronic pads with ethereal strings, monitoring the Lunar Cry from above the planet, sci-fi wonder mixed with creeping danger, Rinoa drifts unconscious in space, isolated and fragile, loopable", "bpm": 90, "duration": 65, "keyscale": "B minor"},
    {"id": "dungeon_deep_sea_research_center", "caption": "Nobuo Uematsu style, deep ocean research facility, crushing sub-bass pressure with sonar ping textures, descending into darkness to find the ultimate GF Bahamut, bioluminescent mystery, oppressive depths, ancient technology from a forgotten age, each floor deeper and more dangerous, loopable", "bpm": 78, "duration": 70, "keyscale": "Ab minor"},
    {"id": "dungeon_lunatic_pandora", "caption": "Nobuo Uematsu style, crystalline monolith floating above Esthar, dissonant choir with pulsing electronic textures, the Lunatic Pandora draws monsters from the moon, reality warping around Adel's power, ominous and alien, the final confrontation approaches, loopable", "bpm": 110, "duration": 70, "keyscale": "E minor"},
    {"id": "dungeon_centra_excavation_site", "caption": "Nobuo Uematsu style, time compression ruins, distorted reversed orchestra fragments with unstable rhythm, reality folding as Ultimecia compresses all of time, surreal and disorienting, past and future colliding, the fabric of existence unravelling, loopable", "bpm": 100, "duration": 70, "keyscale": "Db minor"},
    {"id": "dungeon_centra_ruins", "caption": "Nobuo Uematsu style, Ultimecia's castle at the end of time, massive pipe organ with full orchestra and dark choir, gothic spires above a dead world, the final dungeon where all power converges, overwhelming grandeur and dread, One Winged Angel influence, loopable", "bpm": 125, "duration": 80, "keyscale": "C minor"},
]

BATTLE_TRACKS = [
    {"id": "battle_early", "caption": "Nobuo Uematsu style, card duel theme for early game, energetic piano-driven melody with punchy brass stabs and ride cymbal, friendly competition between cadets, Don't Be Afraid influence, spirited and competitive but lighthearted, electric bass groove, loopable", "bpm": 130, "duration": 70, "keyscale": "A minor"},
    {"id": "battle_mid", "caption": "Nobuo Uematsu style, intense mid-game card battle, driving rock rhythm with distorted guitar riff and orchestral strings, the stakes are real now with rare cards on the line, Force Your Way influence, synth layers building tension, strategic and fierce, loopable", "bpm": 140, "duration": 70, "keyscale": "E minor"},
    {"id": "battle_late", "caption": "Nobuo Uematsu style, epic late-game card duel, full symphonic orchestra with electronic percussion and soaring violin melody, legendary cards at stake, The Extreme influence, relentless intensity building in waves, the fate of collections hanging on every card placed, loopable", "bpm": 152, "duration": 75, "keyscale": "D minor"},
]

BOSS_TRACKS = [
    {"id": "boss_tier1", "caption": "Nobuo Uematsu style, CC Club member card challenge, tense guitar riff with heavy snare and brass stabs, facing a skilled opponent who knows your weaknesses, confident antagonist theme, electric bass driving forward, intimidating but beatable, loopable", "bpm": 142, "duration": 75, "keyscale": "G minor"},
    {"id": "boss_tier2", "caption": "Nobuo Uematsu style, major rival card duel, dramatic orchestral with aggressive electric guitar and pounding timpani, facing the Card Queen or a regional champion, personal pride at stake, Maybe I'm a Lion influence, powerful brass countermelody, intense, loopable", "bpm": 155, "duration": 80, "keyscale": "C minor"},
    {"id": "boss_tier3", "caption": "Nobuo Uematsu style, ultimate card master final duel, apocalyptic full orchestra with dark choir and pipe organ, the most powerful cards in existence at stake, The Extreme influence, earth-shattering percussion, dissonant strings building to impossible climax, terrifying and magnificent, loopable", "bpm": 165, "duration": 90, "keyscale": "Eb minor"},
]

CUTSCENE_TRACKS = [
    {"id": "cutscene_opening", "caption": "Nobuo Uematsu style, Liberi Fatali inspired opening, solo piano melody of destiny rising into sweeping orchestral strings, two rival swords clash as a story of fate begins, youthful determination meets ancient prophecy, choir enters at the climax, grand and cinematic", "bpm": 80, "duration": 50, "keyscale": "C Major"},
    {"id": "cutscene_fire_cavern", "caption": "Nobuo Uematsu style, SeeD field exam in the volcanic cavern, building brass and timpani over ticking rhythmic tension, proving worthiness to become a mercenary, the heat intensifies, triumphant horn melody as the challenge is overcome", "bpm": 95, "duration": 40, "keyscale": "D minor"},
    {"id": "cutscene_seed_ball", "caption": "Nobuo Uematsu style, Waltz for the Moon inspired, elegant 3/4 time with sweeping strings and piano, Squall and Rinoa dancing under shooting stars at the SeeD graduation ball, romantic and magical, the moment that changes everything, tender and breathtaking", "bpm": 94, "duration": 50, "keyscale": "Ab Major"},
    {"id": "cutscene_laguna_dream", "caption": "Nobuo Uematsu style, Laguna's dream sequence, warm nostalgic jazz piano with muted trumpet, a soldier's clumsy love story in another time, Man With The Machine Gun softness, hazy and dreamlike, memories bleeding through time, bittersweet and charming", "bpm": 78, "duration": 45, "keyscale": "Db Major"},
    {"id": "cutscene_sorceress_parade", "caption": "Nobuo Uematsu style, Fithos Lusec Wecos Vinosec inspired, dark ceremonial procession with ominous choir and distorted brass, Edea's terrifying parade through Deling City, the assassination plan unfolds, sinister grandeur hiding murderous intent, chilling", "bpm": 88, "duration": 50, "keyscale": "Bb minor"},
    {"id": "cutscene_prison_escape", "caption": "Nobuo Uematsu style, desperate breakout from D-District prison, frantic racing strings with pounding percussion, Squall recovers from torture as friends stage a rescue, pulse-pounding urgency, brass screaming defiance, every second counts", "bpm": 140, "duration": 40, "keyscale": "F minor"},
    {"id": "cutscene_missile_base", "caption": "Nobuo Uematsu style, missile base self-destruct countdown, ticking electronic pulses over escalating brass, Selphie's team races against time to stop the launch, mechanical tension building to panic, the base is going to explode", "bpm": 145, "duration": 40, "keyscale": "A minor"},
    {"id": "cutscene_garden_flight", "caption": "Nobuo Uematsu style, Balamb Garden takes flight, awe-inspiring strings lifting upward like wings unfurling, the school transforms into a vessel and soars above the ocean, a moment of pure wonder, majestic brass joins as the horizon opens, breathtaking revelation", "bpm": 92, "duration": 45, "keyscale": "E Major"},
    {"id": "cutscene_fh_arrival", "caption": "Nobuo Uematsu style, crash landing at Fisherman's Horizon, gentle acoustic guitar with ocean ambience, relief washing over after crisis, the pacifist town offers shelter, warm gratitude and tentative hope, Squall begins to open his heart", "bpm": 76, "duration": 40, "keyscale": "G Major"},
    {"id": "cutscene_balamb_liberation", "caption": "Nobuo Uematsu style, liberating Balamb from occupation, triumphant brass fanfare with marching snare, Squall returns to free his hometown from Galbadian soldiers, proud defiance building to victory, the townsfolk are saved", "bpm": 112, "duration": 40, "keyscale": "Bb Major"},
    {"id": "cutscene_trabia_truth", "caption": "Nobuo Uematsu style, devastating truth at ruined Trabia Garden, fragile solo piano breaking into anguished strings, the orphanage memory returns and everything changes, GFs stole their childhood memories, Irvine weeps as he alone remembered, heartbreaking revelation", "bpm": 68, "duration": 55, "keyscale": "F minor"},
    {"id": "cutscene_garden_battle", "caption": "Nobuo Uematsu style, Battle of the Gardens, massive orchestral clash with full percussion and blazing brass, two flying schools collide in aerial warfare, SeeD boarding Galbadia Garden, Squall versus Seifer, chaotic and heroic, the biggest battle of the war", "bpm": 148, "duration": 50, "keyscale": "D minor"},
    {"id": "cutscene_orphanage", "caption": "Nobuo Uematsu style, return to the orphanage, tender music box melody building to emotional piano and strings, they all grew up together and forgot, Edea was their Matron, the stone house by the sea holds all their lost memories, tears of recognition, deeply moving", "bpm": 64, "duration": 50, "keyscale": "Eb Major"},
    {"id": "cutscene_esthar_arrival", "caption": "Nobuo Uematsu style, first sight of Esthar city, electronic shimmer building to full orchestral grandeur, the invisible barrier falls and a futuristic metropolis stretches to the horizon, overwhelming wonder at hidden technology, Laguna rules here, sci-fi awe", "bpm": 96, "duration": 45, "keyscale": "B Major"},
    {"id": "cutscene_space_rescue", "caption": "Nobuo Uematsu style, Squall rescues Rinoa in space, ethereal ambient strings with emotional solo piano, drifting through stars to catch the one he loves, Eyes On Me piano influence, weightless and desperate, the most romantic moment in the game, beautiful isolation", "bpm": 72, "duration": 55, "keyscale": "G# minor"},
    {"id": "cutscene_deep_sea", "caption": "Nobuo Uematsu style, descent into the deep sea research center, crushing orchestral weight with distant piano, ancient Centra technology in the ocean abyss, each floor reveals greater danger, sub-bass pressure and sonar textures, claustrophobic wonder", "bpm": 70, "duration": 45, "keyscale": "Ab minor"},
    {"id": "cutscene_fujin_plea", "caption": "Nobuo Uematsu style, Fujin begs Seifer to stop, raw solo oboe melody breaking silence, a loyal friend's desperate plea to someone lost to darkness, Raijin stands beside her, quiet and devastating, the posse's bond tested, tearful and intimate", "bpm": 60, "duration": 40, "keyscale": "C minor"},
    {"id": "cutscene_time_compression", "caption": "Nobuo Uematsu style, Ultimecia compresses time, distorted reversed orchestra fragments with unstable electronic pulses, reality fractures and past present future collapse together, terrifying cosmic scope, dissonant choir, the world dissolving into chaos", "bpm": 110, "duration": 50, "keyscale": "F# minor"},
    {"id": "cutscene_ending", "caption": "Nobuo Uematsu style, grand finale, solo piano of the main theme building slowly into full orchestra with choir, Squall finds his way back through compressed time to Rinoa, Eyes On Me melody woven into orchestral triumph, love conquers even the end of time, tears of joy, hopeful and magnificent resolution", "bpm": 85, "duration": 70, "keyscale": "C Major"},
]

ALL_TRACKS = UI_TRACKS + TOWN_TRACKS + DUNGEON_TRACKS + BATTLE_TRACKS + BOSS_TRACKS + CUTSCENE_TRACKS


def api_post(endpoint, data):
    """POST JSON to the API and return parsed response."""
    payload = json.dumps(data).encode()
    req = urllib.request.Request(
        f"{API_URL}{endpoint}",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def submit_task(track, seed):
    """Submit a generation task via POST /release_task. Returns task_id."""
    data = {
        "prompt": track["caption"],
        "lyrics": "[Instrumental]",
        "bpm": track["bpm"],
        "audio_duration": track["duration"],
        "key_scale": track.get("keyscale", ""),
        "inference_steps": 8,
        "shift": 3.0,
        "seed": seed,
        "use_random_seed": "false",
        "audio_format": "mp3",
        "batch_size": 1,
    }
    resp = api_post("/release_task", data)
    result = resp.get("data", resp)
    return result["task_id"]


def poll_result(task_id):
    """Poll POST /query_result until the task completes. Returns audio download URL or error."""
    start = time.time()
    while time.time() - start < TIMEOUT:
        resp = api_post("/query_result", {"task_id_list": [task_id]})
        # Response: {"data": [{"task_id": ..., "status": 0|1|2, "result": "JSON string"}]}
        data_list = resp.get("data", [])
        if isinstance(data_list, dict):
            data_list = data_list.get("data_list", [])

        for item in data_list:
            status = item.get("status", 0)
            if status == 1:  # succeeded
                result = item.get("result", "")
                if isinstance(result, str):
                    try:
                        result = json.loads(result)
                    except (json.JSONDecodeError, TypeError):
                        pass
                if isinstance(result, list) and result:
                    # "file" is already a URL path like /v1/audio?path=...
                    return result[0].get("file", None)
                return None
            elif status == 2:  # failed/timeout
                error = item.get("error", "unknown")
                return f"ERROR: {error}"

        time.sleep(POLL_INTERVAL)

    return "ERROR: timeout"


def download_audio(file_url, out_path):
    """Download an audio file. file_url is a relative path like /v1/audio?path=..."""
    url = f"{API_URL}{file_url}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=120) as resp:
        with open(out_path, "wb") as f:
            f.write(resp.read())


def generate_track(track, output_dir, seed):
    """Submit, poll, and download one track. Returns output path or error string."""
    try:
        task_id = submit_task(track, seed)
    except Exception as e:
        return f"ERROR submitting: {e}"

    result = poll_result(task_id)
    if result is None:
        return "ERROR: no audio in result"
    if isinstance(result, str) and result.startswith("ERROR"):
        return result

    out_path = os.path.join(output_dir, f"{track['id']}.mp3")
    try:
        download_audio(result, out_path)
    except Exception as e:
        return f"ERROR downloading: {e}"

    return out_path


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Filter tracks by CLI args
    tracks = ALL_TRACKS
    if len(sys.argv) > 1:
        ids = set(sys.argv[1:])
        tracks = [t for t in ALL_TRACKS if t["id"] in ids]

    # Check API health
    try:
        urllib.request.urlopen(f"{API_URL}/health", timeout=5)
    except Exception:
        print(f"ERROR: Cannot reach musicgen API at {API_URL}")
        print("Start the service first:")
        print("  docker compose -f docker-compose.yml -f docker-compose.music.yml up musicgen")
        sys.exit(1)

    print(f"Generating {len(tracks)} music tracks via {API_URL}...")
    print(f"Output: {OUTPUT_DIR}\n")

    success = 0
    skipped = 0
    failed = 0

    for i, track in enumerate(tracks):
        out_path = os.path.join(OUTPUT_DIR, f"{track['id']}.mp3")
        if os.path.exists(out_path):
            print(f"[{i+1}/{len(tracks)}] {track['id']} — exists, skipping")
            skipped += 1
            continue

        seed = 42 + ALL_TRACKS.index(track)
        print(f"[{i+1}/{len(tracks)}] {track['id']} ({track['duration']}s, seed={seed})...", end=" ", flush=True)
        result = generate_track(track, OUTPUT_DIR, seed)

        if isinstance(result, str) and result.startswith("ERROR"):
            print(f"FAIL {result}")
            failed += 1
        else:
            print("OK")
            success += 1

    print(f"\nDone! {success} generated, {skipped} skipped, {failed} failed.")


if __name__ == "__main__":
    main()
