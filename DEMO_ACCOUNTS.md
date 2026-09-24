# Demo accounts

The hackathon demo dataset contains exactly 5 seeded accounts. Each account has 1 profile picture and 3 posts (15 post images total), so the seeded demo set is exactly 20 images.

| Username | Email | Password |
| --- | --- | --- |
| `alex_morgan` | `alex.morgan@instagram.com` | `demo1234` |
| `sarah_chen` | `sarah.chen@instagram.com` | `demo1234` |
| `marcus_vance` | `marcus.vance@instagram.com` | `demo1234` |
| `elena_rostova` | `elena.rostova@instagram.com` | `demo1234` |
| `david_kim` | `david.kim@instagram.com` | `demo1234` |

These credentials are for local/demo use only. Change them before any public deployment.

## Media layout

```text
uploads/
  profiles/
    demo/                       # 5 seeded profile images
  posts/
    demo/                       # 15 seeded post images
    YYYY/MM/                    # runtime user-uploaded images
  videos/
    YYYY/MM/                    # runtime video uploads
  stories/
    <userId>/                   # runtime story uploads
```

Runtime uploads do not overwrite the 20 demo assets. Profile uploads are stored under the authenticated user's ID; post and video uploads use UUID filenames in dated directories.
