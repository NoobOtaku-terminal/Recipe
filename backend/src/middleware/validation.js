const Joi = require('joi');

/**
 * Validation middleware factory
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation Error',
                details: errors
            });
        }

        req[property] = value;
        next();
    };
};

// =============================================================================
// SCHEMAS
// =============================================================================

const schemas = {
    // Auth schemas
    register: Joi.object({
        username: Joi.string().alphanum().min(3).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        bio: Joi.string().max(500).optional(),
        skillLevel: Joi.string().valid('beginner', 'intermediate', 'expert').optional()
    }),

    login: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    }),

    // Recipe schemas
    createRecipe: Joi.object({
        title: Joi.string().min(3).max(255).required(),
        description: Joi.string().max(2000).optional(),
        difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
        cookTime: Joi.number().integer().min(1).max(1440).required(),
        isVeg: Joi.boolean().required(),
        calories: Joi.number().integer().min(0).optional(),
        cuisineIds: Joi.array().items(Joi.number().integer()).min(1).required(),
        ingredients: Joi.array().items(Joi.object({
            ingredientId: Joi.number().integer(),
            name: Joi.string().max(150),
            quantity: Joi.string().max(50).required()
        })).min(1).required(),
        steps: Joi.array().items(Joi.object({
            stepNo: Joi.number().integer().min(1).required(),
            instruction: Joi.string().min(10).max(1000).required()
        })).min(1).required()
    }),

    updateRecipe: Joi.object({
        title: Joi.string().min(3).max(255).required(),
        description: Joi.string().max(2000).optional(),
        difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
        cookTime: Joi.number().integer().min(1).max(1440).required(),
        isVeg: Joi.boolean().required(),
        calories: Joi.number().integer().min(0).optional(),
        cuisines: Joi.array().items(Joi.number().integer()).min(1).required(),
        ingredients: Joi.array().items(Joi.object({
            id: Joi.number().integer().optional(),
            name: Joi.string().max(150).optional(),
            quantity: Joi.string().max(50).required()
        })).min(1).required(),
        steps: Joi.array().items(Joi.object({
            stepNo: Joi.number().integer().min(1).required(),
            instruction: Joi.string().min(10).max(1000).required()
        })).min(1).required()
    }),

    // Rating schema
    createRating: Joi.object({
        recipeId: Joi.string().uuid().required(),
        rating: Joi.number().integer().min(1).max(5).required()
    }),

    // Comment schema
    createComment: Joi.object({
        recipeId: Joi.string().uuid().required(),
        parentId: Joi.string().uuid().optional(),
        content: Joi.string().min(1).max(2000).required()
    }),

    // Difficulty feedback schema
    difficultyFeedback: Joi.object({
        recipeId: Joi.string().uuid().required(),
        difficulty: Joi.string().valid('easier', 'same', 'harder').required()
    }),

    // Battle schema
    createBattle: Joi.object({
        dishName: Joi.string().min(3).max(255).required(),
        startsAt: Joi.date().iso().required(),
        endsAt: Joi.date().iso().greater(Joi.ref('startsAt')).required()
    }),

    // Battle entry schema
    battleEntry: Joi.object({
        recipeId: Joi.string().uuid().required()
    }),

    // Battle vote schema - requires media proof
    battleVote: Joi.object({
        recipeId: Joi.string().uuid().required(),
        proofMediaId: Joi.string().uuid().required(), // Proof of cooking (video/photo)
        notes: Joi.string().max(500).optional()
    }),

    // Query parameters
    paginationQuery: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20)
    }),

    recipeFilters: Joi.object({
        isVeg: Joi.boolean().optional(),
        difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
        cuisineId: Joi.number().integer().optional(),
        maxCookTime: Joi.number().integer().optional(),
        minCalories: Joi.number().integer().optional(),
        maxCalories: Joi.number().integer().optional(),
        sortBy: Joi.string().valid('created', 'rating', 'trending').default('created'),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20)
    })
};

module.exports = {
    validate,
    schemas
};
