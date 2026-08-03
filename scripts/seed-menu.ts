import mongoose from 'mongoose'
import database from '../src/services/database'
import Category from '../src/APIs/category/_shared/models/category.model'
import Product from '../src/APIs/product/_shared/models/product.model'

const categoriesData = [
    { name: 'Sandwiches', displayOrder: 0, isActive: true },
    { name: 'Kebabs', displayOrder: 1, isActive: true },
    { name: 'Burgers', displayOrder: 2, isActive: true },
    { name: 'Toasties', displayOrder: 3, isActive: true },
    { name: 'Snacks', displayOrder: 4, isActive: true },
    { name: 'Halal Snack', displayOrder: 5, isActive: true },
    { name: 'More', displayOrder: 6, isActive: true }
]

const customizationGroups = {
    eggBaconToastie: [
        {
            id: 'bread',
            title: 'Bread Selection',
            type: 'single' as const,
            required: true,
            options: [
                { id: 'white', name: 'White Bread', priceAdd: 0 },
                { id: 'wholemeal', name: 'Wholemeal', priceAdd: 0.5 },
                { id: 'sourdough', name: 'Sourdough', priceAdd: 1.5 },
                { id: 'glutenFree', name: 'Gluten Free', priceAdd: 2.0 }
            ]
        },
        {
            id: 'cheese',
            title: 'Cheese',
            type: 'single' as const,
            required: true,
            options: [
                { id: 'cheddar', name: 'Cheddar', priceAdd: 0 },
                { id: 'swiss', name: 'Swiss', priceAdd: 0.5 },
                { id: 'american', name: 'American', priceAdd: 0.5 },
                { id: 'vegan', name: 'Vegan Cheese', priceAdd: 1.0 }
            ]
        },
        {
            id: 'addons',
            title: 'Add-ons',
            type: 'multiple' as const,
            required: false,
            options: [
                { id: 'bacon', name: 'Extra Bacon', priceAdd: 1.5 },
                { id: 'avocado', name: 'Avocado', priceAdd: 1.0 },
                { id: 'tomato', name: 'Tomato', priceAdd: 0.5 },
                { id: 'spinach', name: 'Spinach', priceAdd: 0.5 }
            ]
        },
        {
            id: 'recommended',
            title: 'Recommended',
            type: 'multiple' as const,
            required: false,
            options: [
                { id: 'hashbrown', name: 'Hash Brown', priceAdd: 1.5 },
                { id: 'fries', name: 'Fries', priceAdd: 2.0 },
                { id: 'coffee', name: 'Coffee', priceAdd: 1.5 }
            ]
        }
    ],
    doubleEggDoubleBacon: [
        {
            id: 'bread',
            title: 'Bread Selection',
            type: 'single' as const,
            required: true,
            options: [
                { id: 'white', name: 'White Bread', priceAdd: 0 },
                { id: 'wholemeal', name: 'Wholemeal', priceAdd: 0.5 },
                { id: 'sourdough', name: 'Sourdough', priceAdd: 1.5 },
                { id: 'glutenFree', name: 'Gluten Free', priceAdd: 2.0 }
            ]
        },
        {
            id: 'sauce',
            title: 'Sauce',
            type: 'single' as const,
            required: false,
            options: [
                { id: 'none', name: 'No Sauce', priceAdd: 0 },
                { id: 'bbq', name: 'BBQ Sauce', priceAdd: 0.5 },
                { id: 'mayo', name: 'Mayonnaise', priceAdd: 0.5 },
                { id: 'tomato', name: 'Tomato Sauce', priceAdd: 0.5 }
            ]
        }
    ],
    meatLover: [
        {
            id: 'bread',
            title: 'Bread Selection',
            type: 'single' as const,
            required: true,
            options: [
                { id: 'white', name: 'White Bread', priceAdd: 0 },
                { id: 'wholemeal', name: 'Wholemeal', priceAdd: 0.5 },
                { id: 'sourdough', name: 'Sourdough', priceAdd: 1.5 }
            ]
        }
    ],
    cheesyPaneer: [
        {
            id: 'spice',
            title: 'Spice Level',
            type: 'single' as const,
            required: true,
            options: [
                { id: 'mild', name: 'Mild', priceAdd: 0 },
                { id: 'medium', name: 'Medium', priceAdd: 0 },
                { id: 'hot', name: 'Hot', priceAdd: 0 }
            ]
        }
    ]
}

const productsData = [
    {
        name: 'Egg and Bacon Toastie',
        description: 'Freshly toasted bread with free-range eggs and crispy bacon',
        price: 9.99,
        categoryName: 'Toasties',
        image: '/images/products/1.png',
        isActive: true,
        customizations: customizationGroups.eggBaconToastie
    },
    {
        name: 'Double Egg & Double Bacon Sandwich',
        description: 'Double the eggs, double the bacon, double the satisfaction',
        price: 14.99,
        categoryName: 'Sandwiches',
        image: '/images/products/2.png',
        isActive: true,
        customizations: customizationGroups.doubleEggDoubleBacon
    },
    {
        name: 'Meat Lover Sandwich',
        description: 'Packed with premium meats for the true carnivore',
        price: 15.99,
        categoryName: 'Sandwiches',
        image: '/images/products/3.png',
        isActive: true,
        customizations: customizationGroups.meatLover
    },
    {
        name: 'Cheesy Paneer Sandwich',
        description: 'Delicious paneer with melted cheese and spices',
        price: 15.99,
        categoryName: 'Sandwiches',
        image: '/images/products/4.png',
        isActive: true,
        customizations: customizationGroups.cheesyPaneer
    },
    {
        name: 'Double Egg & Bacon Sandwich',
        description: 'Classic double egg and bacon sandwich',
        price: 14.99,
        categoryName: 'Sandwiches',
        image: '/images/products/5.png',
        isActive: true,
        customizations: []
    },
    {
        name: 'Cheesy Paneer Sandwich',
        description: 'Delicious paneer with melted cheese and spices',
        price: 15.99,
        categoryName: 'Sandwiches',
        image: '/images/products/6.png',
        isActive: true,
        customizations: []
    },
    {
        name: 'Double Egg & Double Bacon Sandwich',
        description: 'Double the eggs, double the bacon, double the satisfaction',
        price: 14.99,
        categoryName: 'Sandwiches',
        image: '/images/products/7.png',
        isActive: true,
        customizations: []
    },
    {
        name: 'Meat Lover Sandwich',
        description: 'Packed with premium meats for the true carnivore',
        price: 15.99,
        categoryName: 'Sandwiches',
        image: '/images/products/8.png',
        isActive: true,
        customizations: []
    },
    {
        name: 'Cheesy Paneer Sandwich',
        description: 'Delicious paneer with melted cheese and spices',
        price: 15.99,
        categoryName: 'Sandwiches',
        image: '/images/products/9.png',
        isActive: true,
        customizations: []
    },
    {
        name: 'Double Egg & Bacon Sandwich',
        description: 'Classic double egg and bacon sandwich',
        price: 14.99,
        categoryName: 'Sandwiches',
        image: '/images/products/10.png',
        isActive: true,
        customizations: []
    }
]

async function seedMenu() {
    try {
        console.log('Connecting to database...')
        await database.connect()
        console.log('Connected to database')

        console.log('Deleting existing categories...')
        await Category.deleteMany({})

        console.log('Deleting existing products...')
        await Product.deleteMany({})

        console.log('Inserting categories...')
        const insertedCategories = await Category.insertMany(categoriesData)
        console.log(`Inserted ${insertedCategories.length} categories`)

        // Build category name to _id lookup
        const categoryLookup: Record<string, mongoose.Types.ObjectId> = {}
        for (const cat of insertedCategories) {
            categoryLookup[cat.name] = cat._id
        }

        console.log('Category lookup:', Object.keys(categoryLookup))

        // Prepare products with category _ids
        const productsToInsert = productsData.map(product => ({
            ...product,
            category: categoryLookup[product.categoryName]
        }))

        console.log('Inserting products...')
        const insertedProducts = await Product.insertMany(productsToInsert)
        console.log(`Inserted ${insertedProducts.length} products`)

        console.log('\n=== SEED COMPLETE ===')
        console.log('Categories:')
        for (const cat of insertedCategories) {
            console.log(`  - ${cat.name} (${cat._id})`)
        }
        console.log('\nProducts:')
        for (const prod of insertedProducts) {
            const cat = insertedCategories.find((c) => c._id.equals(prod.category))
            console.log(`  - ${prod.name} ($${prod.price}) -> ${cat?.name} (${prod._id})`)
        }

        await mongoose.disconnect()
        console.log('\nDisconnected from database')
        process.exit(0)
    } catch (error) {
        console.error('Seed failed:', error)
        await mongoose.disconnect()
        process.exit(1)
    }
}

seedMenu()