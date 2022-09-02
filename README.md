# @daily-co/opentok

## Module

Run:

```bash
npm install @daily-co/opentok
```

Replace:

```typescript
import * as OT from "@opentok/client";
```

with:

```typescript
import * as OT from "@daily-co/opentok";
```

Or if you're using a script tag:

Replace:

```html
<script src="https://static.opentok.com/v2/js/opentok.min.js"></script>
```

with:

```html
<script src="https://unpkg.com/@daily-co/opentok"></script>
```

When you call OT.initSession, replace your OpenTok session id with your daily room URL.

```typescript
// apiKey can be left blank
const apiKey = "";
const sessionId = "https://example.daily.co/example";
OT.initSession(apiKey, sessionId);
```
