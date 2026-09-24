# Media storage

The demo seed is intentionally isolated from runtime uploads.

- `profiles/demo/` contains 5 demo profile images.
- `posts/demo/` contains 15 demo post images.
- `posts/YYYY/MM/` stores new image uploads.
- `videos/YYYY/MM/` stores new video uploads.
- `stories/<userId>/` stores new story uploads.

This separation keeps the 20 demo images stable while allowing the application to append new user media safely.
