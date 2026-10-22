"""Klangketten für die Sprecherstimme (ffmpeg). Länge bleibt gleich → Wort-Timing bleibt exakt."""
import subprocess

VOICE_FX = {
    # unbearbeitet
    "roh": "anull",
    # Standard: so wenig wie möglich – kein Tonhöhen-Trick, kein kurzer Hall, keine Verzerrung (die klingen
    # metallisch/roboterhaft; DNSMOS-Gesamtnote 3,07 statt 2,90 „werbung“ / 2,76 „trailer“)
    "natuerlich": "highpass=f=70,equalizer=f=140:t=q:w=0.9:g=2,equalizer=f=350:t=q:w=1:g=-1.5,"
    "equalizer=f=4000:t=q:w=1.2:g=1.5,deesser=i=0.3,"
    "acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=4:knee=6,alimiter=limit=0.89",
    "natuerlich-w": "highpass=f=85,equalizer=f=220:t=q:w=0.9:g=1,equalizer=f=400:t=q:w=1:g=-1.5,"
    "equalizer=f=4500:t=q:w=1.2:g=1.5,deesser=i=0.35,"
    "acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=4:knee=6,alimiter=limit=0.89",
    # tiefer (−1 Halbton, hohe Qualität, Klangfarbe erhalten), sonst wie „natuerlich“
    "tief": "rubberband=pitch=0.944:formant=preserved:pitchq=quality:window=long,highpass=f=60,"
    "equalizer=f=110:t=q:w=0.8:g=3,equalizer=f=320:t=q:w=1:g=-2,equalizer=f=3500:t=q:w=1.2:g=2,deesser=i=0.3,"
    "acompressor=threshold=-22dB:ratio=3:attack=6:release=100:makeup=5:knee=6,alimiter=limit=0.89",
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
    # Trailer-Stimme (männlich, tief und rau – kein Abbild einer bestimmten Person): −1,8 Halbtöne mit erhaltener
    # Klangfarbe, viel Tiefe, sanfte Sättigung für Rauheit, starker Kompressor, etwas Raum
    "trailer": "rubberband=pitch=0.9:formant=preserved:transients=crisp,highpass=f=55,"
    "equalizer=f=100:t=q:w=0.8:g=4.5,equalizer=f=300:t=q:w=1:g=-3,equalizer=f=3200:t=q:w=1:g=4,"
    "equalizer=f=10000:t=q:w=0.8:g=2,asoftclip=type=tanh:threshold=0.85:output=1,deesser=i=0.4,"
    "acompressor=threshold=-25dB:ratio=4.5:attack=3:release=60:makeup=7:knee=3,"
    "aecho=0.92:0.88:24|41:0.08|0.05,alimiter=limit=0.89",
    # Werbesprecherin (weiblich): klar und nah – etwas Körper, weniger Mulm, Präsenz, Luft,
    # De-Esser, Kompressor, ganz kleiner Raum
    "werbung-w": "highpass=f=90,equalizer=f=210:t=q:w=0.9:g=1.5,equalizer=f=380:t=q:w=1:g=-2.5,"
    "equalizer=f=3800:t=q:w=1.1:g=3,equalizer=f=11500:t=q:w=0.8:g=3.5,deesser=i=0.5,"
    "acompressor=threshold=-23dB:ratio=3.5:attack=3:release=70:makeup=6:knee=4,"
    "aecho=0.94:0.9:17|29:0.06|0.04,alimiter=limit=0.89",
}


def apply(raw, out, klang, sample_rate=44100):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", VOICE_FX[klang], "-ar", str(sample_rate), str(out)], check=True)
