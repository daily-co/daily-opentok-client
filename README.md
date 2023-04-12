# daily-opentok-client

## Module

Run:

```bash
npm install daily-opentok-client
```

Replace:

```typescript
import * as OT from "@opentok/client";
```

with:

```typescript
import * as OT from "daily-opentok-client";
```

Or, if you're using a script tag:

Replace:

```html
<script src="https://static.opentok.com/v2/js/opentok.min.js"></script>
```

with:

```html
<script src="https://unpkg.com/daily-opentok-client/dist/opentok.iife.js"></script>
```

When you call OT.initSession, replace your OpenTok session id with your daily room URL.

```typescript
// apiKey can be left blank
const apiKey = "";
const sessionId = "https://example.daily.co/example";
OT.initSession(apiKey, sessionId);
```

## Local Testing

To test with the included sample project run:

```
npm run start
```

To test integrating your current changes with another project using a script tag, run:

```
npm run start:tag
```

And replace:

```html
<script src="https://static.opentok.com/v2/js/opentok.min.js"></script>
```

with:

```html
<script src="https://127.0.0.1:4173/opentok.umd.cjs"></script>
```
