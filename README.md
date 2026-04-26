# Note Canvas

A website DAW for composing and playing back music. Supports drum sequencing and melodic instruments with a piano roll editor, all running directly in your browser with no installs required.

## Features

- **Tracks view**: arrange multiple tracks on a timeline
- **Channel Rack**: drum sequencer with per channel volume, pan, and mute controls
- **Piano Roll**: draw and edit melodic notes on a piano grid with velocity editing
- **Playback**: realtime audio using the Web Audio API at a configurable BPM
- **Themes**: Catppuccin color theme support (Latte, Frappé, Macchiato, Mocha)

## How to Use

1. **Select a track** by clicking it in the Tracks view, this sets which track the Channel Rack and Piano Roll are editing
2. **Drum tracks**: toggle steps in the Channel Rack to build a beat; adjust per channel knobs for volume and pan
3. **Instrument tracks**: click in the Piano Roll grid to place notes; drag to resize, drag existing notes to move, right click to delete
4. **Velocity**: drag the handles at the bottom of the Piano Roll up/down to adjust note velocity
5. **Pattern length**: use the `2 / 4 / 8 / 16` buttons in the Channel Rack or Piano Roll header to set how many bars the pattern spans
6. **Loop**: toggle the `LOOP` button to control whether a track's pattern loops during playback
7. **BPM**: adjust the tempo in the toolbar
8. **Play/Stop**: hit the play button to start playback; all tracks play simultaneously

## Known Issues

- Piano roll playhead does not stay in sync with the track view playhead when the piano roll pattern length differs from the drum pattern length
