# cek mobile online stellen

Die App läuft als normaler Node-Server (Next.js) mit der in **Node 22**
eingebauten SQLite-Datenbank. Sie braucht also nur eine Umgebung mit Node ≥ 22.5.

## Option A – Render (empfohlen, kostenlos startbar)

1. Account anlegen auf **https://render.com** (kostenlos, mit GitHub anmelden).
2. Oben rechts **New → Blueprint**.
3. Das Repository **`sekvan66-jpg/segvoo`** auswählen (Branch `ccr-efba89e7-vy1zq2`
   bzw. nach dem Merge `main`). Render findet automatisch die Datei
   **`render.yaml`** und schlägt den Service „cek-mobile" vor.
4. **Apply / Deploy** klicken. Der erste Build dauert ca. 2–4 Minuten.
5. Render zeigt danach eine öffentliche URL, z. B. `https://cek-mobile.onrender.com`.
6. Dort die Seite öffnen → **„Beispieldaten laden"**, oder unter *Einstellungen*
   die eigenen Stammdaten eintragen.

> Hinweis: Im **kostenlosen** Plan ist der Speicher flüchtig – nach einem
> Neustart/Deploy sind die Daten wieder leer. Für **dauerhafte Daten**:
> in `render.yaml` `plan: starter` setzen, die `disk:`-Sektion und die
> `SEGVOO_DB`-Variable einkommentieren (speichert die DB unter `/data`).

## Option B – Railway

1. Account auf **https://railway.app** (mit GitHub).
2. **New Project → Deploy from GitHub repo** → Repo wählen.
3. Build-Command `npm install --include=dev && npm run build`,
   Start-Command `npm start`. Node-Version via Variable `NODE_VERSION=22.22.0`.
4. Für dauerhafte Daten ein **Volume** anlegen (Mount z. B. `/data`) und die
   Variable `SEGVOO_DB=/data/cek.sqlite` setzen.

## Option C – Eigener Server / VPS

```bash
git clone https://github.com/sekvan66-jpg/segvoo.git
cd segvoo && git checkout ccr-efba89e7-vy1zq2
npm install
npm run build
SEGVOO_DB=/var/lib/cek/cek.sqlite PORT=3000 npm start
```
(hinter einen Reverse-Proxy wie Nginx/Caddy mit HTTPS setzen)

## Umgebungsvariablen

| Variable      | Bedeutung                                   | Beispiel               |
| ------------- | ------------------------------------------- | ---------------------- |
| `PORT`        | Port des Servers (setzt die Plattform)      | `3000`                 |
| `SEGVOO_DB`   | Pfad der SQLite-Datei (für dauerhafte Daten)| `/data/cek.sqlite`     |
| `NODE_VERSION`| Node-Version der Plattform                  | `22.22.0`              |
