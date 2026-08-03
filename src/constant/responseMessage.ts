export default {
    SUCCESS: `Operation is completed`,
    SOMETHING_WENT_WRONG: `Something went wrong!`,
    NOT_FOUND: (entity: string) => `${entity} is not found`,
    TOO_MANY_REQUESTS: `So many requests`,
    UNAUTHORIZED: 'You are not allowed to perform this task',

    auth: {
        ALREADY_EXISTS: (entity: string, identifier: string) => `${identifier} already exists for the ${entity}`,
        ALREADY_CONFIRMED: (entity: string) => `${entity} already CONFIRMED`,
        INVALID_PHONE_NUMBER: `Invalid phone number`,
        USER_REGISTERED: `Account has been created successfully.`,
        USER_NOT_EXIST: `Account does not exist`,
        INVALID_EMAIL_OR_PASSWORD: `Invalid email or password`,
        LOGIN_SUCCESSFUL: `Login successful`
    },

    category: {
        ALREADY_EXISTS: (name: string) => `Category with name ${name} already exists`,
        NOT_FOUND: (entity: string) => `${entity} not found`
    },

product: {
        ALREADY_EXISTS: (name: string) => `Product with name ${name} already exists`,
        NOT_FOUND: (entity: string) => `${entity} not found`,
        INVALID_IMAGE: `Product image is required`
    },

    order: {
        NOT_FOUND: (entity: string) => `${entity} not found`,
        EMPTY_ITEMS: `Order must contain at least one item`,
        INVALID_PRODUCT_ID: `Invalid product ID`,
        PRODUCT_NOT_FOUND: (id: string) => `Product with ID ${id} not found`,
        PRODUCT_INACTIVE: (id: string) => `Product with ID ${id} is inactive`,
        INVALID_CUSTOMIZATION_GROUP: (id: string) => `Invalid customization group: ${id}`,
        INVALID_CUSTOMIZATION_OPTION: (id: string) => `Invalid customization option: ${id}`,
        INVALID_QUANTITY: `Quantity must be greater than 0`,
        INVALID_STATUS: `Invalid order status`
    },

    payment: {
        INTENT_CREATED: `Payment intent created successfully`,
        INTENT_FAILED: `Failed to create payment intent`,
        STRIPE_NOT_CONFIGURED: `Stripe is not configured`
    },

    staff: {
        CREATED: `Staff member created successfully`,
        NOT_FOUND: `Staff member not found`,
        EMAIL_EXISTS: (email: string) => `A user with email ${email} already exists`,
        PASSWORD_RESET: `Password reset successfully`,
        DEACTIVATED: `Staff member deactivated`,
        ACTIVATED: `Staff member activated`
    }
}
