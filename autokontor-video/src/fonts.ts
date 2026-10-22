import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Schriften liegen lokal in public/fonts – kein Internet beim Rendern nötig.
loadFont({ family: "Anton", url: staticFile("fonts/anton.woff2"), weight: "400" });
loadFont({ family: "Inter", url: staticFile("fonts/inter-400.woff2"), weight: "400" });
loadFont({ family: "Inter", url: staticFile("fonts/inter-700.woff2"), weight: "700" });
loadFont({ family: "JetBrains Mono", url: staticFile("fonts/mono-700.woff2"), weight: "700" });
loadFont({ family: "Instrument Serif", url: staticFile("fonts/serif.woff2"), weight: "400", style: "normal" });
loadFont({ family: "Instrument Serif", url: staticFile("fonts/serif-italic.woff2"), weight: "400", style: "italic" });
// Nacht-Stil: Sora (Überschriften), Saira Condensed (Cockpit-Zahlen, Labels) – beide OFL
for (const w of ["400", "600", "800"]) loadFont({ family: "Sora", url: staticFile(`fonts/sora-${w}.woff2`), weight: w });
for (const w of ["500", "700", "800"]) loadFont({ family: "Saira Condensed", url: staticFile(`fonts/saira-${w}.woff2`), weight: w });
// Sport-Stil: Barlow Condensed (schräg, extra fett) – OFL, aus @fontsource/barlow-condensed
for (const w of ["600", "800", "900"]) loadFont({ family: "Barlow Condensed", url: staticFile(`fonts/barlow-${w}-italic.woff2`), weight: w, style: "italic" });
loadFont({ family: "Barlow Condensed", url: staticFile("fonts/barlow-700-normal.woff2"), weight: "700", style: "normal" });
