# The signature frames

`public/signature-frames.png` holds the "elliott." animation as patches: the original SVG-mask
animation rendered at 60fps and 3× size (1062×450) on a transparent background, and for each
frame only what has to be laid over the frame before to make it. `components/Signature.tsx`
lists where each patch goes and when it switches on. See the comment at the top of that file for
why it's played back this way (it stays smooth even in iPhone Low Power Mode).

`render.html` draws the original animation at any moment you ask for. If the glyphs, strokes or
timing change, change them there, then (needs Google Chrome):

```sh
python3 -m http.server 8710 -d scripts/signature &      # tiles.html reads the frames over http
mkdir -p scripts/signature/fa
# 60fps, starting with 250ms of blank paper (the pause before the pen on first load)
node scripts/signature/frames.mjs "file://$PWD/scripts/signature/render.html" scripts/signature/fa 60 250
node scripts/signature/tiles.mjs http://localhost:8710/tiles.html /tmp/signature-atlas
cp /tmp/signature-atlas.png public/signature-frames.png
rm -r scripts/signature/fa
```

Then copy the size and the patch list from `/tmp/signature-atlas.json` into `ATLAS` and `patches`
in the component (each patch is `[frame, x, y, w, h, ax, ay]`). If the frame count changes, change
`N` in `tiles.html` to match what `frames.mjs` prints.
