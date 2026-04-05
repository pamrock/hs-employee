# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 frontend application for a service management system with an employee-facing interface. It's built with Vite, Vue 3, Element Plus UI library, and Vue Router. The application provides a mobile-friendly employee interface for managing orders and employee profiles.

## Development Commands

- `yarn dev` - Start development server with hot reload
- `yarn build` - Build for production
- `yarn preview` - Preview production build locally

## Architecture

### Tech Stack
- **Vue 3** with Composition API (`<script setup>` syntax)
- **Vite** as build tool and dev server
- **Element Plus** UI component library with icons
- **Vue Router 4** for routing with hash-based history
- **Axios** for HTTP requests with interceptors
- **LocalStorage** for token management

### Project Structure
```
src/
├── api/           # API service modules (login.js, user.js, order.js, etc.)
├── assets/        # Static assets (CSS, images)
├── components/    # Reusable Vue components
├── router/        # Vue Router configuration
├── utils/         # Utilities (request.js, auth.js)
├── views/         # Page components
│   └── employee/  # Employee-facing pages
│       ├── layout.vue    # Main layout with bottom tab bar
│       ├── login.vue     # Login page
│       ├── register.vue  # Registration page
│       ├── orders.vue    # Employee orders management
│       └── profile.vue   # Employee profile
├── App.vue        # Root component
└── main.js        # Application entry point
```

### Key Architectural Patterns

1. **Dual Token System**: The application manages two types of tokens:
   - `admin_token` for admin/management interfaces
   - `employee_token` for employee-facing interfaces
   - Tokens are stored in localStorage and automatically attached to requests based on route path

2. **API Layer**: All API calls are centralized in the `src/api/` directory with dedicated modules for each resource (user, order, etc.). The `request.js` utility handles:
   - Base URL configuration (dev: `/api`, prod: `https://admint.pamrock.top/api`)
   - Request/response interceptors
   - Automatic token injection based on route prefix (`/employee` routes use employee_token)
   - Error handling and token expiration redirects

3. **Routing**: Uses Vue Router with a hash-based history. Routes are defined in `src/router/index.js`:
   - `/employee/login` - Employee login
   - `/employee/register` - Employee registration
   - `/employee/orders` - Employee orders (default employee route)
   - `/employee/profile` - Employee profile
   - All employee routes are nested under `/employee` with a layout containing a bottom tab bar

4. **Mobile-First Design**: The user interface is optimized for mobile with:
   - Bottom tab navigation (two tabs: Orders, Profile)
   - Responsive layouts using flexbox
   - Touch-friendly components
   - Full viewport height containers

### Development Configuration

- **Vite Proxy**: Development server proxies `/api` requests to `https://admint.pamrock.top` with `secure: false`
- **Path Aliases**: `@` maps to `./src` directory
- **CSS**: Uses Element Plus CSS and custom styles in `src/assets/`
- **Environment**: Development vs production API base URLs are configured in `src/utils/request.js`

### Authentication Flow

1. **Login/Register**: Employees authenticate via `/employee/login` or `/employee/register`
2. **Token Storage**: Successful authentication stores `employee_token` in localStorage
3. **Request Interception**: `request.js` automatically adds `Authorization: Bearer <token>` header for `/employee` routes
4. **Token Validation**: `auth.js` provides `isTokenExpired()` function that calls backend validation
5. **Expiration Handling**: 401/403 responses trigger token removal and redirect to login

### Component Patterns

- **Layout Components**: `src/views/employee/layout.vue` provides the main employee interface with bottom tab bar (two tabs)
- **Page Components**: Each route has a corresponding Vue component in `src/views/employee/`
- **API Integration**: Pages import and use API functions from `src/api/` modules

### Employee-Specific Features

1. **Order Management**:
   - View assigned orders (status: 3 - 已派单)
   - Start service (changes status to 4 - 服务中)
   - Cancel service (changes status to 6 - 已取消)
   - View order details with customer information

2. **Profile Management**:
   - View and edit personal information
   - Change password
   - Logout functionality

### Styling Approach

- **Element Plus**: Primary UI component library with built-in styles
- **Custom CSS**: Scoped styles in Vue components using `<style scoped>`
- **Global Styles**: `src/assets/main.css` for global styles
- **Mobile Optimization**: Uses `100dvh` for viewport height, hidden scrollbars, and touch-friendly sizing

## Important Notes

- The application uses **hash-based routing** (`createWebHashHistory`) which affects how URLs are structured
- **Dual token system** means authentication logic depends on whether the current route starts with `/employee`
- **Production API** is at `https://admint.pamrock.top/api` while development uses proxy to same endpoint
- **Error code 1020** is treated specially as a server error that doesn't trigger token expiration
- **Form data uploads** are handled with `FormData` for file uploads (see `updateUserBySelf` in `user.js`)

## VS Code Configuration

- **Volar extension** is required for Vue 3 development
- **File nesting** is enabled for common configuration files (package.json, vite.config.*, etc.)