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

UI_TRACKS = [
    {"id": "title", "caption": "calm nostalgic JRPG title screen music, soft piano melody with gentle strings, Final Fantasy 8 inspired, melancholic yet hopeful, ambient pads, warm orchestral, slow tempo, loopable", "bpm": 72, "duration": 60, "keyscale": "Eb Major"},
    {"id": "world_map", "caption": "adventurous orchestral world map exploration theme, JRPG overworld, soaring strings and brass, upbeat and majestic, harp arpeggios with flute, heroic, loopable", "bpm": 110, "duration": 75, "keyscale": "D Major"},
    {"id": "victory", "caption": "short triumphant victory fanfare, JRPG win music, bright brass and strings, celebratory and joyful, ascending melody, classic Final Fantasy style", "bpm": 120, "duration": 12, "keyscale": "Bb Major"},
    {"id": "defeat", "caption": "short somber defeat music, sad descending melody, slow piano and strings, melancholic and reflective, JRPG game over jingle, minor key", "bpm": 65, "duration": 12, "keyscale": "F minor"},
    {"id": "shop", "caption": "light cheerful shop music, playful pizzicato strings with xylophone, JRPG item shop theme, casual and upbeat, bouncy rhythm, friendly, loopable", "bpm": 105, "duration": 45, "keyscale": "F Major"},
]

TOWN_TRACKS = [
    {"id": "town_balamb_garden", "caption": "military academy theme, bright and youthful, marching snare with hopeful flute melody, brass fanfare undertone, JRPG school setting, energetic but disciplined, loopable", "bpm": 100, "duration": 60, "keyscale": "C Major"},
    {"id": "town_balamb_town", "caption": "peaceful coastal town theme, gentle ocean waves ambience, acoustic guitar with light piano, warm and sunny, JRPG seaside village, relaxing, loopable", "bpm": 84, "duration": 55, "keyscale": "G Major"},
    {"id": "town_dollet", "caption": "old European port town theme, accordion with gentle strings, cobblestone charm, slightly melancholic yet beautiful, JRPG medieval town, warm woodwinds, loopable", "bpm": 90, "duration": 55, "keyscale": "A Major"},
    {"id": "town_timber", "caption": "resistance hideout theme, tense but hopeful, muted trumpet with underground jazz feel, urban night atmosphere, JRPG rebel base, snare brushes, secretive, loopable", "bpm": 95, "duration": 55, "keyscale": "Bb minor"},
    {"id": "town_galbadia_garden", "caption": "imposing military academy theme, strict and powerful, heavy brass with martial drums, disciplined and cold atmosphere, JRPG rival school, grand but intimidating, loopable", "bpm": 96, "duration": 55, "keyscale": "D minor"},
    {"id": "town_deling_city", "caption": "grand metropolitan city theme, sophisticated orchestral with jazz influences, bustling nightlife feel, piano and saxophone, JRPG capital city, elegant, loopable", "bpm": 108, "duration": 60, "keyscale": "Ab Major"},
    {"id": "town_winhill", "caption": "quiet pastoral village theme, gentle music box melody with soft strings, nostalgic and bittersweet, flower fields, JRPG countryside, tender piano, loopable", "bpm": 72, "duration": 50, "keyscale": "F Major"},
    {"id": "town_fishermans_horizon", "caption": "pacifist harbor theme, gentle waves with acoustic guitar and harmonica, laid-back folk feel, bridge over ocean, JRPG peaceful settlement, warm sunset, loopable", "bpm": 80, "duration": 55, "keyscale": "E Major"},
    {"id": "town_trabia_garden", "caption": "snow-covered ruins theme, melancholic celesta with soft strings, gentle snowfall feel, hopeful despite destruction, JRPG frozen school, bittersweet, loopable", "bpm": 76, "duration": 55, "keyscale": "Db Major"},
    {"id": "town_edeas_house", "caption": "childhood orphanage theme, gentle lullaby with music box and soft piano, deeply emotional and nostalgic, JRPG memory scene, tender strings, loopable", "bpm": 68, "duration": 55, "keyscale": "Eb Major"},
    {"id": "town_white_seed_ship", "caption": "mysterious ship at sea theme, ocean waves with eastern instruments, exotic and secretive, wooden flute and dulcimer, JRPG nautical mystery, loopable", "bpm": 88, "duration": 55, "keyscale": "E minor"},
    {"id": "town_esthar_city", "caption": "futuristic technologically advanced city theme, electronic synth pads with orchestra, sleek and awe-inspiring, neon glow feel, JRPG sci-fi city, ambient and grand, loopable", "bpm": 100, "duration": 60, "keyscale": "B Major"},
    {"id": "town_sorceress_memorial", "caption": "solemn memorial theme, haunting choir with slow strings, sacred and heavy atmosphere, sorceress imprisoned in crystal, JRPG shrine, ethereal organ, loopable", "bpm": 66, "duration": 50, "keyscale": "C minor"},
    {"id": "town_shumi_village", "caption": "mystical underground village theme, ethereal bells with harp, tribal yet gentle, ancient wisdom atmosphere, JRPG hidden village, ambient nature sounds, loopable", "bpm": 78, "duration": 55, "keyscale": "Gb Major"},
]

DUNGEON_TRACKS = [
    {"id": "dungeon_fire_cavern", "caption": "volcanic cavern theme, intense heat atmosphere, deep rumbling percussion, flickering fire sounds, low brass and ominous strings, JRPG fire dungeon, tense, loopable", "bpm": 98, "duration": 65, "keyscale": "D minor"},
    {"id": "dungeon_radio_tower", "caption": "military infiltration theme, stealth action feel, snare rolls with urgent strings, radio static ambience, JRPG tower climb, tense and driven, loopable", "bpm": 120, "duration": 65, "keyscale": "C minor"},
    {"id": "dungeon_tomb_of_unknown_king", "caption": "ancient tomb exploration theme, eerie echoing choir, stone and darkness, mysterious harp with low cello, JRPG cursed dungeon, creepy and foreboding, loopable", "bpm": 82, "duration": 65, "keyscale": "Eb minor"},
    {"id": "dungeon_deling_sewers", "caption": "underground sewer theme, dripping water ambience, sneaky bass line, dark jazz with muted trumpet, JRPG stealth mission, grimy and tense, loopable", "bpm": 92, "duration": 60, "keyscale": "Bb minor"},
    {"id": "dungeon_d_district_prison", "caption": "desert prison theme, oppressive and claustrophobic, heavy industrial percussion, metallic clangs, desperate atmosphere, JRPG prison escape, urgent, loopable", "bpm": 105, "duration": 65, "keyscale": "F minor"},
    {"id": "dungeon_galbadia_missile_base", "caption": "military base countdown theme, alarm sirens with driving electronic beat, urgent and mechanical, self-destruct tension, JRPG timed mission, frantic, loopable", "bpm": 135, "duration": 65, "keyscale": "A minor"},
    {"id": "dungeon_balamb_garden_basement", "caption": "hidden facility theme, mechanical hums with mysterious synth, ancient secrets below a school, JRPG underground lab, eerie discovery, loopable", "bpm": 88, "duration": 60, "keyscale": "G minor"},
    {"id": "dungeon_balamb_under_siege", "caption": "occupied town battle theme, resistance and urgency, marching drums with defiant melody, streets under siege, JRPG liberation mission, heroic tension, loopable", "bpm": 118, "duration": 65, "keyscale": "E minor"},
    {"id": "dungeon_roaming_forest", "caption": "enchanted moving forest theme, mystical and strange, ethereal woodwinds with tribal drums, shifting paths, JRPG magic forest, whimsical yet dangerous, loopable", "bpm": 90, "duration": 60, "keyscale": "F# minor"},
    {"id": "dungeon_galbadia_garden_revolution", "caption": "aerial garden battle theme, two flying schools clash, epic orchestral combat, soaring brass with urgent strings, JRPG airborne siege, dramatic and grand, loopable", "bpm": 140, "duration": 70, "keyscale": "D minor"},
    {"id": "dungeon_great_salt_lake", "caption": "desolate salt flat theme, barren and blinding white, haunting wind sounds, sparse piano with ambient drones, JRPG wasteland, lonely and vast, loopable", "bpm": 75, "duration": 60, "keyscale": "C# minor"},
    {"id": "dungeon_lunar_base", "caption": "space station theme, zero gravity atmosphere, electronic synth with ambient pads, weightless and isolated, JRPG orbital facility, sci-fi wonder and tension, loopable", "bpm": 90, "duration": 65, "keyscale": "B minor"},
    {"id": "dungeon_deep_sea_research_center", "caption": "deep ocean abyss theme, crushing pressure atmosphere, deep sub-bass with sonar pings, bioluminescent mystery, JRPG underwater dungeon, dark and oppressive, loopable", "bpm": 78, "duration": 70, "keyscale": "Ab minor"},
    {"id": "dungeon_lunatic_pandora", "caption": "crystalline monolith theme, alien structure, dissonant choir with electronic pulses, reality warping feel, JRPG end-game fortress, ominous power, loopable", "bpm": 110, "duration": 70, "keyscale": "E minor"},
    {"id": "dungeon_centra_excavation_site", "caption": "time-warped ruins theme, reality bending, reversed sounds with distorted orchestra, fragments of past and future, JRPG time compression, surreal and disorienting, loopable", "bpm": 100, "duration": 70, "keyscale": "Db minor"},
    {"id": "dungeon_centra_ruins", "caption": "final castle theme, ultimate evil lair, massive pipe organ with full orchestra and choir, gothic and apocalyptic, JRPG final dungeon, overwhelming grandeur, loopable", "bpm": 125, "duration": 80, "keyscale": "C minor"},
]

BATTLE_TRACKS = [
    {"id": "battle_early", "caption": "upbeat card game battle theme, energetic and fun, JRPG early battle, playful electric guitar with light drums, competitive but lighthearted, loopable", "bpm": 130, "duration": 70, "keyscale": "A minor"},
    {"id": "battle_mid", "caption": "intense card duel theme, driving rhythm with synth and rock guitar, stakes are higher, JRPG mid-game battle, strategic tension, powerful drums, loopable", "bpm": 140, "duration": 70, "keyscale": "E minor"},
    {"id": "battle_late", "caption": "epic high-stakes card battle theme, full orchestra with electronic elements, world-ending tension, JRPG late-game battle, aggressive and relentless, loopable", "bpm": 152, "duration": 75, "keyscale": "D minor"},
]

BOSS_TRACKS = [
    {"id": "boss_tier1", "caption": "minor boss encounter theme, tense and exciting, heavy snare with brass stabs, JRPG mini-boss, confident antagonist, electric guitar riff, driven, loopable", "bpm": 142, "duration": 75, "keyscale": "G minor"},
    {"id": "boss_tier2", "caption": "major boss battle theme, dramatic orchestral with aggressive electric guitar, JRPG rival battle, powerful brass and timpani, personal stakes, intense, loopable", "bpm": 155, "duration": 80, "keyscale": "C minor"},
    {"id": "boss_tier3", "caption": "ultimate boss battle theme, apocalyptic orchestral with choir and organ, JRPG final boss, earth-shattering drums, dissonant strings, relentless and terrifying, building to climax, most intense music in the game, loopable", "bpm": 165, "duration": 90, "keyscale": "Eb minor"},
]

CUTSCENE_TRACKS = [
    {"id": "cutscene_opening", "caption": "JRPG opening cinematic theme, grand and hopeful, piano intro building to full orchestra, beginning of an adventure, youthful determination, sweeping strings", "bpm": 80, "duration": 50, "keyscale": "C Major"},
    {"id": "cutscene_fire_cavern", "caption": "volcanic trial theme, heat and determination, building intensity with brass and timpani, proving yourself worthy, JRPG exam challenge, triumphant resolution", "bpm": 95, "duration": 40, "keyscale": "D minor"},
    {"id": "cutscene_seed_ball", "caption": "elegant ballroom waltz theme, romantic and magical, sweeping strings with piano, dancing under stars, JRPG graduation ball, beautiful and tender", "bpm": 94, "duration": 50, "keyscale": "Ab Major"},
    {"id": "cutscene_laguna_dream", "caption": "dreamy nostalgic flashback theme, hazy and warm, soft jazz piano with muted trumpet, another person's memories, JRPG dream sequence, bittersweet longing", "bpm": 78, "duration": 45, "keyscale": "Db Major"},
    {"id": "cutscene_sorceress_parade", "caption": "dark parade theme, sinister celebration, distorted brass fanfare with ominous choir, assassination plot, JRPG villain reveal, terrifying power on display", "bpm": 88, "duration": 50, "keyscale": "Bb minor"},
    {"id": "cutscene_prison_escape", "caption": "desperate escape theme, frantic and urgent, racing strings with driving percussion, breaking free, JRPG prison break, pulse-pounding action", "bpm": 140, "duration": 40, "keyscale": "F minor"},
    {"id": "cutscene_missile_base", "caption": "countdown to destruction theme, ticking clock tension, electronic pulses with urgent brass, self-destruct sequence, JRPG timed escape, escalating panic", "bpm": 145, "duration": 40, "keyscale": "A minor"},
    {"id": "cutscene_garden_flight", "caption": "flying school theme, awe and wonder, soaring strings lifting upward, moment of miracle, JRPG vehicle transformation, majestic and breathtaking", "bpm": 92, "duration": 45, "keyscale": "E Major"},
    {"id": "cutscene_fh_arrival", "caption": "peaceful arrival theme, relief after crisis, gentle guitar with ocean ambience, crash landing turned safe harbor, JRPG respite moment, warm gratitude", "bpm": 76, "duration": 40, "keyscale": "G Major"},
    {"id": "cutscene_balamb_liberation", "caption": "hometown liberation theme, triumphant and emotional, brass fanfare with snare march, taking back what's yours, JRPG victory march, proud and defiant", "bpm": 112, "duration": 40, "keyscale": "Bb Major"},
    {"id": "cutscene_trabia_truth", "caption": "devastating revelation theme, world-shattering truth, fragile piano breaking into emotional strings, forgotten memories returning, JRPG plot twist, heartbreaking", "bpm": 68, "duration": 55, "keyscale": "F minor"},
    {"id": "cutscene_garden_battle", "caption": "epic aerial clash theme, two armies colliding, massive orchestral battle with full percussion, schools at war, JRPG grand battle, chaos and determination", "bpm": 148, "duration": 50, "keyscale": "D minor"},
    {"id": "cutscene_orphanage", "caption": "childhood memory theme, deeply emotional, music box melody with tender strings and piano, returning to where it began, JRPG emotional revelation, tears and hope", "bpm": 64, "duration": 50, "keyscale": "Eb Major"},
    {"id": "cutscene_esthar_arrival", "caption": "hidden civilization revealed theme, awe-inspiring, electronic synth building to full orchestra, futuristic wonder, JRPG city of the future, overwhelming scale", "bpm": 96, "duration": 45, "keyscale": "B Major"},
    {"id": "cutscene_space_rescue", "caption": "space rescue theme, drifting through stars, ethereal ambient with emotional strings, reaching for someone you love, JRPG zero gravity, beautiful isolation", "bpm": 72, "duration": 55, "keyscale": "G# minor"},
    {"id": "cutscene_deep_sea", "caption": "descent into the abyss theme, deep and crushing, sub-bass drones with distant piano, ancient technology below, JRPG deep ocean, claustrophobic wonder", "bpm": 70, "duration": 45, "keyscale": "Ab minor"},
    {"id": "cutscene_fujin_plea", "caption": "friend's desperate plea theme, raw emotion, solo voice-like melody breaking through silence, begging someone to stop, JRPG betrayal resolved, tearful and quiet", "bpm": 60, "duration": 40, "keyscale": "C minor"},
    {"id": "cutscene_time_compression", "caption": "reality collapsing theme, surreal and terrifying, distorted orchestra with reversed elements, time folding in on itself, JRPG cosmic horror, disorienting chaos", "bpm": 110, "duration": 50, "keyscale": "F# minor"},
    {"id": "cutscene_ending", "caption": "grand ending theme, triumphant and emotional, full orchestra building from quiet piano to massive climax, love conquers all, JRPG happy ending, tears of joy, hopeful resolution", "bpm": 85, "duration": 70, "keyscale": "C Major"},
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
