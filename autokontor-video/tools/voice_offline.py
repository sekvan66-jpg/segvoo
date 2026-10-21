"""
Erzeugt die Sprecherstimme aus skript.txt OFFLINE mit Coqui-TTS (VITS, Deutsch):
  --modell thorsten   männlich (Standard)
  --modell css10      weiblich, sehr gut verständlich (BSD-3, Daten gemeinfrei) – mit --klang werbung-w
Alternative zu tools/voice.py (Chatterbox), wenn kein Chatterbox/Whisper verfügbar ist.

- Jeder Satz wird am Stück gesprochen (natürliche Betonung), danach kurze Pause.
- Das Wort-Timing kommt direkt aus dem Sprachmodell – tools/timing.py (Whisper) ist NICHT nötig.
- Schwierige Wörter (PC, GoBD, ZUGFeRD …) stehen in aussprache.txt (thorsten, Lautschrift)
  bzw. aussprache-css10.txt (css10, Ersatzschreibung).
- Ergebnis: public/voice.wav, public/voice-segments.json, public/voice-words.json

Einmalig installieren:   .venv/bin/pip install "coqui-tts[codec]" "gruut[de]"
Aufruf:                  .venv/bin/python tools/voice_offline.py
Kurzfassung:             .venv/bin/python tools/voice_offline.py --fassung tiktok30
                         (liest skript-tiktok30.txt, schreibt nach public/tiktok30/)
Optionen: --tempo 0.88  (Sprechdauer: kleiner = schneller, 1.0 = ruhig)
          --pause 0.16  (Sekunden Pause nach jedem Satz)
          --zeige       (nur Lautschrift jedes Worts anzeigen, nichts erzeugen)
"""
import argparse
import json
import re
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
MODELS = {
    "thorsten": {
        "dir": ROOT / "models" / "thorsten-vits",
        "url": "https://github.com/coqui-ai/TTS/releases/download/v0.7.0_models/tts_models--de--thorsten--vits.zip",
        "ckpt": "model_file.pth",
        "lexikon": "aussprache.txt",
        "klang": "roh",
        "rauschen": (0.667, 0.8),
    },
    "css10": {
        "dir": ROOT / "models" / "css10" / "tts_models--de--css10--vits",
        "url": "https://github.com/coqui-ai/TTS/releases/download/v0.8.0_models/tts_models--de--css10--vits.zip",
        "ckpt": "model_file.pth.tar",
        "lexikon": "aussprache-css10.txt",
        "klang": "werbung-w",
        "rauschen": (0.5, 0.6),  # etwas lebendiger als das ruhige Hörbuch-Original (0.3/0.3)
    },
}
sys.path.insert(0, str(Path(__file__).resolve().parent))
from klang import VOICE_FX, apply as apply_klang  # noqa: E402
PUNCT = ".,!?;:"


def read_script(fassung):
    beats = []
    for raw in (ROOT / (f"skript-{fassung}.txt" if fassung else "skript.txt")).read_text(encoding="utf-8").splitlines():
        raw = raw.strip()
        if not raw or raw.startswith("#"):
            continue
        m = re.match(r"^(\w+)\s*\|\s*(.+)$", raw)
        if not m:
            sys.exit(f'Zeile hat falsches Format (effekt | Text): "{raw}"')
        # gleiche Wort-Aufteilung wie tools/build-timeline.mjs
        beats.append([w for w in m.group(2).strip().split() if w not in ("–", "-")])
    return beats


def read_lexicon(name):
    lex = {}
    path = ROOT / name
    if path.exists():
        for raw in path.read_text(encoding="utf-8").splitlines():
            raw = raw.strip()
            if raw and not raw.startswith("#") and "=" in raw:
                k, v = raw.split("=", 1)
                lex[k.strip().lower()] = v.strip()
    return lex


def ensure_model(m):
    d = m["dir"]
    ckpt, cfg = d / m["ckpt"], d / "config.json"
    if not ckpt.exists():
        d.mkdir(parents=True, exist_ok=True)
        zpath = d / "model.zip"
        print("Lade Stimme herunter (~330 MB, nur beim ersten Mal) …")
        urllib.request.urlretrieve(m["url"], zpath)
        with zipfile.ZipFile(zpath) as z:
            for name in z.namelist():
                if name.endswith((".pth", ".tar", ".json")) and "__MACOSX" not in name:
                    (d / Path(name).name).write_bytes(z.read(name))
        zpath.unlink()
    # Pfade in der Konfiguration auf die lokalen Dateien zeigen lassen
    text = cfg.read_text(encoding="utf-8")
    fixed = re.sub(r'"[^"]*(speaker_ids|language_ids)\.json"', lambda mm: json.dumps(str(d / f"{mm.group(1)}.json")), text)
    if fixed != text:
        cfg.write_text(fixed, encoding="utf-8")
    return ckpt, cfg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tempo", type=float, default=0.88)
    ap.add_argument("--pause", type=float, default=0.16)
    ap.add_argument("--zeige", action="store_true")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--fassung", default="", help="z. B. tiktok30 → skript-tiktok30.txt, public/tiktok30/")
    ap.add_argument("--modell", default="thorsten", choices=list(MODELS))
    ap.add_argument("--klang", default=None, choices=list(VOICE_FX), help="Standard: roh (thorsten) / werbung-w (css10)")
    args = ap.parse_args()
    out_dir = PUBLIC / args.fassung if args.fassung else PUBLIC
    m = MODELS[args.modell]
    klang = args.klang or m["klang"]

    from TTS.tts.configs.vits_config import VitsConfig
    from TTS.tts.utils.text.cleaners import multilingual_cleaners

    ckpt, cfg = ensure_model(m)
    config = VitsConfig()
    config.load_json(str(cfg))
    if config.use_phonemes:
        from TTS.tts.utils.text.phonemizers.gruut_wrapper import Gruut

        g2p = Gruut(language="de-de", keep_puncs=False)
    lex = read_lexicon(m["lexikon"])

    def phonemes(word):
        """Lautschrift eines Skript-Worts (ohne Satzzeichen am Ende) + die Satzzeichen."""
        word = word.replace("*", "").replace("~", "")
        core = word.rstrip(PUNCT)
        punct = word[len(core):]
        spoken = lex.get(core.lower(), core)
        if spoken.startswith("/") and spoken.endswith("/"):
            ph = spoken.strip("/")
        elif not config.use_phonemes:
            ph = multilingual_cleaners(spoken, lang="de")  # Buchstaben-Modell (css10)
        else:
            ph = g2p.phonemize(multilingual_cleaners(spoken, lang="de"), separator="", language="de-de")
        return ph.strip(), punct

    beats = read_script(args.fassung)
    flat = [(bi, w) for bi, words in enumerate(beats) for w in words]

    if args.zeige:
        for _, w in flat:
            ph, punct = phonemes(w)
            print(f"{w:28} /{ph}/{punct}")
        return

    import numpy as np
    import soundfile as sf
    import torch
    from TTS.tts.models.vits import Vits

    model = Vits.init_from_config(config)
    model.load_checkpoint(config, str(ckpt), eval=True)
    model.length_scale = args.tempo
    model.inference_noise_scale, model.inference_noise_scale_dp = m["rauschen"]
    tok = model.tokenizer
    sr = config.audio.sample_rate
    hop = config.audio.hop_length
    torch.manual_seed(args.seed)

    def encode(text):
        ids = []
        for ch in text:
            try:
                ids.append(tok.characters.char_to_id(ch))
            except KeyError:
                pass  # z. B. Unterbogen „̯“ – kennt das Modell nicht
        return ids

    # Sätze bilden: ein Satz endet mit . ! ? am Wortende
    sentences, cur = [], []
    for i, (_, w) in enumerate(flat):
        cur.append(i)
        if w.replace("*", "")[-1] in ".!?" or i == len(flat) - 1:
            sentences.append(cur)
            cur = []

    out, words_out, t = [], [], 0.0
    gap = np.zeros(int(args.pause * sr), dtype=np.float32)
    for si, idxs in enumerate(sentences, 1):
        # Token-Folge aufbauen und merken, welche Tokens zu welchem Wort gehören
        chars, owner = [], []
        for k, i in enumerate(idxs):
            ph, punct = phonemes(flat[i][1])
            ids = encode(ph)
            chars += ids
            owner += [i] * len(ids)
            p_ids = encode(punct + (" " if k < len(idxs) - 1 else ""))
            chars += p_ids
            owner += [None] * len(p_ids)
        ids = tok.intersperse_blank_char(chars) if tok.add_blank else chars
        own = [None] * len(ids)
        if tok.add_blank:
            own[1::2] = owner
        else:
            own = owner
        text = " ".join(flat[i][1] for i in idxs)
        print(f"[{si}/{len(sentences)}] {text}")
        with torch.inference_mode():
            lid = torch.LongTensor([0]) if getattr(config.model_args, "use_language_embedding", False) else None
            sid = torch.LongTensor([0]) if hasattr(model, "emb_g") else None  # css10: ein Sprecher mit Einbettung
            res = model.inference(torch.LongTensor(ids).unsqueeze(0), aux_input={"x_lengths": None, "d_vectors": None, "speaker_ids": sid, "language_ids": lid, "durations": None})
        wav = res["model_outputs"][0, 0].cpu().numpy().astype(np.float32)
        dur = res["durations"][0, 0].cpu().numpy()
        edges = np.concatenate([[0], np.cumsum(dur)]) * hop / sr
        # Ruhe am Satzanfang abschneiden
        first = min(k for k, o in enumerate(own) if o is not None)
        cut = max(0.0, edges[first] - 0.04)
        wav = wav[int(cut * sr):]
        for i in idxs:
            ks = [k for k, o in enumerate(own) if o == i]
            words_out.append({"word": flat[i][1].replace("*", "").replace("~", ""), "start": round(t + edges[ks[0]] - cut, 3), "end": round(t + edges[ks[-1] + 1] - cut, 3)})
        last = max(k for k, o in enumerate(own) if o is not None)
        wav = wav[: int((edges[last + 1] - cut + 0.12) * sr)]
        out += [wav, gap]
        t += len(wav) / sr + args.pause

    full = np.concatenate(out)
    full = full / max(1e-6, np.abs(full).max()) * 0.85
    out_dir.mkdir(parents=True, exist_ok=True)
    raw = ROOT / "out" / "voice-raw.wav"
    raw.parent.mkdir(exist_ok=True)
    sf.write(raw, full, sr)
    apply_klang(raw, out_dir / "voice.wav", klang, 44100 if klang != "roh" else sr)

    segs = []
    for bi, words in enumerate(beats):
        ws = [w for w, (b, _) in zip(words_out, flat) if b == bi]
        segs.append({"text": " ".join(words), "start": ws[0]["start"], "end": ws[-1]["end"]})
    (out_dir / "voice-segments.json").write_text(json.dumps(segs, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "voice-words.json").write_text(json.dumps(words_out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Fertig: {out_dir.relative_to(ROOT)}/voice.wav ({len(full) / sr:.1f} s) + Wort-Timing. Jetzt: npm run timeline")


if __name__ == "__main__":
    main()
