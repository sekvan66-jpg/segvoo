"""
Erzeugt eine realistischere Sprecherstimme mit Piper (deutsche Stimme „Thorsten high“, CC0 – auch für Werbung erlaubt).
Läuft offline, liefert das exakte Wort-Timing direkt aus dem Modell (kein Whisper nötig)
und bearbeitet die Stimme wie ein Sprecher-Studio nach (Wärme, Präsenz, Kompressor).

Einmalig installieren:   pip install piper-tts onnx
Stimmen (lädt das Skript selbst nach models/piper/):
  thorsten-high       – klar und natürlich (Standard)
  thorsten-emotional  – mit Gefühl: --gefuehl amused | surprised | neutral | …
Aufruf:
  python tools/voice_piper.py --fassung premium30          (liest skript-premium30.txt → public/premium30/)
  python tools/voice_piper.py                               (skript.txt → public/)
Optionen: --tempo 0.95   (kleiner = schneller)    --pause 0.3 (Sekunden nach jedem Satz)
          --klang werbung (Werbesprecher: tiefer, voller, Kompressor) | studio (neutral)
          --zeige        (nur Lautschrift jedes Worts anzeigen)
Aussprache schwieriger Wörter: aussprache-piper.txt
"""
import argparse
import json
import re
import sys
import tarfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
MODELS = ROOT / "models" / "piper"
VOICES = {
    "thorsten-high": "vits-piper-de_DE-thorsten-high/de_DE-thorsten-high.onnx",
    "thorsten-emotional": "vits-piper-de_DE-thorsten_emotional-medium/de_DE-thorsten_emotional-medium.onnx",
}
URL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/{}.tar.bz2"
PUNCT = ".,!?;:"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from klang import VOICE_FX, apply as apply_klang  # noqa: E402


def read_script(fassung):
    beats = []
    path = ROOT / (f"skript-{fassung}.txt" if fassung else "skript.txt")
    for raw in path.read_text(encoding="utf-8").splitlines():
        raw = raw.strip()
        if not raw or raw.startswith("#"):
            continue
        m = re.match(r"^(\w+)\s*\|\s*(.+)$", raw)
        if not m:
            sys.exit(f'Zeile hat falsches Format (effekt | Text): "{raw}"')
        beats.append([w for w in m.group(2).strip().split() if w not in ("–", "-")])
    return beats


def read_lexicon():
    lex = {}
    path = ROOT / "aussprache-piper.txt"
    if path.exists():
        for raw in path.read_text(encoding="utf-8").splitlines():
            raw = raw.strip()
            if raw and not raw.startswith("#") and "=" in raw:
                k, v = raw.split("=", 1)
                lex[k.strip().lower()] = v.strip()
    return lex


def ensure_voice(name):
    onnx = MODELS / VOICES[name]
    if not onnx.exists():
        MODELS.mkdir(parents=True, exist_ok=True)
        pkg = VOICES[name].split("/")[0]
        print(f"Lade Stimme {name} herunter (~100 MB, nur beim ersten Mal) …")
        tmp = MODELS / f"{pkg}.tar.bz2"
        urllib.request.urlretrieve(URL.format(pkg), tmp)
        with tarfile.open(tmp) as t:
            t.extractall(MODELS)
        tmp.unlink()
    return onnx


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fassung", default="")
    ap.add_argument("--stimme", default="thorsten-high", choices=list(VOICES))
    ap.add_argument("--gefuehl", default="neutral", help="nur thorsten-emotional: amused, surprised, neutral, …")
    ap.add_argument("--tempo", type=float, default=0.95)
    ap.add_argument("--pause", type=float, default=0.3, help="Pause nach jedem Satz (nach Fragen 1,5×)")
    ap.add_argument("--klang", default="werbung", choices=list(VOICE_FX))
    ap.add_argument("--zeige", action="store_true")
    args = ap.parse_args()

    import numpy as np
    import soundfile as sf
    from piper import PiperVoice, SynthesisConfig

    voice = PiperVoice.load(str(ensure_voice(args.stimme)), include_alignments=True)
    idmap = voice.config.phoneme_id_map
    lex = read_lexicon()

    def spoken(word):
        """Gesprochene Form eines Skript-Worts (Aussprache-Liste) + Satzzeichen am Ende."""
        word = word.replace("*", "").replace("~", "")
        core = word.rstrip(PUNCT)
        return lex.get(core.lower(), core), word[len(core):]

    def phonemes(word):
        """Laute eines einzelnen Worts (ohne Satzzeichen) + die Satzzeichen."""
        sp, punct = spoken(word)
        if sp.startswith("[[") and sp.endswith("]]"):
            ph = list(sp[2:-2].strip())
        else:
            ph = [p for sent in voice.phonemize(sp) for p in sent]
        return [p for p in ph if p in idmap], [c for c in punct if c in idmap]

    def sentence_phonemes(words):
        """Laute pro Wort, aber im ganzen Satz umgewandelt (natürliche Betonung).
        Fällt auf Einzelwörter zurück, wenn die Zuordnung nicht eindeutig ist."""
        forms = [spoken(w) for w in words]
        if not any(f[0].startswith("[[") for f in forms):
            text = " ".join(sp + punct for sp, punct in forms)
            ph = [p for sent in voice.phonemize(text) for p in sent]
            groups, cur = [], []
            for p in ph:
                if p == " ":
                    groups.append(cur)
                    cur = []
                else:
                    cur.append(p)
            groups.append(cur)
            groups = [g for g in groups if g]
            # wie viele Laut-Wörter erzeugt eSpeak für jedes Skript-Wort? (z. B. „XRechnung“ → 2)
            need = [max(1, sum(1 for sent in voice.phonemize(sp) for g in "".join(sent).split(" ") if g)) for sp, _ in forms]
            if sum(need) == len(groups):
                res, k = [], 0
                for n_ in need:
                    g = [p for grp in groups[k : k + n_] for p in grp + [" "]][:-1]
                    k += n_
                    res.append(([p for p in g if p in idmap and p not in PUNCT], [p for p in g if p in PUNCT and p in idmap]))
                return res
        return [phonemes(w) for w in words]

    beats = read_script(args.fassung)
    flat = [(bi, w) for bi, words in enumerate(beats) for w in words]
    if args.zeige:
        words = [w for _, w in flat]
        start = 0
        for i, w in enumerate(words):
            if w.replace("*", "")[-1] in ".!?" or i == len(words) - 1:
                for ww, (ph, punct) in zip(words[start : i + 1], sentence_phonemes(words[start : i + 1])):
                    print(f"{ww:28} {''.join(ph)}{''.join(punct)}")
                start = i + 1
        return

    speaker = None
    if voice.config.num_speakers > 1:
        speaker = (voice.config.speaker_id_map or {}).get(args.gefuehl, 0)
    syn = SynthesisConfig(speaker_id=speaker, length_scale=args.tempo, noise_scale=0.7, noise_w_scale=0.85, normalize_audio=False)
    sr = voice.config.sample_rate
    pad, bos, eos = idmap["_"][0], idmap["^"][0], idmap["$"][0]

    sentences, cur = [], []
    for i, (_, w) in enumerate(flat):
        cur.append(i)
        if w.replace("*", "")[-1] in ".!?" or i == len(flat) - 1:
            sentences.append(cur)
            cur = []

    out, words_out, t = [], [], 0.0
    for si, idxs in enumerate(sentences, 1):
        ids, own = [bos, pad], [None, None]
        per_word = sentence_phonemes([flat[i][1] for i in idxs])
        for k, i in enumerate(idxs):
            ph, punct = per_word[k]
            for p in ph:
                ids += [idmap[p][0], pad]
                own += [i, i]
            tail = punct + ([" "] if k < len(idxs) - 1 else [])
            for p in tail:
                ids += [idmap[p][0], pad]
                own += [None, None]
        ids.append(eos)
        own.append(None)
        print(f"[{si}/{len(sentences)}] " + " ".join(flat[i][1] for i in idxs))
        audio, samples = voice.phoneme_ids_to_audio(ids, syn, include_alignments=True)
        if samples is None:
            sys.exit("Diese Stimme liefert kein Timing (onnx-Paket fehlt?): pip install onnx")
        audio = np.asarray(audio, dtype=np.float32)
        edges = np.concatenate([[0], np.cumsum(samples)]) / sr
        first = min(k for k, o in enumerate(own) if o is not None)
        last = max(k for k, o in enumerate(own) if o is not None)
        cut = max(0.0, edges[first] - 0.04)
        for i in idxs:
            ks = [k for k, o in enumerate(own) if o == i]
            words_out.append({"word": flat[i][1].replace("*", "").replace("~", ""), "start": round(t + edges[ks[0]] - cut, 3), "end": round(t + edges[ks[-1] + 1] - cut, 3)})
        seg = audio[int(cut * sr) : int((edges[last + 1] + 0.12) * sr)]
        # dramatische Pausen: nach Fragen länger
        pause = args.pause * (1.5 if flat[idxs[-1]][1].replace("*", "").endswith("?") else 1.0)
        out += [seg, np.zeros(int(pause * sr), dtype=np.float32)]
        t += len(seg) / sr + pause

    full = np.concatenate(out)
    full = full / max(1e-6, np.abs(full).max()) * 0.8
    out_dir = PUBLIC / args.fassung if args.fassung else PUBLIC
    out_dir.mkdir(parents=True, exist_ok=True)
    raw = ROOT / "out" / "voice-raw.wav"
    raw.parent.mkdir(exist_ok=True)
    sf.write(raw, full, sr)
    # Studio-Bearbeitung, gleiche Länge (Timing bleibt exakt)
    apply_klang(raw, out_dir / "voice.wav", args.klang)

    segs = []
    for bi, words in enumerate(beats):
        ws = [w for w, (b, _) in zip(words_out, flat) if b == bi]
        segs.append({"text": " ".join(words), "start": ws[0]["start"], "end": ws[-1]["end"]})
    (out_dir / "voice-segments.json").write_text(json.dumps(segs, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "voice-words.json").write_text(json.dumps(words_out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Fertig: {out_dir.relative_to(ROOT)}/voice.wav ({len(full) / sr:.1f} s, Stimme {args.stimme}) + Wort-Timing.")


if __name__ == "__main__":
    main()
