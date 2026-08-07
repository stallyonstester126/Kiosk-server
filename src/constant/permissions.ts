export const PERMISSIONS = [
    'kitchen',
    'products',
    'categories',
    'transactions',
    'sales-report',
    'coupons',
    'staff'
] as const

export type Permission = (typeof PERMISSIONS)[number]
