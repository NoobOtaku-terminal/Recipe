-- Production Seed Data
-- Migration 010: Sample Data for Production
-- This creates sample users, recipes, and battles for demonstration

BEGIN;

-- Disable triggers temporarily to avoid XP award issues during seed
SET session_replication_role = replica;

-- =============================================================================
-- SAMPLE USERS
-- =============================================================================

-- Insert sample cuisines first
INSERT INTO cuisines (name) VALUES 
('Italian'), ('Mexican'), ('Chinese'), ('Japanese'), ('Indian'), 
('Thai'), ('French'), ('American'), ('Mediterranean'), ('Korean')
ON CONFLICT (name) DO NOTHING;

-- Insert sample ingredients
INSERT INTO ingredients (name) VALUES 
('Tomato'), ('Onion'), ('Garlic'), ('Olive Oil'), ('Salt'), ('Pepper'),
('Chicken'), ('Beef'), ('Pasta'), ('Rice'), ('Soy Sauce'), ('Ginger'),
('Cheese'), ('Butter'), ('Flour'), ('Sugar'), ('Eggs'), ('Milk')
ON CONFLICT (name) DO NOTHING;

-- Sample users (passwords are all: Demo@123)
-- Password hash for "Demo@123": $2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6

DO $$
BEGIN
    -- Check if experience_points column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'experience_points') THEN
        -- Insert with XP fields
        INSERT INTO users (id, username, email, password_hash, bio, skill_level, experience_points, level, level_name, created_at) VALUES
        (gen_random_uuid(), 'chef_mario', 'mario@cookoff.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6', 'Passionate Italian chef specializing in authentic pasta dishes. 🍝', 'expert', 2500, 5, 'expert', NOW() - INTERVAL '180 days'),
        (gen_random_uuid(), 'spice_queen', 'queen@cookoff.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6', 'Indian cuisine expert. Love experimenting with spices and flavors! 🌶️', 'expert', 1800, 4, 'advanced', NOW() - INTERVAL '120 days'),
        (gen_random_uuid(), 'sushi_master', 'sushi@cookoff.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6', 'Traditional Japanese chef. Precision and simplicity are key. 🍱', 'expert', 2200, 4, 'advanced', NOW() - INTERVAL '150 days'),
        (gen_random_uuid(), 'taco_wizard', 'taco@cookoff.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6', 'Mexican food enthusiast. Tacos are life! 🌮', 'intermediate', 850, 3, 'intermediate', NOW() - INTERVAL '90 days'),
        (gen_random_uuid(), 'pastry_chef', 'pastry@cookoff.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6', 'French pastry specialist. Making magic with butter and flour! 🥐', 'intermediate', 650, 3, 'intermediate', NOW() - INTERVAL '60 days'),
        (gen_random_uuid(), 'home_cook', 'home@cookoff.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6', 'Learning to cook one recipe at a time. Still burning things! 😅', 'beginner', 150, 2, 'intermediate', NOW() - INTERVAL '30 days'),
        (gen_random_uuid(), 'grill_master', 'grill@cookoff.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6', 'BBQ and grilling expert. If it can be grilled, I will grill it! 🔥', 'expert', 1950, 4, 'advanced', NOW() - INTERVAL '135 days')
        ON CONFLICT (username) DO NOTHING;
    ELSE
        -- Insert without XP fields (backward compatible)
        INSERT INTO users (id, username, email, password_hash, bio, skill_level, created_at) VALUES
        (gen_random_uuid(), 'chef_mario', 'mario@cookoff.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6', 'Passionate Italian chef specializing in authentic pasta dishes. 🍝', 'expert', NOW() - INTERVAL '180 days'),
        (gen_random_uuid(), 'spice_queen', 'queen@cookoff.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6', 'Indian cuisine expert. Love experimenting with spices and flavors! 🌶️', 'expert', NOW() - INTERVAL '120 days'),
        (gen_random_uuid(), 'sushi_master', 'sushi@cookoff.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6', 'Traditional Japanese chef. Precision and simplicity are key. 🍱', 'expert', NOW() - INTERVAL '150 days'),
        (gen_random_uuid(), 'taco_wizard', 'taco@cookoff.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6', 'Mexican food enthusiast. Tacos are life! 🌮', 'intermediate', NOW() - INTERVAL '90 days'),
        (gen_random_uuid(), 'pastry_chef', 'pastry@cookoff.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6', 'French pastry specialist. Making magic with butter and flour! 🥐', 'intermediate', NOW() - INTERVAL '60 days'),
        (gen_random_uuid(), 'home_cook', 'home@cookoff.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6', 'Learning to cook one recipe at a time. Still burning things! 😅', 'beginner', NOW() - INTERVAL '30 days'),
        (gen_random_uuid(), 'grill_master', 'grill@cookoff.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRpsYdy8gDvxTPB0I6.Y3iG/HLwu6', 'BBQ and grilling expert. If it can be grilled, I will grill it! 🔥', 'expert', NOW() - INTERVAL '135 days')
        ON CONFLICT (username) DO NOTHING;
    END IF;
END $$;

-- =============================================================================
-- SAMPLE RECIPES
-- =============================================================================

-- Get user IDs for recipe creation
DO $$
DECLARE
    mario_id UUID;
    spice_id UUID;
    sushi_id UUID;
    taco_id UUID;
    pastry_id UUID;
    recipe1_id UUID;
    recipe2_id UUID;
    recipe3_id UUID;
    recipe4_id UUID;
    recipe5_id UUID;
    recipe6_id UUID;
    
BEGIN
    -- Get user IDs
    SELECT id INTO mario_id FROM users WHERE username = 'chef_mario' LIMIT 1;
    SELECT id INTO spice_id FROM users WHERE username = 'spice_queen' LIMIT 1;
    SELECT id INTO sushi_id FROM users WHERE username = 'sushi_master' LIMIT 1;
    SELECT id INTO taco_id FROM users WHERE username = 'taco_wizard' LIMIT 1;
    SELECT id INTO pastry_id FROM users WHERE username = 'pastry_chef' LIMIT 1;

    -- Only proceed if users exist
    IF mario_id IS NOT NULL THEN
        
        -- Recipe 1: Classic Carbonara
        INSERT INTO recipes (id, author_id, title, description, difficulty_claimed, cook_time_minutes, is_veg, calories, created_at)
        VALUES (
            gen_random_uuid(),
            mario_id,
            'Authentic Spaghetti Carbonara',
            'Traditional Roman pasta dish with eggs, pecorino cheese, guanciale, and black pepper. No cream!',
            'medium',
            25,
            FALSE,
            650,
            NOW() - INTERVAL '45 days'
        ) RETURNING id INTO recipe1_id;

        INSERT INTO recipe_cuisines (recipe_id, cuisine_id) VALUES (recipe1_id, (SELECT id FROM cuisines WHERE name = 'Italian'));
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES 
            (recipe1_id, (SELECT id FROM ingredients WHERE name = 'Pasta'), '400g'),
            (recipe1_id, (SELECT id FROM ingredients WHERE name = 'Eggs'), '4'),
            (recipe1_id, (SELECT id FROM ingredients WHERE name = 'Cheese'), '100g pecorino'),
            (recipe1_id, (SELECT id FROM ingredients WHERE name = 'Pepper'), '2 tsp');

        INSERT INTO recipe_steps (recipe_id, step_no, instruction) VALUES
            (recipe1_id, 1, 'Bring a large pot of salted water to boil. Cook spaghetti according to package directions.'),
            (recipe1_id, 2, 'While pasta cooks, whisk eggs and grated pecorino cheese in a bowl. Add plenty of black pepper.'),
            (recipe1_id, 3, 'Cook guanciale in a pan until crispy. Remove from heat.'),
            (recipe1_id, 4, 'Reserve 1 cup pasta water, then drain pasta. Add hot pasta to guanciale pan.'),
            (recipe1_id, 5, 'Off heat, quickly mix in egg mixture, adding pasta water to create creamy sauce. Serve immediately!');

        -- Recipe 2: Butter Chicken
        INSERT INTO recipes (id, author_id, title, description, difficulty_claimed, cook_time_minutes, is_veg, calories, created_at)
        VALUES (
            gen_random_uuid(),
            spice_id,
            'Creamy Butter Chicken',
            'Rich and creamy Indian curry with tender chicken in tomato-butter sauce. Restaurant quality at home!',
            'medium',
            45,
            FALSE,
            520,
            NOW() - INTERVAL '38 days'
        ) RETURNING id INTO recipe2_id;

        INSERT INTO recipe_cuisines (recipe_id, cuisine_id) VALUES (recipe2_id, (SELECT id FROM cuisines WHERE name = 'Indian'));
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES 
            (recipe2_id, (SELECT id FROM ingredients WHERE name = 'Chicken'), '500g'),
            (recipe2_id, (SELECT id FROM ingredients WHERE name = 'Tomato'), '400g'),
            (recipe2_id, (SELECT id FROM ingredients WHERE name = 'Butter'), '4 tbsp'),
            (recipe2_id, (SELECT id FROM ingredients WHERE name = 'Garlic'), '4 cloves'),
            (recipe2_id, (SELECT id FROM ingredients WHERE name = 'Ginger'), '1 inch');

        INSERT INTO recipe_steps (recipe_id, step_no, instruction) VALUES
            (recipe2_id, 1, 'Marinate chicken pieces in yogurt, lemon juice, and spices for at least 1 hour.'),
            (recipe2_id, 2, 'Make tomato sauce by cooking tomatoes, garlic, ginger, and spices until soft. Blend until smooth.'),
            (recipe2_id, 3, 'Grill or pan-fry marinated chicken until cooked through and slightly charred.'),
            (recipe2_id, 4, 'In a large pan, add butter and pour in tomato sauce. Simmer for 10 minutes.'),
            (recipe2_id, 5, 'Add cooked chicken and cream. Simmer for 5 more minutes. Garnish with cilantro and serve with naan!');

        -- Recipe 3: California Roll
        INSERT INTO recipes (id, author_id, title, description, difficulty_claimed, cook_time_minutes, is_veg, calories, created_at)
        VALUES (
            gen_random_uuid(),
            sushi_id,
            'Perfect California Roll',
            'Popular American-style sushi roll with crab, avocado, and cucumber. Great for beginners!',
            'easy',
            30,
            FALSE,
            280,
            NOW() - INTERVAL '25 days'
        ) RETURNING id INTO recipe3_id;

        INSERT INTO recipe_cuisines (recipe_id, cuisine_id) VALUES (recipe3_id, (SELECT id FROM cuisines WHERE name = 'Japanese'));
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES 
            (recipe3_id, (SELECT id FROM ingredients WHERE name = 'Rice'), '2 cups sushi rice'),
            (recipe3_id, (SELECT id FROM ingredients WHERE name = 'Soy Sauce'), 'for serving');

        INSERT INTO recipe_steps (recipe_id, step_no, instruction) VALUES
            (recipe3_id, 1, 'Cook sushi rice according to package instructions. Season with rice vinegar, sugar, and salt.'),
            (recipe3_id, 2, 'Place nori sheet on bamboo mat, shiny side down. Spread rice evenly, leaving 1 inch at top.'),
            (recipe3_id, 3, 'Flip over so rice is on the mat. Place crab, avocado, and cucumber strips in center.'),
            (recipe3_id, 4, 'Roll tightly using the bamboo mat. Seal the edge with a bit of water.'),
            (recipe3_id, 5, 'Cut into 8 pieces with a sharp, wet knife. Serve with soy sauce and wasabi!');

        -- Recipe 4: Street Tacos
        INSERT INTO recipes (id, author_id, title, description, difficulty_claimed, cook_time_minutes, is_veg, calories, created_at)
        VALUES (
            gen_random_uuid(),
            taco_id,
            'Authentic Street Tacos',
            'Simple, flavorful Mexican street tacos with carne asada. Like you are in Mexico City!',
            'easy',
            20,
            FALSE,
            380,
            NOW() - INTERVAL '18 days'
        ) RETURNING id INTO recipe4_id;

        INSERT INTO recipe_cuisines (recipe_id, cuisine_id) VALUES (recipe4_id, (SELECT id FROM cuisines WHERE name = 'Mexican'));
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES 
            (recipe4_id, (SELECT id FROM ingredients WHERE name = 'Beef'), '500g flank steak'),
            (recipe4_id, (SELECT id FROM ingredients WHERE name = 'Onion'), '1 large'),
            (recipe4_id, (SELECT id FROM ingredients WHERE name = 'Garlic'), '3 cloves');

        INSERT INTO recipe_steps (recipe_id, step_no, instruction) VALUES
            (recipe4_id, 1, 'Marinate beef in lime juice, garlic, cumin, and chili powder for 2 hours.'),
            (recipe4_id, 2, 'Heat grill or cast iron pan to high heat. Cook beef 3-4 minutes per side for medium-rare.'),
            (recipe4_id, 3, 'Let meat rest for 5 minutes, then slice thinly against the grain.'),
            (recipe4_id, 4, 'Warm corn tortillas on the grill or directly over gas flame.'),
            (recipe4_id, 5, 'Serve meat on tortillas with diced onion, cilantro, lime wedges, and your favorite salsa!');

        -- Recipe 5: Croissants
        INSERT INTO recipes (id, author_id, title, description, difficulty_claimed, cook_time_minutes, is_veg, calories, created_at)
        VALUES (
            gen_random_uuid(),
            pastry_id,
            'Classic French Croissants',
            'Flaky, buttery, perfect croissants. Time-intensive but absolutely worth it!',
            'hard',
            480,
            TRUE,
            450,
            NOW() - INTERVAL '12 days'
        ) RETURNING id INTO recipe5_id;

        INSERT INTO recipe_cuisines (recipe_id, cuisine_id) VALUES (recipe5_id, (SELECT id FROM cuisines WHERE name = 'French'));
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES 
            (recipe5_id, (SELECT id FROM ingredients WHERE name = 'Flour'), '500g'),
            (recipe5_id, (SELECT id FROM ingredients WHERE name = 'Butter'), '280g'),
            (recipe5_id, (SELECT id FROM ingredients WHERE name = 'Milk'), '140ml'),
            (recipe5_id, (SELECT id FROM ingredients WHERE name = 'Sugar'), '50g'),
            (recipe5_id, (SELECT id FROM ingredients WHERE name = 'Eggs'), '1 for wash');

        INSERT INTO recipe_steps (recipe_id, step_no, instruction) VALUES
            (recipe5_id, 1, 'Make dough with flour, milk, sugar, salt, and yeast. Knead until smooth. Refrigerate overnight.'),
            (recipe5_id, 2, 'Pound cold butter into a square. Roll out dough and place butter in center. Fold into thirds.'),
            (recipe5_id, 3, 'Roll and fold dough 3 more times, chilling 30 minutes between each fold. This creates the layers!'),
            (recipe5_id, 4, 'Roll dough thin, cut into triangles, and roll into croissant shape. Let rise for 2 hours.'),
            (recipe5_id, 5, 'Brush with egg wash. Bake at 200°C for 15-20 minutes until golden brown. Cool and enjoy!');

        -- Recipe 6: Margherita Pizza
        INSERT INTO recipes (id, author_id, title, description, difficulty_claimed, cook_time_minutes, is_veg, calories, created_at)
        VALUES (
            gen_random_uuid(),
            mario_id,
            'Neapolitan Margherita Pizza',
            'Simple and perfect pizza with just tomato, mozzarella, and basil. Less is more!',
            'medium',
            90,
            TRUE,
            550,
            NOW() - INTERVAL '8 days'
        ) RETURNING id INTO recipe6_id;

        INSERT INTO recipe_cuisines (recipe_id, cuisine_id) VALUES (recipe6_id, (SELECT id FROM cuisines WHERE name = 'Italian'));
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES 
            (recipe6_id, (SELECT id FROM ingredients WHERE name = 'Flour'), '400g'),
            (recipe6_id, (SELECT id FROM ingredients WHERE name = 'Tomato'), '400g can'),
            (recipe6_id, (SELECT id FROM ingredients WHERE name = 'Cheese'), '250g mozzarella'),
            (recipe6_id, (SELECT id FROM ingredients WHERE name = 'Olive Oil'), '2 tbsp');

        INSERT INTO recipe_steps (recipe_id, step_no, instruction) VALUES
            (recipe6_id, 1, 'Make dough: mix flour, water, yeast, salt. Knead 10 mins. Let rise 1 hour until doubled.'),
            (recipe6_id, 2, 'Preheat oven to maximum temperature (ideally 250°C+) with pizza stone inside for 45 minutes.'),
            (recipe6_id, 3, 'Stretch dough into 12-inch circle. Spread crushed tomatoes, leaving border for crust.'),
            (recipe6_id, 4, 'Add torn mozzarella pieces. Drizzle with olive oil and sprinkle with salt.'),
            (recipe6_id, 5, 'Bake for 10-12 minutes until crust is golden and cheese is bubbling. Top with fresh basil!');

        -- Add some ratings to recipes
        INSERT INTO ratings (user_id, recipe_id, rating, created_at) VALUES
            (spice_id, recipe1_id, 5, NOW() - INTERVAL '40 days'),
            (sushi_id, recipe1_id, 5, NOW() - INTERVAL '38 days'),
            (taco_id, recipe1_id, 4, NOW() - INTERVAL '35 days'),
            (mario_id, recipe2_id, 5, NOW() - INTERVAL '30 days'),
            (sushi_id, recipe2_id, 5, NOW() - INTERVAL '28 days'),
            (pastry_id, recipe3_id, 4, NOW() - INTERVAL '20 days'),
            (mario_id, recipe4_id, 5, NOW() - INTERVAL '15 days'),
            (spice_id, recipe4_id, 4, NOW() - INTERVAL '12 days'),
            (taco_id, recipe5_id, 5, NOW() - INTERVAL '10 days'),
            (mario_id, recipe6_id, 5, NOW() - INTERVAL '5 days');

    END IF;
END $$;

-- =============================================================================
-- SAMPLE BATTLES
-- =============================================================================

DO $$
DECLARE
    mario_id UUID;
    spice_id UUID;
    battle_id UUID;
    recipe1_id UUID;
    recipe2_id UUID;
BEGIN
    SELECT id INTO mario_id FROM users WHERE username = 'chef_mario' LIMIT 1;
    SELECT id INTO spice_id FROM users WHERE username = 'spice_queen' LIMIT 1;
    
    IF mario_id IS NOT NULL AND spice_id IS NOT NULL THEN
        -- Create a past battle
        INSERT INTO battles (id, dish_name, description, status, starts_at, ends_at, creator_id, created_at)
        VALUES (
            gen_random_uuid(),
            'Best Comfort Food',
            'Show us your ultimate comfort food recipe! Warm, cozy, and delicious.',
            'completed',
            NOW() - INTERVAL '20 days',
            NOW() - INTERVAL '10 days',
            mario_id,
            NOW() - INTERVAL '21 days'
        ) RETURNING id INTO battle_id;

        -- Get recipe IDs
        SELECT id INTO recipe1_id FROM recipes WHERE title = 'Authentic Spaghetti Carbonara' LIMIT 1;
        SELECT id INTO recipe2_id FROM recipes WHERE title = 'Creamy Butter Chicken' LIMIT 1;

        IF recipe1_id IS NOT NULL AND recipe2_id IS NOT NULL THEN
            -- Add entries to battle
            INSERT INTO battle_entries (battle_id, recipe_id, entered_at) VALUES
                (battle_id, recipe1_id, NOW() - INTERVAL '19 days'),
                (battle_id, recipe2_id, NOW() - INTERVAL '18 days');
        END IF;

        -- Create an active battle
        INSERT INTO battles (id, dish_name, description, status, starts_at, ends_at, creator_id, created_at)
        VALUES (
            gen_random_uuid(),
            'Quick Weeknight Dinner',
            'Your best recipe that can be made in 30 minutes or less!',
            'active',
            NOW() - INTERVAL '2 days',
            NOW() + INTERVAL '5 days',
            spice_id,
            NOW() - INTERVAL '3 days'
        );
    END IF;
    
    RAISE NOTICE 'Sample data created successfully! Demo user passwords are all: Demo@123';
END $$;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;
