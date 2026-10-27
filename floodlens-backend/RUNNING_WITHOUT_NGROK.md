# Running FloodLens backend without ngrok (local HTTPS)

**What's verified:** the openssl command below genuinely produces a valid
certificate (checked independently with `openssl x509 -text`). The plain
HTTP version of this backend was fully tested earlier (health check, real
image analysis, error handling all confirmed working).

**What's NOT verified:** running uvicorn with these SSL flags specifically.
I hit a hang trying to test this in my own sandboxed environment, most likely
caused by network restrictions specific to my container, not a problem with
the approach itself (this is a standard, widely-documented way to run
uvicorn with TLS). Test this on your machine and tell me exactly what happens
— if it also hangs or errors for you, paste the output and we'll debug the
real cause instead of me guessing further.

## 1. Generate a self-signed certificate (run inside floodlens-backend/)

```
openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365 -subj "/CN=floodlens-backend"
```

This creates `key.pem` and `cert.pem` in the current folder. No external
service involved — this is entirely local.

## 2. Run uvicorn with those files

```
uvicorn main:app --host 0.0.0.0 --port 8000 --ssl-keyfile key.pem --ssl-certfile cert.pem
```

If this hangs with no output for more than a few seconds, or errors
immediately, stop and paste back exactly what you see — don't assume it's
working silently in the background.

## 3. Find your machine's LAN IP

You already have this from Vite's own output — it printed something like
`Network: https://192.168.192.210:5173/` when you ran `npm run dev`. Use that
same IP address, but port 8000 instead of 5173, for the backend.

## 4. Accept the certificate warning on your phone FIRST

Before using the frontend, open your phone's browser and go directly to:

```
https://192.168.192.210:8000/health
```
(replace with your actual IP)

Your phone will show a "connection is not private" warning — this is
expected for a self-signed cert. Tap **Advanced**, then **Proceed anyway**.
You should see the JSON health response. This step creates a security
exception in your phone's browser for that specific address.

## 5. Now use the frontend

Open your FloodLens frontend page (same as before), and set BACKEND_URL to:

```
https://192.168.192.210:8000
```

Because you already accepted the certificate warning for that exact address
in step 4, the frontend's fetch() calls to it should now succeed instead of
being silently blocked.

## If step 4's warning doesn't "stick" for later fetch calls

Some mobile browsers scope the security exception more strictly than others.
If the frontend's requests still fail with a network error even after
accepting the warning directly, that's a real limitation of self-signed
certs on mobile browsers, and ngrok's approach (a real HTTPS cert, no
warning at all) becomes the more reliable option again. Try this first since
it avoids the extra dependency, but don't fight it for more than a few
minutes if it's not cooperating.
