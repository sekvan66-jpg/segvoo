import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Schriften liegen lokal in public/fonts – kein Internet beim Rendern nötig.
loadFont({ family: "Anton", url: staticFile("fonts/anton.woff2"), weight: "400" });
loadFont({ family: "Inter", url: staticFile("fonts/inter-400.woff2"), weight: "400" });
loadFont({ family: "Inter", url: staticFile("fonts/inter-700.woff2"), weight: "700" });
loadFont({ family: "JetBrains Mono", url: staticFile("fonts/mono-700.woff2"), weight: "700" });
loadFont({ family: "Instrument Serif", url: staticFile("fonts/serif.woff2"), weight: "400", style: "normal" });
loadFont({ family: "Instrument Serif", url: staticFile("fonts/serif-italic.woff2"), weight: "400", style: "italic" });
