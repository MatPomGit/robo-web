# Unitree G1 EDU Controller

Interfejs HMI (Human-Machine Interface) zbudowany w **React + TypeScript + Vite** do monitorowania i sterowania robotem **Unitree G1 EDU** przez **ROS2 bridge (roslib/WebSocket)**.

> ⚠️ Ten projekt ma charakter demonstracyjny/prototypowy. Przed podłączeniem do realnego robota należy wdrożyć warstwę bezpieczeństwa (gateway, watchdog, dead-man switch, E-Stop niezależny od UI).

## Najważniejsze możliwości

- Połączenie z ROS2 bridge (`ws://...`) i podgląd statusu połączenia.
- Dashboard telemetryczny (bateria, stawy, logi, powiadomienia).
- Teleoperacja (klawiatura/przyciski) + szybkie komendy STOP/E-STOP.
- Podgląd wizualny w trzech trybach:
  - **Camera** (RGB/Depth stream),
  - **3D View** (model robota),
  - **Map/SLAM** (wizualizacja punktów lidaru i trajektorii).
- Eksplorator topiców ROS2:
  - discovery topiców,
  - dynamiczne subskrypcje,
  - podgląd payloadu JSON z podświetlaniem składni,
  - kopiowanie danych.
- Sterowanie Rosbag2 (record/play/pause/stop/seek).
- Panele „Task Queue” i „Footstep Planning” (logika demonstracyjna/symulowana).

## Stack technologiczny

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 4
- **Wizualizacja 3D:** three, @react-three/fiber, @react-three/drei
- **Wizualizacja danych:** d3
- **Robotyka/ROS:** roslib
- **Ikony/UI:** lucide-react

## Struktura projektu

```text
.
├── src/
│   ├── main.tsx                  # bootstrap aplikacji
│   ├── App.tsx                   # główny komponent (UI + logika ROS + sterowanie)
│   ├── index.css                 # style globalne + Tailwind
│   └── components/
│       ├── Robot3D.tsx           # widok 3D robota
│       ├── LidarMap.tsx          # widok mapy/lidaru
│       └── Sparkline.tsx         # mini-wykresy telemetryczne
├── docs/
│   └── unitree-g1-connection-analysis.md  # analiza architektury i ryzyk
├── package.json
├── vite.config.ts
└── README.md
```

## Wymagania

- Node.js 20+
- npm 10+
- Działający ROS2 bridge dostępny przez WebSocket (np. `rosbridge_server`)

## Szybki start

```bash
npm install
npm run dev
```

Domyślnie aplikacja startuje na:

- `http://localhost:3000`

## Dostępne skrypty

```bash
npm run dev      # uruchomienie lokalne (Vite)
npm run build    # build produkcyjny
npm run preview  # podgląd buildu
npm run clean    # usuń katalog dist
npm run lint     # sprawdzenie typów TypeScript (tsc --noEmit)
```

## Konfiguracja ROS

Po uruchomieniu aplikacji:

1. W pasku górnym ustaw adres bridge (np. `ws://localhost:9090`).
2. Kliknij **Connect** i potwierdź akcję.
3. Wejdź do zakładki **Topics**, aby wykonać discovery i dodać własne subskrypcje.

### Przykładowe topiki używane przez dashboard

- `/battery_state`
- `/joint_states`
- `/rosout`
- `/utlidar/cloud`
- `/scan`
- `/odom`
- strumienie kamery:
  - `/camera/camera/color/image_raw/compressed`
  - `/camera/camera/depth/image_rect_raw/compressed`

## Bezpieczeństwo i ograniczenia (ważne)

Ten interfejs jest wygodnym HMI, ale nie powinien być traktowany jako jedyna warstwa sterowania robotem.

Przed użyciem na realnym robocie:

- wprowadź **Control Gateway** pomiędzy UI i robotem,
- dodaj watchdog, heartbeat i dead-man switch,
- wymuś ACK/NACK dla krytycznych komend,
- uruchamiaj komunikację po `wss://` z authN/authZ,
- zapewnij niezależny kanał E-Stop.

Szczegółową analizę ryzyk i plan wdrożenia znajdziesz w `docs/unitree-g1-connection-analysis.md`.

## Dla nowych contributorów

- Zacznij od `src/App.tsx` — to główne miejsce, gdzie łączy się UI, ROS i logika sterowania.
- Następnie przejrzyj `src/components/Robot3D.tsx` i `src/components/LidarMap.tsx`, aby zrozumieć warstwę wizualizacji.
- Przy większych zmianach rozważ refaktor do mniejszych modułów (np. manager połączenia ROS, serwisy komend, store stanu).

## Licencja

Projekt jest udostępniony na licencji MIT (`LICENSE`).
