# Desktop profile

`npm run preflight -- --profile desktop` checks a separate contract from the
supported server profile. It requires `xdpyinfo`, `ffmpeg`, `ffprobe`, either
`google-chrome` or `chromium`, and the shared libraries named in
`runtime/contract.json`. A missing browser is reported separately from a missing
display or a missing recording library.

The acceptance test starts an isolated Xvfb display and a normal Chrome window
on it. Chrome is not started with `--headless`. The daemon is then started with
`--computer-use-enabled` and `--record-screen-enabled`. The test serves one
local page, asks the daemon to click and type, and checks that the page observed
those events. It also saves a recording and checks the file with `ffprobe`.

A failure before the daemon can see a display or a browser is a prerequisite
failure. A failure while clicking, typing, or recording, after those tools are
present, is a computer-use failure.
