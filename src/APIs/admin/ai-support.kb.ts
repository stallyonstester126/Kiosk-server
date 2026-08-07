// This file is auto-generated. Do not edit directly.
export const KNOWLEDGE_BASE_MD = `# POS Admin Panel — AI Help Assistant Knowledge Base

Source of truth: Admin and Server source inspected on 2026-08-07. This describes implemented behavior only.

## System overview

The Admin is a Next.js application. It calls the Express API under \`/v1\` with an HTTP-only \`admin_accessToken\` cookie. The dashboard shell loads \`/admin/me\` on startup. Unauthenticated users are sent to \`/login\`; staff are restricted to their permitted route(s). The top bar supplies page-specific search and logout.

Canonical permissions are \`kitchen\`, \`products\`, \`categories\`, \`transactions\`, \`sales-report\`, \`coupons\`, and \`staff\`. An \`admin\` bypasses permission checks. The **Staff Management API and UI are admin-only**, even though \`staff\` remains a canonical permission value.

## Access and roles

| Route / feature | Admin | Staff requirement |
| --- | --- | --- |
| \`/dashboard\` summary | Yes | Not available (no staff dashboard permission) |
| Kitchen | Yes | \`kitchen\` |
| Products | Yes | \`products\` |
| Categories | Yes | \`categories\` |
| Transactions | Yes | \`transactions\` |
| Sales Report | Yes | \`sales-report\` |
| Coupons | Yes | \`coupons\` |
| Staff Management | Yes | Not available to staff |

The sidebar hides pages unavailable to a staff member. Direct navigation is also checked by the dashboard layout; the backend independently returns 403 when the relevant permission is absent. A staff user is sent to the first permitted page after login. Accounts with no usable page permission return to login.

## Authentication

**Page:** \`/login\`  
**Purpose:** sign in an Admin or Staff user.  
**How it works:** enter email and password; successful login sets an HTTP-only cookie (one-hour access token), stores the returned user in \`AdminAuthContext\`, then opens the Admin Dashboard or the staff member’s first allowed page. \`/admin/me\` returns the signed-in user profile, role, permissions, active status, and last-login time; it never returns a password/hash. Logout calls \`/admin/logout\`, clears the cookie, clears client state, and returns to login.

**Common errors:** invalid credentials return the API login error; a deactivated staff account receives “Account is deactivated. Contact your administrator.” A missing/expired cookie sends the user to login. Cross-origin use depends on the server CORS allowlist and secure cookie settings.

## Dashboard

**PAGE:** \`/dashboard\`  
**PURPOSE:** Admin-only operating summary.  
**HOW IT WORKS:** loads all orders and products, then calculates headline metrics from the loaded data: total orders, paid-order revenue, completed orders, product count, recent orders, and popular products. It does not create or update data.  
**IMPORTANT NOTES:** it uses the Transactions-protected order list and Products-protected product list, so it is not an independent staff landing page. Loading and API failures show a spinner or error message.

## Kitchen

**PAGE:** \`/dashboard/kitchen\`  
**PURPOSE:** work queue for active orders.  
**ACCESS/PERMISSION:** Admin or \`kitchen\`.  
**HOW IT WORKS:** loads only non-completed, non-cancelled orders in FIFO order and refreshes silently every eight seconds. Tabs filter Received, Confirmed, Preparing, Ready, or All. Global search matches order number, customer, and item names.

**AVAILABLE ACTIONS / WORKFLOW:** select an order’s action to advance it: \`received → confirmed → preparing → ready → completed\`. The backend also permits cancellation from Received or Confirmed, but the UI should be consulted for its displayed action. The server rejects illegal transitions, including reopening a completed/cancelled order. After a successful status change, the queue reloads.

**IMPORTANT NOTES:** creating an order is a public kiosk action, not an Admin action. Server-side order pricing is recalculated from current product data; supplied client prices are ignored.

## Products

**PAGE:** \`/dashboard/products\`  
**PURPOSE:** manage menu products.  
**ACCESS/PERMISSION:** Admin or \`products\`.  
**HOW IT WORKS:** loads products and active categories. Search matches product name, description, category, and price. Add/Edit opens a modal; Delete requires confirmation.

**FIELDS:** image (required when creating; image file only, under 5 MB in the UI), name (required), price (required, non-negative), category (required active category), description (optional), active flag, and optional customization groups. Each customization group has an id, title, \`single\`/\`multiple\` type, required flag, and options with id, name, non-negative price add-on.

**STEP-BY-STEP:** create active categories first; choose Add Product; complete required fields and upload an image; save. The browser sends multipart form data. The server checks unique product name and category existence, stores the upload, and returns the product. Edit can retain the existing image; Delete removes the database product.

**COMMON ERRORS:** missing image on create, invalid image type/size, empty/too-long name or description, negative price, invalid category id, unknown category, or duplicate product name.

## Categories

**PAGE:** \`/dashboard/categories\`  
**PURPOSE:** manage product categories and display order.  
**ACCESS/PERMISSION:** Admin or \`categories\`.  
**HOW IT WORKS:** search matches name/display order. Add and edit use one modal; delete uses confirmation. The page displays categories and active state, but its form only exposes name and display order.

**FIELDS:** name (required, 1–100 characters, unique) and display order (optional non-negative number; defaults to 0). The API also supports \`isActive\`, although this UI does not provide an active/inactive control.

**COMMON ERRORS:** duplicate category names, missing names, negative display order, or trying to edit/delete an id that no longer exists. Categories are not checked for product dependencies before deletion by the inspected service.

## Transactions

**PAGE:** \`/dashboard/transactions\`  
**PURPOSE:** inspect order/payment transaction records.  
**ACCESS/PERMISSION:** Admin or \`transactions\`.  
**HOW IT WORKS:** fetches the full order list, supports global search, pagination, a detail modal, and CSV/XLSX/PDF export. Export includes transaction id, order/customer/payment data, subtotal/tax/discount/final amount/coupon, and summary totals. It is a read/reporting page; it does not alter payment status or order data.

## Sales Report

**PAGE:** \`/dashboard/sales-report\`  
**PURPOSE:** analyze sales/order records and export them.  
**ACCESS/PERMISSION:** Admin or \`sales-report\`.  
**HOW IT WORKS:** uses \`/orders/sales-report\`, separate from Transactions authorization. It supports search, sorting, pagination and CSV/XLSX/PDF export. Exports include invoice/order, date, customer, order type, payment, item count, subtotal, coupon, discount, tax, total, status, and summary totals.

**IMPORTANT NOTES:** data is order-level. Sales reporting does not imply Transactions page access.

## Coupons

**PAGE:** \`/dashboard/coupons\`  
**PURPOSE:** create and administer checkout discount codes.  
**ACCESS/PERMISSION:** Admin or \`coupons\`.  
**AVAILABLE ACTIONS:** filter locally by status/type, sort, view details, create, edit, enable/disable, duplicate, and delete. A duplicate receives a unique \`-DUP\`/\`-DUPn\` code, zero uses, copied rules, and inactive status.

**FIELDS:** uppercase code (required/unique); optional description; discount type (percentage or fixed); percentage (1–100 for percentage); fixed amount (non-negative for fixed); optional minimum order; optional maximum percentage-discount cap; optional total usage and per-customer limits; start and expiry dates; first-order-only; stackable; and active/inactive status.

**WORKFLOW:** choose Create Coupon (the UI initializes dates from now through 30 days); set rule fields; save. The server verifies expiry is after start and not already expired, code uniqueness, and discount values. At checkout the public validation endpoint checks active/start/expiry, global and named-customer limits, first-order rule, and minimum order; it caps discount at subtotal, applies a fixed 10% tax to discounted subtotal, and returns calculated totals. When an order using a coupon is created, its \`used_count\` increments.

**IMPORTANT RESTRICTIONS:** per-customer and first-order checks identify customers by normalized **name**, not an account id. The inspected calculation does not implement a stacking combination; \`stackable\` is stored and exposed but no multi-coupon order flow exists. An expired coupon may still show active status unless manually disabled; validation rejects it.

## Staff Management

**PAGE:** \`/dashboard/staff\`  
**PURPOSE:** Admin-only staff account management.  
**ACCESS/PERMISSION:** Admin only; staff cannot access this page/API.  
**AVAILABLE ACTIONS:** list/search staff; create; edit name, email and page permissions; activate/deactivate; reset password. The list shows name, email, active status, last login, and creation date.

**CREATE WORKFLOW:** choose Add Staff; enter full name (2–72 chars), email, password (min 6 chars), and page permissions. Kitchen is selected by default; an omitted/empty permission list is stored as Kitchen. Save hashes the password, creates role \`staff\`, and returns the selected permissions.

**EDIT WORKFLOW:** select Edit; existing permissions load from the staff response. The password field remains deliberately empty and is not sent by Edit. Update name/email/permissions and save. To change password, use Reset Password and enter/confirm a new minimum-six-character password. Deactivation prevents future login; it does not delete the account.

**COMMON ERRORS:** duplicate email (409), invalid email/name/password, invalid/duplicate permission name, or unknown staff id. Passwords/hashes are never returned.

## API map

All routes below are prefixed \`/v1\`. Browser Admin calls include cookies.

| Feature | Endpoint(s) | Authorization |
| --- | --- | --- |
| Auth | \`POST /admin/login\`, \`GET /admin/me\`, \`PUT /admin/logout\` | login public; me/logout authenticated Admin or Staff |
| Products | \`GET/POST /products\`, \`GET/PUT/DELETE /products/:id\` | \`products\` (Admin bypass) |
| Categories | \`GET/POST /categories\`, \`GET/PUT/DELETE /categories/:id\` | \`categories\` |
| Kitchen/orders | \`GET /orders/kitchen\`, \`PATCH /orders/:id/status\` | \`kitchen\` |
| Transactions | \`GET /orders\`, \`GET /orders/export/transactions\` | \`transactions\` |
| Sales Report | \`GET /orders/sales-report\`, \`GET /orders/export/sales\` | \`sales-report\` |
| Order creation | \`POST /orders\` | Public kiosk endpoint |
| Single order | \`GET /orders/:id\` | Admin only |
| Coupons | \`GET/POST /coupons\`, \`GET/PUT/DELETE /coupons/:id\`, \`PATCH /coupons/:id/enable|disable\`, \`POST /coupons/:id/duplicate\` | \`coupons\` |
| Coupon validation | \`POST /coupons/validate\` | Public checkout endpoint |
| Staff | \`GET/POST /staff\`, \`PUT /staff/:id\`, \`PATCH /staff/:id/status|password\` | Admin only |

## Search, loading, and errors

The top-bar query clears on page navigation. It filters Products, Kitchen, Transactions, Sales Report, Staff, Categories, and generic Dashboard data; Coupons has its own status/type/sort controls rather than top-bar search integration. Data pages show a loading spinner during initial load and surface API failure messages with Retry where implemented. Form/API validation errors are shown in the relevant page/modal.

## Configuration and operational notes

The server uses MongoDB configuration, JWT access secret, \`SERVER_URL\`, Stripe keys, and environment mode. CORS allows local Admin (\`:4000\`), local kiosk (\`:5000\`), two listed Vercel origins, plus optional \`CLIENT_URL\`; credentialed cross-origin requests require an allowed origin. Product uploads are served from \`/uploads\`. The Admin API base URL comes from \`Admin/src/lib/api-config.ts\`.

## Clarifications needed before an AI assistant answers policy questions

1. Currency labels in Admin are USD, while the business/operating currency is not otherwise documented.
2. There is no settings page or settings API in the inspected Admin implementation.
3. No payment-status update workflow is exposed in Admin; order payment status is created with the kiosk order.
4. The product page does not currently expose customization editing controls despite the API/model supporting customizations; confirm intended operator workflow.
5. \`stackable\` coupon data is stored but no multi-coupon checkout behavior was found.
`;

export const KNOWLEDGE_BASE_JSON = `{
  "system": "POS Admin Panel",
  "auth": {"cookie": "admin_accessToken", "login": "/v1/admin/login", "me": "/v1/admin/me", "roles": ["admin", "staff"]},
  "permissions": ["kitchen", "products", "categories", "transactions", "sales-report", "coupons", "staff"],
  "role_rules": {"admin": "all permissions", "staff": "only assigned page permissions; Staff Management remains admin-only"},
  "features": [
    {"route":"/dashboard","name":"Dashboard","access":"admin","actions":["view calculated order/product summary"]},
    {"route":"/dashboard/kitchen","name":"Kitchen","access":"kitchen","actions":["view FIFO active queue","filter/search","advance allowed order status"]},
    {"route":"/dashboard/products","name":"Products","access":"products","actions":["list/search","create","edit","delete"],"required_create_fields":["image","name","price","category"]},
    {"route":"/dashboard/categories","name":"Categories","access":"categories","actions":["list/search","create","edit","delete"],"fields":["name","displayOrder"]},
    {"route":"/dashboard/transactions","name":"Transactions","access":"transactions","actions":["search","view detail","paginate","export csv/xlsx/pdf"]},
    {"route":"/dashboard/sales-report","name":"Sales Report","access":"sales-report","actions":["search","sort","paginate","export csv/xlsx/pdf"]},
    {"route":"/dashboard/coupons","name":"Coupons","access":"coupons","actions":["filter","sort","view","create","edit","enable/disable","duplicate","delete"]},
    {"route":"/dashboard/staff","name":"Staff Management","access":"admin","actions":["search","create","edit permissions","activate/deactivate","reset password"]}
  ],
  "order_status_transitions": {"received":["confirmed","cancelled"],"confirmed":["completed","preparing","cancelled"],"preparing":["completed","ready"],"ready":["completed"],"completed":[],"cancelled":[]},
  "important_restrictions": ["Server calculates order prices from products", "Coupon validation is public checkout behavior", "Coupon first-order/per-customer matching uses customer name", "Passwords and hashes are never returned", "Expired coupons fail validation even if status remains active"],
  "unknowns_to_confirm": ["operating currency", "settings workflow", "payment-status workflow", "product customization UI workflow", "meaning/use of stackable coupon flag"]
}
`;
