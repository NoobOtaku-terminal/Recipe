# API Documentation

RESTful API documentation for Recipe Battle Platform.

**Base URL:** `http://localhost/api` (development) or `https://your-domain.com/api` (production)

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:

```http
Authorization: Bearer <jwt-token>
```

### Error Responses

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

Status codes:

- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)

## 📑 Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Recipes](#recipes)
3. [Ratings](#ratings)
4. [Comments](#comments)
5. [Battles](#battles)
6. [Users](#users)
7. [Media](#media)

---

## Authentication Endpoints

### POST /api/auth/register

Create a new user account.

**Request Body:**

```json
{
  "username": "chefmike",
  "email": "mike@example.com",
  "password": "SecurePassword123!",
  "display_name": "Chef Mike",
  "bio": "Passionate home cook",
  "preferred_cuisines": ["italian", "japanese"]
}
```

**Response (201 Created):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "chefmike",
    "email": "mike@example.com",
    "display_name": "Chef Mike",
    "bio": "Passionate home cook",
    "role": "user",
    "created_at": "2026-01-08T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation Rules:**

- `username`: 3-30 characters, alphanumeric + underscores
- `email`: Valid email format
- `password`: Minimum 8 characters
- `preferred_cuisines`: Optional array of strings

**Error (400):**

```json
{
  "error": "Validation Error",
  "message": "Username already exists"
}
```

### POST /api/auth/login

Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "username": "chefmike",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "chefmike",
    "display_name": "Chef Mike",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (401):**

```json
{
  "error": "Authentication Failed",
  "message": "Invalid username or password"
}
```

### GET /api/auth/profile

Get current user's profile with judge statistics.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "chefmike",
  "email": "mike@example.com",
  "display_name": "Chef Mike",
  "bio": "Passionate home cook",
  "role": "user",
  "created_at": "2026-01-08T12:00:00Z",
  "judge_profile": {
    "credibility_score": 85.5,
    "verified_comments_count": 42,
    "total_ratings_given": 156,
    "total_battle_votes": 23
  }
}
```

---

## Recipes

### GET /api/recipes

Get paginated list of recipes with optional filters.

**Query Parameters:**

- `page` (number, default: 1): Page number
- `limit` (number, default: 20, max: 100): Items per page
- `search` (string): Search in title/description
- `is_vegetarian` (boolean): Filter vegetarian recipes
- `difficulty` (string): easy|medium|hard
- `cuisine` (string): Filter by cuisine
- `max_cook_time` (number): Maximum total time in minutes

**Example Request:**

```
GET /api/recipes?page=1&limit=10&is_vegetarian=true&difficulty=easy
```

**Response (200 OK):**

```json
{
  "recipes": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Classic Margherita Pizza",
      "description": "Traditional Italian pizza with fresh basil",
      "difficulty": "medium",
      "prep_time": 30,
      "cook_time": 15,
      "is_vegetarian": true,
      "created_by": "550e8400-e29b-41d4-a716-446655440000",
      "author_name": "Chef Mike",
      "created_at": "2026-01-08T12:00:00Z",
      "avg_rating": 4.7,
      "rating_count": 23,
      "comment_count": 8
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "total_pages": 5
  }
}
```

### GET /api/recipes/:id

Get detailed recipe information.

**Response (200 OK):**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Classic Margherita Pizza",
  "description": "Traditional Italian pizza with fresh basil",
  "difficulty": "medium",
  "prep_time": 30,
  "cook_time": 15,
  "servings": 4,
  "is_vegetarian": true,
  "created_by": "550e8400-e29b-41d4-a716-446655440000",
  "author_name": "Chef Mike",
  "created_at": "2026-01-08T12:00:00Z",
  "updated_at": "2026-01-08T12:00:00Z",
  "ingredients": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "Pizza dough",
      "quantity": "500",
      "unit": "grams",
      "preparation_notes": "Room temperature"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "name": "Mozzarella cheese",
      "quantity": "200",
      "unit": "grams",
      "preparation_notes": "Sliced"
    }
  ],
  "steps": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440004",
      "step_number": 1,
      "instruction": "Preheat oven to 250°C (480°F)",
      "estimated_time": 10
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440005",
      "step_number": 2,
      "instruction": "Roll out dough into 12-inch circle",
      "estimated_time": 5
    }
  ],
  "cuisines": ["italian"],
  "media": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440006",
      "file_path": "/uploads/recipes/pizza.jpg",
      "media_type": "image",
      "display_order": 1,
      "caption": "Finished pizza"
    }
  ],
  "avg_rating": 4.7,
  "rating_count": 23,
  "comment_count": 8
}
```

### POST /api/recipes

Create a new recipe.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "title": "Classic Margherita Pizza",
  "description": "Traditional Italian pizza with fresh basil",
  "difficulty": "medium",
  "prep_time": 30,
  "cook_time": 15,
  "servings": 4,
  "is_vegetarian": true,
  "ingredients": [
    {
      "name": "Pizza dough",
      "quantity": "500",
      "unit": "grams",
      "preparation_notes": "Room temperature"
    }
  ],
  "steps": [
    {
      "step_number": 1,
      "instruction": "Preheat oven to 250°C (480°F)",
      "estimated_time": 10
    }
  ],
  "cuisines": ["italian"],
  "media_ids": ["990e8400-e29b-41d4-a716-446655440006"]
}
```

**Response (201 Created):**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Classic Margherita Pizza",
  "created_at": "2026-01-08T12:00:00Z"
}
```

**Validation:**

- `title`: Required, 3-200 characters
- `description`: Required, max 2000 characters
- `difficulty`: Required, enum: easy|medium|hard
- `prep_time`, `cook_time`: Required, positive integers
- `servings`: Required, positive integer
- `ingredients`: Required array, min 1 item
- `steps`: Required array, min 1 item

### PUT /api/recipes/:id

Update an existing recipe (only author can update).

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as POST (partial updates supported)

**Response (200 OK):**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "message": "Recipe updated successfully"
}
```

**Error (403):**

```json
{
  "error": "Forbidden",
  "message": "You can only update your own recipes"
}
```

### DELETE /api/recipes/:id

Delete a recipe (only author can delete).

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**

```json
{
  "message": "Recipe deleted successfully"
}
```

---

## Ratings

### GET /api/recipes/:recipeId/ratings

Get all ratings for a recipe.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response (200 OK):**

```json
{
  "ratings": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440007",
      "recipe_id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "chefmike",
      "rating": 5,
      "review_text": "Amazing recipe! Easy to follow",
      "created_at": "2026-01-08T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 23
  }
}
```

### POST /api/ratings

Submit a rating for a recipe.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "recipe_id": "660e8400-e29b-41d4-a716-446655440001",
  "rating": 5,
  "review_text": "Amazing recipe! Easy to follow"
}
```

**Validation:**

- `recipe_id`: Required, valid UUID
- `rating`: Required, integer 1-5
- `review_text`: Optional, max 1000 characters
- Cannot rate your own recipe
- One rating per user per recipe (updates existing)

**Response (201 Created or 200 OK):**

```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440007",
  "message": "Rating submitted successfully"
}
```

**Error (400):**

```json
{
  "error": "Validation Error",
  "message": "Cannot rate your own recipe"
}
```

---

## Comments

### GET /api/recipes/:recipeId/comments

Get comments for a recipe (threaded structure).

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 50)

**Response (200 OK):**

```json
{
  "comments": [
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440008",
      "recipe_id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "chefmike",
      "parent_comment_id": null,
      "comment_text": "Has anyone tried this with whole wheat flour?",
      "is_verified_recreation": false,
      "media_url": null,
      "created_at": "2026-01-08T12:00:00Z",
      "replies": [
        {
          "id": "bb0e8400-e29b-41d4-a716-446655440009",
          "parent_comment_id": "bb0e8400-e29b-41d4-a716-446655440008",
          "user_id": "550e8400-e29b-41d4-a716-446655440010",
          "username": "bakerjane",
          "comment_text": "Yes! Works great, add 10% more water",
          "is_verified_recreation": true,
          "media_url": "/uploads/comments/wheat-pizza.jpg",
          "created_at": "2026-01-08T13:00:00Z",
          "replies": []
        }
      ]
    }
  ]
}
```

### POST /api/comments

Post a comment on a recipe.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "recipe_id": "660e8400-e29b-41d4-a716-446655440001",
  "comment_text": "Has anyone tried this with whole wheat flour?",
  "parent_comment_id": null,
  "is_verified_recreation": false,
  "media_id": null
}
```

**Validation:**

- `recipe_id`: Required, valid UUID
- `comment_text`: Required, 1-2000 characters
- `parent_comment_id`: Optional, valid UUID (for replies)
- `is_verified_recreation`: Boolean (requires media_id if true)
- `media_id`: Required if is_verified_recreation is true

**Response (201 Created):**

```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440008",
  "message": "Comment posted successfully",
  "credibility_boost": 2.5
}
```

**Note:** Verified recreations increase judge credibility score.

### PUT /api/comments/:id

Update a comment (only author can update).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "comment_text": "Updated comment text"
}
```

**Response (200 OK):**

```json
{
  "message": "Comment updated successfully"
}
```

### DELETE /api/comments/:id

Delete a comment (only author can delete).

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**

```json
{
  "message": "Comment deleted successfully"
}
```

---

## Battles

### GET /api/battles

Get list of recipe battles.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string): pending|active|completed
- `theme` (string): Filter by theme

**Response (200 OK):**

```json
{
  "battles": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440011",
      "title": "Best Chocolate Chip Cookie",
      "theme": "desserts",
      "description": "Who makes the best chocolate chip cookie?",
      "status": "active",
      "start_date": "2026-01-01T00:00:00Z",
      "end_date": "2026-01-15T00:00:00Z",
      "created_by": "550e8400-e29b-41d4-a716-446655440000",
      "total_votes": 342,
      "entry_count": 8
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

### GET /api/battles/:id

Get battle details with entries and results.

**Response (200 OK):**

```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440011",
  "title": "Best Chocolate Chip Cookie",
  "theme": "desserts",
  "description": "Who makes the best chocolate chip cookie?",
  "status": "active",
  "start_date": "2026-01-01T00:00:00Z",
  "end_date": "2026-01-15T00:00:00Z",
  "total_votes": 342,
  "entries": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440012",
      "recipe_id": "660e8400-e29b-41d4-a716-446655440001",
      "recipe_title": "Classic Chocolate Chip",
      "recipe_author": "chefmike",
      "vote_count": 156,
      "vote_percentage": 45.6,
      "rank": 1
    },
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440013",
      "recipe_id": "660e8400-e29b-41d4-a716-446655440002",
      "recipe_title": "Chewy Dark Chocolate",
      "recipe_author": "bakerjane",
      "vote_count": 142,
      "vote_percentage": 41.5,
      "rank": 2
    }
  ],
  "user_voted": true,
  "user_vote_entry_id": "dd0e8400-e29b-41d4-a716-446655440012"
}
```

### POST /api/battles

Create a new battle.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "title": "Best Chocolate Chip Cookie",
  "theme": "desserts",
  "description": "Who makes the best chocolate chip cookie?",
  "start_date": "2026-01-01T00:00:00Z",
  "end_date": "2026-01-15T00:00:00Z",
  "recipe_ids": [
    "660e8400-e29b-41d4-a716-446655440001",
    "660e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Validation:**

- `title`: Required, 3-200 characters
- `theme`: Optional, max 50 characters
- `description`: Optional, max 2000 characters
- `start_date`: Required, ISO 8601 format
- `end_date`: Required, after start_date
- `recipe_ids`: Required array, 2-10 recipes

**Response (201 Created):**

```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440011",
  "message": "Battle created successfully"
}
```

### POST /api/battles/:id/vote

Vote in a battle.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "entry_id": "dd0e8400-e29b-41d4-a716-446655440012"
}
```

**Validation:**

- One vote per user per battle
- Battle must be active
- Entry must belong to battle

**Response (201 Created or 200 OK):**

```json
{
  "message": "Vote recorded successfully"
}
```

**Error (400):**

```json
{
  "error": "Already Voted",
  "message": "You have already voted in this battle"
}
```

---

## Users

### GET /api/users/:username

Get public user profile.

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "chefmike",
  "display_name": "Chef Mike",
  "bio": "Passionate home cook",
  "created_at": "2026-01-08T12:00:00Z",
  "stats": {
    "recipes_posted": 12,
    "battles_won": 3,
    "avg_recipe_rating": 4.6,
    "total_ratings_received": 234
  },
  "judge_profile": {
    "credibility_score": 85.5,
    "verified_comments_count": 42,
    "total_ratings_given": 156
  },
  "badges": [
    {
      "id": "ee0e8400-e29b-41d4-a716-446655440014",
      "name": "Recipe Master",
      "description": "Posted 10+ recipes",
      "icon_url": "/badges/recipe-master.png",
      "earned_at": "2026-01-05T00:00:00Z"
    }
  ]
}
```

### GET /api/users/:username/recipes

Get user's recipes.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response (200 OK):**

```json
{
  "recipes": [...],
  "pagination": {...}
}
```

### GET /api/leaderboard

Get judge credibility leaderboard.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 50)

**Response (200 OK):**

```json
{
  "judges": [
    {
      "rank": 1,
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "chefmike",
      "display_name": "Chef Mike",
      "credibility_score": 95.8,
      "verified_comments_count": 87,
      "total_ratings_given": 245,
      "badges_count": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234
  }
}
```

---

## Media

### POST /api/media/upload

Upload image or video file.

**Headers:**

- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**

- `file`: Image (JPEG, PNG, WebP) or video (MP4)
- `type`: "recipe" | "comment"

**Request (multipart/form-data):**

```
POST /api/media/upload
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="pizza.jpg"
Content-Type: image/jpeg

[binary data]
------WebKitFormBoundary
Content-Disposition: form-data; name="type"

recipe
------WebKitFormBoundary--
```

**Response (201 Created):**

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440006",
  "file_path": "/uploads/recipes/1736342400000-pizza.jpg",
  "media_type": "image",
  "file_size": 245678,
  "mime_type": "image/jpeg"
}
```

**Validation:**

- File size: Max 10 MB for images, 50 MB for videos
- Allowed types: image/jpeg, image/png, image/webp, video/mp4
- File is virus-scanned (in production)

**Error (400):**

```json
{
  "error": "Invalid File",
  "message": "File size exceeds 10 MB limit"
}
```

### GET /uploads/:type/:filename

Serve uploaded file (proxied through nginx).

**Response:** Binary file with appropriate Content-Type header

**Example:**

```
GET /uploads/recipes/1736342400000-pizza.jpg
```

---

## Rate Limiting

**Nginx Level:**

- General API: 10 requests/second/IP
- Frontend: 100 requests/second/IP

**Application Level (Express):**

- Authentication endpoints: 5 requests/15 minutes/IP
- Recipe creation: 10 requests/hour/user
- Comment posting: 30 requests/hour/user
- Vote submission: 50 requests/hour/user

**Rate Limit Headers:**

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1736342500
```

**Error (429 Too Many Requests):**

```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests, please try again later",
  "retry_after": 60
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {
    "field": "validation error details"
  }
}
```

### HTTP Status Codes

| Code | Meaning               | Usage                          |
| ---- | --------------------- | ------------------------------ |
| 200  | OK                    | Successful GET, PUT, DELETE    |
| 201  | Created               | Successful POST                |
| 400  | Bad Request           | Validation errors              |
| 401  | Unauthorized          | Missing/invalid authentication |
| 403  | Forbidden             | Insufficient permissions       |
| 404  | Not Found             | Resource doesn't exist         |
| 409  | Conflict              | Duplicate resource             |
| 422  | Unprocessable Entity  | Business logic validation      |
| 429  | Too Many Requests     | Rate limit exceeded            |
| 500  | Internal Server Error | Server error                   |

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**

- `page`: Page number (1-indexed)
- `limit`: Items per page (max varies by endpoint)

**Response Structure:**

```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 156,
    "total_pages": 8,
    "has_next": true,
    "has_prev": true
  }
}
```

---

## Filtering & Sorting

Many endpoints support filtering:

**Recipes:**

```
GET /api/recipes?is_vegetarian=true&difficulty=easy&cuisine=italian&max_cook_time=30
```

**Battles:**

```
GET /api/battles?status=active&theme=desserts
```

**Leaderboard:**

```
GET /api/leaderboard?min_credibility=80
```

---

## WebSocket Events (Future)

Real-time updates via Socket.IO:

```javascript
socket.on("battle:vote", (data) => {
  // Live vote count updates
});

socket.on("recipe:rating", (data) => {
  // New rating notifications
});

socket.on("comment:new", (data) => {
  // New comment notifications
});
```

---

## Postman Collection

Import this collection for easy API testing:

**Base Collection:**

```json
{
  "info": {
    "name": "Recipe Battle API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

Download full collection: [recipe-battle-api.postman.json](../postman/recipe-battle-api.postman.json)

---

## Client SDKs

JavaScript/TypeScript client example:

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost/api",
});

// Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Usage
const recipes = await api.get("/recipes", {
  params: { is_vegetarian: true, page: 1 },
});

const newRecipe = await api.post("/recipes", recipeData);
```
