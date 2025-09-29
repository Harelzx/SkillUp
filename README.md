# SkillUp Teachers Marketplace

A production-grade React Native teachers marketplace app built with Expo SDK 54, featuring search, booking, payments with escrow-like delayed payouts, and full Hebrew/RTL support.

## Tech Stack

- **Framework**: Expo SDK 54 with React Native 0.81
- **Navigation**: Expo Router (file-based routing)
- **UI**: Custom component library with Tailwind CSS (NativeWind)
- **State**: TanStack Query + Zustand
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **Payments**: Stripe Connect with manual payouts
- **Forms**: React Hook Form + Zod validation
- **i18n**: react-i18next with RTL support
- **Calendar**: react-native-calendars
- **Notifications**: expo-notifications

## Project Structure

```
app/                    # Expo Router navigation
  (public)/            # Public routes (home, teacher profiles)
  (auth)/              # Authentication screens
  (booking)/           # Booking flow
  (account)/           # User account management

src/
  api/                 # API calls and Supabase queries
  components/          # Shared components
  features/            # Feature modules
  hooks/               # Custom hooks
  lib/                 # Core utilities (Supabase, i18n, etc.)
  state/               # Zustand stores
  theme/               # Tailwind config and global styles
  ui/                  # Core UI components
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key
```

### 3. Set Up Supabase

1. Create a new Supabase project
2. Run the database migrations (see `/supabase/migrations`)
3. Enable Row Level Security on all tables
4. Set up Edge Functions for payment processing

### 4. Configure Stripe

1. Create a Stripe account and enable Connect
2. Set up webhook endpoints for payment events
3. Configure manual payout schedule for escrow-like functionality

## Development

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Type checking
npm run type-check

# Linting
npm run lint
```

## Features

### Core Functionality
- ✅ Teacher search and filtering
- ✅ Teacher profiles with ratings and reviews
- ✅ Availability management and booking
- ✅ Secure payment processing with escrow
- ✅ Push and local notifications
- ✅ Calendar integration
- ✅ Multi-language support (Hebrew/English)
- ✅ Full RTL support

### User Roles
- **Students**: Search teachers, book lessons, make payments, leave reviews
- **Teachers**: Manage profile, set availability, receive payments, view bookings

### Security
- Row Level Security (RLS) on all database tables
- Secure payment processing through Stripe
- JWT-based authentication with Supabase Auth
- Input validation with Zod schemas

## Deployment

### Build for Production

```bash
# Create a production build
npx expo prebuild

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Over-the-Air Updates

```bash
eas update --branch production
```

## API Documentation

See `/docs/api.md` for detailed API documentation.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.