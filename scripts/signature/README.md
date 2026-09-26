# The signature video

`public/signature.mov` is the "elliott." animation from `components/Signature.tsx`, rendered
frame by frame at 60fps and 3× size, with a transparent background (HEVC with alpha). Safari
plays it instead of drawing the animation live; see the comment at the top of the component.

`render.html` draws the original SVG-mask version of the animation at any moment you ask for.
If the glyphs, strokes or timing in the component change, copy them into it, then:

```sh
mkdir -p /tmp/sig-frames
# 60fps, with 250ms of blank lead-in (the delay the home page gives it)
node scripts/signature/frames.mjs "file://$PWD/scripts/signature/render.html" /tmp/sig-frames 60 250
swiftc -O scripts/signature/encode.swift -o /tmp/sig-encode
/tmp/sig-encode /tmp/sig-frames public/signature.mov 60 0
```

`frames.mjs` needs Google Chrome; `encode.swift` needs macOS (it uses AVFoundation). If the
lead-in changes, change `VIDEO_LEAD` in the component to match.
