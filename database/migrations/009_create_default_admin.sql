-- Create default admin user for production
-- This will only create the admin if no admin exists
-- Password: Admin@123 (change after first login)

DO $$
DECLARE
    admin_exists INTEGER;
    admin_id UUID;
BEGIN
    -- Check if any admin user exists
    SELECT COUNT(*) INTO admin_exists FROM users WHERE role = 'admin';
    
    IF admin_exists = 0 THEN
        -- Create admin user
        -- Default password: Admin@123 (CHANGE AFTER FIRST LOGIN!)
        INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'admin',
            'admin@recipebattle.com',
            '$2a$10$0ShXkLMFMLKfe6OKCUM8YuNZbp6z5I3oSwwIpwFYKynKmP8j0YcSK',
            'admin',
            NOW(),
            NOW()
        )
        RETURNING id INTO admin_id;
        
        -- Update admin statistics for new admin
        INSERT INTO admin_statistics (admin_id)
        VALUES (admin_id);
        
        RAISE NOTICE 'Default admin user created successfully';
    ELSE
        RAISE NOTICE 'Admin user already exists, skipping creation';
    END IF;
END $$;
