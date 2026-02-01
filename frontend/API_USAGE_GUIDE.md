# API Usage Guide

## ✅ Centralized API Configuration

The project has a centralized API configuration in `src/services/api.js`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || "/api";
```

## How to Make API Calls

### Option 1: Use Relative URLs (RECOMMENDED)

All API calls should use **relative URLs** starting with `/api/`:

```javascript
// ✅ CORRECT - Works everywhere
const response = await fetch("/api/users/123", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// ✅ CORRECT - With axios
const response = await axios.get("/api/recipes", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});
```

### Option 2: Use the API Service

For better consistency, use the pre-configured `api` instance from `services/api.js`:

```javascript
import api from "../services/api";

// The api instance automatically:
// - Uses the correct base URL
// - Adds authentication tokens
// - Handles 401 errors
const data = await api.get("/recipes");
const result = await api.post("/battles", battleData);
```

## ❌ NEVER Do This

```javascript
// ❌ WRONG - Hardcoded localhost
const response = await fetch('http://localhost/api/users', ...)

// ❌ WRONG - Hardcoded production URL
const response = await fetch('http://20.205.129.101/api/users', ...)

// ❌ WRONG - Full URL with domain
const response = await fetch('https://yoursite.com/api/users', ...)
```

## Environment Variables

Set `VITE_API_URL` in `.env` file if needed:

```bash
# Development (default: /api)
VITE_API_URL=/api

# Custom backend
VITE_API_URL=https://api.example.com
```

## Why This Matters

Using relative URLs (`/api/...`) ensures the frontend works in:

- ✅ Local development (localhost)
- ✅ Production (20.205.129.101)
- ✅ Any domain/subdomain
- ✅ Behind reverse proxies (nginx)
- ✅ Different environments

## Route Examples

| Endpoint      | Correct URL         |
| ------------- | ------------------- |
| Get recipes   | `/api/recipes`      |
| Create battle | `/api/battles`      |
| Upload media  | `/api/media/upload` |
| Admin stats   | `/api/admin/stats`  |
| User profile  | `/api/users/${id}`  |

---

**Last Updated:** 2026-01-31  
**Status:** ✅ All hardcoded localhost URLs removed from codebase
