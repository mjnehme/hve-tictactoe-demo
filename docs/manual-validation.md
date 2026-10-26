---
title: Tic-Tac-Toe Manual Validation
description: Real-player and human accessibility validation protocol
author: Repository maintainers
ms.date: 2026-10-23
ms.topic: how-to
keywords:
  - accessibility
  - readability
  - manual validation
---

## Evidence rules

Use real people and actual devices. Do not simulate participants, infer a pass from automation, or rewrite a failed observation as success.

Record:

* Candidate release and URL
* Date, phone, operating system, browser, and relevant accessibility settings
* Participant relationship and approximate familiarity with touch devices
* Observed behavior before interpretation
* Assistance given, including the exact point where it was needed
* Pass, fail, or inconclusive result for each task

Do not record unnecessary personal information.

## Player pilot

Recruit three to five players, including at least two older relatives. Ask each person to use their own phone.

| Task | Pass signal | Record |
|------|-------------|--------|
| Open the shared link and start | First tap in roughly 10 seconds or less without help | Time, help, and comments |
| Play a complete game with a partner | The players know whose turn it is | Confusion, cue used, and recovery |
| Tap intended squares | No repeated accidental tap or unwanted zoom | Missed taps and zoom behavior |
| Ignore or edit names | Naming never blocks play; edited identity remains clear | Whether rename was found or ignored |
| Play again | The control is found without help | Time and comments |
| Review the score | Win or draw tally is understood | Interpretation and confusion |
| Reload the page | The player understands that names and score reset | Expectation and reaction |
| Reopen without a network | A previously prepared game opens and remains playable | Preparation state and outcome |

Ask neutral follow-up questions:

* What, if anything, made it hard to know whose turn it was?
* Where would you expect to play this game?
* What did you expect **Play again** and reload to keep?
* Was anything difficult to read, reach, or tap?

Do not prompt for a computer opponent, online play, or installation. Record unsolicited requests without adding them to the current release.

## Human accessibility review

Use at least one human reviewer familiar with the tested assistive technology.

### Keyboard and focus

* [ ] Every square, name input, and **Play again** control is keyboard reachable
* [ ] Focus moves to an available square after a move
* [ ] Focus moves to **Play again** after a result
* [ ] Replay returns focus to the first available square
* [ ] Editing a name does not cause focus to move elsewhere
* [ ] Focus remains visible in normal and forced-colors modes

### Screen reader

* [ ] The board has a useful name
* [ ] Each square announces its row, column, and state
* [ ] Turn changes are announced as complete messages
* [ ] Win and draw results are announced once and remain visible
* [ ] Custom names retain X or O identity
* [ ] The offline status and waiting-update message are understandable

### Palette and readability

* [ ] Normal-color pages use the pale-blue `#e6f4ff` background, white cells, and yellow winning cells; browser chrome remains dark
* [ ] Turn, X/O wins, draw, replay, scores, twelve-character names, and all offline messages remain readable
* [ ] Text and marks, including actual input text and placeholders, meet 4.5:1 contrast on their rendered backgrounds
* [ ] Identifying borders and keyboard focus meet 3:1 contrast against applicable adjacent surfaces; inspect cells, both inputs, and replay
* [ ] White cells remain distinguishable by their dark borders; do not require 3:1 between decorative cell and page fills
* [ ] Forced colors use system colors with visible focus, board, and winning-state cues instead of requiring pale blue

Record browser-owned input and placeholder colors rather than assuming source
palette tests cover native controls. Automated browser evidence does not check
these human-review boxes.

### Zoom, reflow, and touch

* [ ] Content remains usable at 200% and 400% zoom
* [ ] A 320 CSS px portrait viewport has no horizontal page scrolling
* [ ] Landscape orientation remains usable
* [ ] Twelve-character wide names wrap without clipping controls or status
* [ ] Pinch zoom remains available
* [ ] Squares remain at least 64 by 64 CSS px

## Routing failures

* Route a turn-cue, Board First, or score-model failure back to Design Thinking.
* Route a code, focus, reflow, offline, or update defect back to implementation.
* Keep an unavailable participant or reviewer as an open release gate.
* Never lower a criterion solely to classify the candidate as passing.
