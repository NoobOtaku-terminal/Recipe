# CORS Configuration Guide for Recipe Battle Platform

## Understanding CORS in Your Docker Setup

### Your Architecture

```
Internet → Your Domain (yourdomain.com or Azure IP)
                    ↓
            Nginx Container (Port 80/443)
                    ↓
        ┌───────────┴───────────┐
        │                       │
    Frontend:80            Backend:3000
        │                       │
        └───────────────────────┘
              Docker Network
           (recipe_network)
```

## Key Concept: CORS is Browser Security, NOT Docker Security

### What User Sees:

- **URL in browser:** `https://yourdomain.com`
- **API requests go to:** `https://yourdomain.com/api` (nginx proxies to backend)
- **Origin header:** `https://yourdomain.com`

### Inside Docker:

- Frontend container: `http://frontend:80`
- Backend container: `http://backend:3000`
- **But browsers never see these!** Nginx handles everything.

## CORS Configuration Options

### 1. Single Domain (Recommended for Production)

```env
# Your users access app at this domain
CORS_ORIGIN=https://yourdomain.com
```

**When to use:**

- Production with single domain
- Frontend and API served from same domain via nginx
- Most secure option

### 2. Azure IP (Testing/Development)

```env
# Your Azure VM public IP
CORS_ORIGIN=http://20.123.45.67
```

**When to use:**

- Testing before DNS setup
- Development on Azure VM
- No SSL certificate yet

### 3. Multiple Domains (Advanced)

```env
# Comma-separated list
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com,https://mobile.yourdomain.com
```

**When to use:**

- Multiple frontend domains
- Separate staging/production environments
- Mobile app + web app

### 4. Allow All (Development ONLY)

```env
CORS_ORIGIN=*
```

**When to use:**

- Local development ONLY
- **NEVER in production!** (security risk)

## Do You Even Need CORS?

### Same-Origin (No CORS Needed)

If your setup is:

- Frontend: `https://yourdomain.com`
- API: `https://yourdomain.com/api`

**CORS isn't triggered!** Requests are same-origin.

### Different Origins (CORS Required)

If your setup is:

- Frontend: `https://app.yourdomain.com`
- API: `https://api.yourdomain.com`

**CORS is required!** Different subdomains = different origins.

## Your Current Setup Analysis

✅ **Your nginx.conf shows:**

```nginx
# Frontend served at:
location / {
    proxy_pass http://frontend_app;  # yourdomain.com/
}

# API served at:
location /api/ {
    proxy_pass http://backend_api;   # yourdomain.com/api/
}
```

**Result:** Both served from **same domain** → CORS not strictly needed!

However, setting CORS correctly is **still recommended** for:

- Future mobile apps
- Third-party integrations
- Webhooks from external services
- Developer tools (Postman, curl)

## Recommended Production Values

### Scenario 1: Using Domain Name

```env
# In your .env file
CORS_ORIGIN=https://yourdomain.com

# Or if you have www and non-www
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### Scenario 2: Using Azure VM IP (No Domain Yet)

```env
# HTTP only (no SSL)
CORS_ORIGIN=http://20.123.45.67

# Or with nginx port
CORS_ORIGIN=http://20.123.45.67:80
```

### Scenario 3: Development + Production

```env
# Local development
CORS_ORIGIN=http://localhost:3000,http://localhost

# Or allow all in dev
CORS_ORIGIN=*
```

## Common CORS Errors & Solutions

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause:** CORS_ORIGIN doesn't match the origin in browser

**Solution:**

```bash
# Check what origin your browser is sending
# Open browser DevTools → Network → Select request → Check "Origin" header

# Set CORS_ORIGIN to match exactly
CORS_ORIGIN=<exact_origin_from_browser>

# Restart backend
docker-compose restart backend
```

### Error: "CORS policy: The value of the 'Access-Control-Allow-Origin' header must not be '\*'"

**Cause:** Using `CORS_ORIGIN=*` with `credentials: true`

**Solution:**

```env
# Use specific domain instead
CORS_ORIGIN=https://yourdomain.com
```

### Error: "CORS blocked origin: https://..."

**Cause:** Origin not in allowed list (check backend logs)

**Solution:**

```env
# Add the origin to your comma-separated list
CORS_ORIGIN=https://yourdomain.com,https://new-origin.com

# Or check for typos (http vs https, www vs non-www)
```

## Testing CORS Configuration

### Test 1: Check Backend CORS Headers

```bash
# Test from command line
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://YOUR_AZURE_IP/api/health -v

# Look for response header:
# Access-Control-Allow-Origin: https://yourdomain.com
```

### Test 2: Check in Browser

```javascript
// Open browser console on https://yourdomain.com
fetch("/api/health")
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);

// Should work without CORS error
```

### Test 3: Test Cross-Origin Request

```javascript
// Open browser console on a DIFFERENT domain
fetch("https://yourdomain.com/api/health")
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);

// Should fail if that domain not in CORS_ORIGIN (expected behavior)
```

## Updated Backend CORS Implementation

Your backend now supports:

- ✅ Multiple origins (comma-separated)
- ✅ Wildcard (\*) for development
- ✅ No-origin requests (mobile apps, Postman)
- ✅ CORS error logging
- ✅ Proper preflight handling

## Quick Reference

| Deployment Type     | CORS_ORIGIN Value                                   |
| ------------------- | --------------------------------------------------- |
| Production (domain) | `https://yourdomain.com`                            |
| Production (www)    | `https://yourdomain.com,https://www.yourdomain.com` |
| Azure VM (no SSL)   | `http://YOUR_AZURE_IP`                              |
| Local development   | `http://localhost:3000` or `*`                      |
| Mobile app + web    | `https://yourdomain.com,capacitor://localhost`      |

## Final Answer to Your Question

**You were right to question it!** But the answer is:

✅ **CORS_ORIGIN should be the PUBLIC domain users see, NOT the Docker network**

Because:

- Browsers never see Docker network (frontend, backend containers)
- Browsers only see what nginx exposes (yourdomain.com)
- CORS is between browser and public URL, not internal Docker services

Your production value should be:

```env
CORS_ORIGIN=https://yourdomain.com
```

NOT:

```env
CORS_ORIGIN=http://backend:3000  # ❌ Wrong! Browsers can't access this
CORS_ORIGIN=http://recipe_network  # ❌ Wrong! Not how CORS works
```
