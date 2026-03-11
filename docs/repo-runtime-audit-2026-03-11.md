# Audyt repozytorium: działanie funkcji i gotowość do połączenia z robotem/sensorami

Data audytu: 2026-03-11

## Zakres

Przeprowadzono:
- przegląd kodu całego repo (`src`, `docs`, konfiguracja build),
- walidację statyczną TypeScript,
- build produkcyjny,
- smoke test UI w przeglądarce.

## Wyniki uruchomień

1. `npm run lint` — **PASS** (TypeScript bez błędów).
2. `npm run build` — **PASS** (aplikacja buduje się poprawnie).
3. Smoke test w przeglądarce (`http://localhost:3000`) — **PASS** dla ładowania UI.

## Ocena funkcji (aktualny stan)

### 1) Funkcje UI / dashboard

- Widoki dashboard/topics/instrukcja działają i renderują się poprawnie.
- Komponenty wizualne (`Robot3D`, `LidarMap`, `Sparkline`) są uruchamialne i zgodne typami.

**Status:** działa lokalnie (frontend).

### 2) Połączenie z ROS2

- Aplikacja używa `ROSLIB.Ros` przez URL konfigurowany z UI (domyślnie `ws://localhost:9090`).
- Obsługiwane są eventy: `connection`, `error`, `close`.
- Przy rozłączeniu wykonywany jest cleanup subskrypcji (`unsubscribe`) dla core topiców.

**Status:** logika połączenia istnieje i działa po stronie klienta, ale w środowisku audytu nie było działającego ROS bridge/robota, więc **nie potwierdzono połączenia z realnym robotem**.

### 3) Sensory / telemetria

Subskrybowane topici:
- `/battery_state` (`sensor_msgs/BatteryState`),
- `/joint_states` (`sensor_msgs/JointState`),
- `/utlidar/cloud` (`sensor_msgs/PointCloud2`),
- `/scan` (`sensor_msgs/LaserScan`),
- `/odom` (`nav_msgs/Odometry`),
- kamera (`/camera/rgb/image_raw/compressed` i `/camera/depth/image_rect_raw/compressed`) w zależności od trybu.

Wnioski:
- LaserScan jest faktycznie mapowany do punktów 3D w UI.
- PointCloud2 jest tylko sygnalizowany logiem (bez dekodowania bufora `data`).
- Odometria używa uproszczonego yaw z kwaternionu.

**Status:** integracja sensorów jest częściowa; gotowa do demo, ale nie jest pełna walidacja produkcyjna dla robota fizycznego.

### 4) Sterowanie robotem

- Publikowane komendy ruchu: `/cmd_vel` (`geometry_msgs/Twist`) z UI/klawiatury.
- Tryb robota publikowany przez `/robot_mode` (`std_msgs/String`).
- Komendy ramienia i tasków są uproszczone (demo-level), bez potwierdzeń stanu.

**Status:** funkcjonalne na poziomie HMI/demo; brak warstwy safety gateway i brak dowodu wykonania na rzeczywistym kontrolerze.

## Kluczowe ograniczenia blokujące stwierdzenie „wszystko działa z robotem”

1. Brak dostępu do realnego robota Unitree G1 EDU w środowisku audytu.
2. Brak aktywnego ROS bridge + live topiców podczas testu.
3. Brak testów HIL/SIL oraz scenariuszy sieciowych (drop, reconnect, latency).
4. Część funkcji jest jawnie symulowana (np. capture obrazu, część tasków).

## Werdykt

- **Frontend i logika kliencka działają poprawnie** (lint/build/smoke pass).
- **Nie da się potwierdzić, że „wszystkie funkcje łączą się i działają z robotem/sensorami”** bez środowiska ROS2 z faktycznymi topicami lub bez testu na fizycznym robocie.
- Repo jest gotowe do dalszej walidacji integracyjnej, ale obecnie to poziom: **demo + częściowa integracja ROS**.

## Zalecane kolejne kroki testowe (na infrastrukturze robotycznej)

1. Uruchomić ROS bridge i zweryfikować obecność wymaganych topiców przez startup diagnostics.
2. Dodać checklistę HIL:
   - connect/reconnect,
   - opóźnienia 250/500 ms,
   - packet loss,
   - watchdog stop.
3. Potwierdzić mapping topiców i typów względem firmware/SDK danego G1.
4. Dodać ACK/NACK i timeout dla krytycznych komend sterujących.
