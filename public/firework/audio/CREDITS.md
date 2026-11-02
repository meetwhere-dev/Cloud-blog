# Firework audio credits

The active audio uses the requested simulator sounds:

- Project: NianBroken / Firework_Simulator
- Demo: https://nianbroken.github.io/Firework_Simulator/
- Repository: https://github.com/NianBroken/Firework_Simulator
- Audio directory: https://github.com/NianBroken/Firework_Simulator/tree/main/audio
- Playback configuration: https://github.com/NianBroken/Firework_Simulator/blob/main/js/fireworks/audio.js
- Copyright © 2022 NianBroken. All rights reserved.
- Upstream license: Apache License 2.0. A complete copy is included in `simulator/LICENSE`.

## Files

All nine MP3 files in `simulator/` are copied without modification or re-encoding:

- `lift1.mp3`, `lift2.mp3`, `lift3.mp3`: launch sounds
- `burst1.mp3`, `burst2.mp3`: large bursts
- `burst-sm-1.mp3`, `burst-sm-2.mp3`: small bursts
- `crackle1.mp3`, `crackle-sm-1.mp3`: crackling tails

The local sound player uses the upstream volume and playback-rate ranges, and adds stereo positioning, bounded concurrent playback, load failure handling, and stop/mute controls. With sparkle enabled, crackle tails are included with a 35% probability and their type is randomized. No upstream simulation or UI code was copied. Burst samples are randomized within each size group, avoiding consecutive reuse.

Retrieved on 2026-11-02. No separate NOTICE file or audio-specific license file was present in the inspected upstream root and audio directories.
