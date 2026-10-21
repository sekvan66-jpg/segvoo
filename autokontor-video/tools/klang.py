"""Klangketten für die Sprecherstimme (ffmpeg). Länge bleibt gleich → Wort-Timing bleibt exakt."""
import subprocess

VOICE_FX = {
    # unbearbeitet
    "roh": "anull",
    # neutral: Brummen weg, etwas Wärme, Präsenz, Kompressor
    "studio": "highpass=f=75,equalizer=f=170:t=q:w=1:g=2,equalizer=f=3200:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
    "acompressor=threshold=-20dB:ratio=3:attack=4:release=90:makeup=5,alimiter=limit=0.89",
    # Werbesprecher (männlich): tiefer (−1,5 Halbtöne, Klangfarbe erhalten), Nahbesprechungs-Bass, weniger Mulm,
    # Präsenz + Glanz, De-Esser, kräftiger Kompressor, ganz kleiner Raum
    "werbung": "rubberband=pitch=0.917:formant=preserved:transients=crisp,highpass=f=65,"
    "equalizer=f=115:t=q:w=0.8:g=4,equalizer=f=320:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.1:g=3.5,"
    "equalizer=f=11000:t=q:w=0.8:g=2.5,deesser=i=0.4,"
    "acompressor=threshold=-24dB:ratio=4:attack=3:release=70:makeup=7:knee=4,"
    "aecho=0.92:0.9:19|31:0.07|0.05,alimiter=limit=0.89",
    # Werbesprecherin (weiblich): klar und nah – etwas Körper, weniger Mulm, Präsenz, Luft,
    # De-Esser, Kompressor, ganz kleiner Raum
    "werbung-w": "highpass=f=90,equalizer=f=210:t=q:w=0.9:g=1.5,equalizer=f=380:t=q:w=1:g=-2.5,"
    "equalizer=f=3800:t=q:w=1.1:g=3,equalizer=f=11500:t=q:w=0.8:g=3.5,deesser=i=0.5,"
    "acompressor=threshold=-23dB:ratio=3.5:attack=3:release=70:makeup=6:knee=4,"
    "aecho=0.94:0.9:17|29:0.06|0.04,alimiter=limit=0.89",
}


def apply(raw, out, klang, sample_rate=44100):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", VOICE_FX[klang], "-ar", str(sample_rate), str(out)], check=True)
