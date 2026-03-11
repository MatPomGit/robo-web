# Code review – proponowane zadania

## 1) Literówka / nazewnictwo
**Zadanie:** Ujednolicić zapis nazwy lidaru w UI z `Unilidar` na poprawną formę `UniLidar` (lub oficjalną nazwę producenta) we wszystkich miejscach interfejsu.

**Dlaczego:** Obecnie nagłówek sekcji używa zapisu `Unitree Lidar (Unilidar)`, co wygląda na literówkę/niespójność nazewnictwa.

## 2) Usunięcie błędu
**Zadanie:** Dodać jawne odsubskrybowanie tematów ROS utworzonych po połączeniu (`/battery_state`, `/joint_states`, `/rosout`, `/utlidar/cloud`, `/scan`, `/odom`) podczas rozłączania i przed ponownym połączeniem.

**Dlaczego:** Subskrypcje zakładane w `connectROS` nie są odsubskrybowywane; po reconnectach mogą kumulować callbacki i duplikować logikę/zdarzenia.

## 3) Korekta komentarza / dokumentacji
**Zadanie:** Zsynchronizować dokumentację topiców kamery z rzeczywistą implementacją: UI opisuje topici RAW (`/image_raw`, `/depth/image_rect_raw`), a kod subskrybuje warianty `.../compressed`.

**Dlaczego:** To rozbieżność dokumentacyjna, która może wprowadzać w błąd przy diagnozie streamu wideo.

## 4) Ulepszenie testu
**Zadanie:** Dodać test(y) jednostkowe dla budowania komendy rosbag (`toggleRosbag`) po wydzieleniu logiki do czystej funkcji (np. `buildRosbagCommand`).

**Zakres testów (minimum):**
- `record` bez nazwy i z timestampem,
- `record` z nazwą i `duration`,
- `play` z nazwą,
- `stop`/`pause`.

**Dlaczego:** Ta logika ma wiele gałęzi i formatowanie stringów; testy szybko wykryją regresje bez potrzeby uruchamiania ROS.
