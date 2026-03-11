# Code review – proponowane zadania

## 1) Literówka / nazewnictwo
**Zadanie:** Poprawić zapis `Unilidar` na spójną i poprawną formę (`UniLidar` albo oficjalna nazwa producenta) w interfejsie.

**Dlaczego:** W sekcji mapy widnieje `Unitree Lidar (Unilidar)`, co wygląda na literówkę i obniża czytelność UI.

## 2) Usunięcie błędu
**Zadanie:** Poprawić wyznaczanie yaw z kwaternionu odometrii (zastąpić uproszczenie `2 * atan2(z, w)` pełnym przeliczeniem Euler yaw).

**Dlaczego:** Obecne obliczenie yaw działa poprawnie tylko przy zerowym roll/pitch. Przy rzeczywistych przechyłach robota może generować błędny heading, co wpływa na trajektorię i orientację na mapie.

## 3) Korekta komentarza / dokumentacji
**Zadanie:** Ujednolicić opisy topiców kamery w panelu „Quick Start Instructions” z rzeczywistą subskrypcją (`.../compressed`).

**Dlaczego:** Instrukcja w UI pokazuje topiki RAW (`/image_raw`, `/depth/image_rect_raw`), a kod subskrybuje wiadomości `sensor_msgs/CompressedImage` na topicach `.../compressed`, co jest mylące podczas diagnostyki.

## 4) Ulepszenie testu
**Zadanie:** Wydzielić budowanie komendy rosbag do czystej funkcji (np. `buildRosbagCommand`) i dodać do niej testy jednostkowe.

**Zakres testów (minimum):**
- `record` bez nazwy i z timestampem,
- `record` z nazwą i `duration`,
- `play` z nazwą,
- `stop`/`pause`.

**Dlaczego:** Logika `toggleRosbag` ma kilka gałęzi i składanie stringa komendy; testy jednostkowe szybko wychwycą regresje bez uruchamiania ROS.
