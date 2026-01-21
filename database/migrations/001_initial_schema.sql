-- Migration 001: Initial Schema
-- Recipe Battle Platform - Core Tables
-- Created: 2026-01-08

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE ENTITIES
-- =============================================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    bio TEXT,
    skill_level VARCHAR(20) CHECK (skill_level IN ('beginner', 'intermediate', 'expert')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Cuisines table (normalized)
CREATE TABLE cuisines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- User-Cuisine preferences (M:N)
CREATE TABLE user_cuisines (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cuisine_id INT REFERENCES cuisines(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, cuisine_id)
);

-- =============================================================================
-- RECIPES DOMAIN
-- =============================================================================

-- Recipes table
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_claimed VARCHAR(10) CHECK (difficulty_claimed IN ('easy', 'medium', 'hard')),
    cook_time_minutes INT,
    is_veg BOOLEAN DEFAULT FALSE,
    calories INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Recipe-Cuisine mapping (M:N)
CREATE TABLE recipe_cuisines (
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    cuisine_id INT REFERENCES cuisines(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, cuisine_id)
);

-- Ingredients table (normalized)
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL
);

-- Recipe ingredients with quantities
CREATE TABLE recipe_ingredients (
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id INT REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity VARCHAR(50),
    PRIMARY KEY (recipe_id, ingredient_id)
);

-- Recipe steps
CREATE TABLE recipe_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    step_no INT NOT NULL,
    instruction TEXT NOT NULL,
    UNIQUE (recipe_id, step_no)
);

-- Media table (reusable for recipes and comments)
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Recipe media mapping
CREATE TABLE recipe_media (
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, media_id)
);

-- =============================================================================
-- RATING & TRUST SYSTEM
-- =============================================================================

-- Ratings (one per user per recipe)
CREATE TABLE ratings (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, recipe_id)
);

-- Comments (threaded support)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Comment media (proof images)
CREATE TABLE comment_media (
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    PRIMARY KEY (comment_id, media_id)
);

-- Difficulty feedback
CREATE TABLE difficulty_feedback (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easier', 'same', 'harder')),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, recipe_id)
);

-- =============================================================================
-- JUDGE CREDIBILITY SYSTEM
-- =============================================================================

CREATE TABLE judge_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    level VARCHAR(20) DEFAULT 'Beginner Taster' CHECK (level IN ('Beginner Taster', 'Home Chef', 'Master Critic')),
    credibility_score FLOAT DEFAULT 0.0,
    verified_reviews_count INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- BATTLE MODE
-- =============================================================================

-- Battles
CREATE TABLE battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dish_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'closed')),
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Battle entries
CREATE TABLE battle_entries (
    battle_id UUID REFERENCES battles(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    PRIMARY KEY (battle_id, recipe_id)
);

-- Battle votes (one per user per battle)
CREATE TABLE battle_votes (
    battle_id UUID REFERENCES battles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (battle_id, user_id),
    FOREIGN KEY (battle_id, recipe_id) REFERENCES battle_entries(battle_id, recipe_id)
);

-- =============================================================================
-- BADGES & ACHIEVEMENTS
-- =============================================================================

-- Badges
CREATE TABLE badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT
);

-- User badges
CREATE TABLE user_badges (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id INT REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

COMMIT;
