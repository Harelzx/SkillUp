# CLAUDE.md - SkillUp Teachers App

A modern React Native/Expo application for connecting students with teachers in Israel, featuring Hebrew language support and RTL layout.

## Project Overview

**SkillUp Teachers** is a mobile application built with Expo SDK 54 that connects students with private tutors. The app supports Hebrew language with full RTL (Right-to-Left) layout and includes features for finding teachers, booking lessons, managing profiles, and handling payments.

### Core Technologies
- **Framework**: Expo SDK 54 with React Native
- **Navigation**: Expo Router (file-based routing)
- **UI Library**: Gluestack UI + NativeWind (Tailwind CSS)
- **Backend**: Supabase (authentication, database, storage)
- **State Management**: TanStack Query + Zustand
- **Payments**: Stripe Connect
- **Internationalization**: i18next with Hebrew/English support
- **Icons**: Lucide React Native

## Quick Start Commands

### Development
```bash
# Start development server
npm start
# or
npx expo start

# Start with cache cleared
npx expo start --clear

# Run on specific platforms
npx expo run:ios
npx expo run:android
```

### Building
```bash
# Prepare for native build (generates iOS/Android folders)
npx expo prebuild

# Clean prebuild
npx expo prebuild --clean

# Production builds with EAS
eas build --platform ios
eas build --platform android
```

### Type Checking & Linting
```bash
npm run type-check
npm run lint
```

## Project Structure

```
/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── src/                   # Source code
│   ├── context/           # React contexts (RTL, etc.)
│   ├── services/          # API services
│   ├── theme/             # Design system
│   ├── types/             # TypeScript definitions
│   └── utils/             # Utility functions
├── ui/                    # UI component library
├── assets/                # Static assets
└── locales/               # Translation files
```

## Key Features & Implementation Notes

### RTL (Right-to-Left) Support
- **Context**: `src/context/RTLContext.tsx` provides RTL state management
- **Usage**: Components use `useRTL()` hook for layout direction
- **Implementation**: FlexDirection and text alignment automatically adjust

### Navigation Structure
- **Tab Navigation**: Home, Search, Lessons, Profile
- **File-based routing**: Each file in `app/` becomes a route
- **Hebrew labels**: All navigation uses i18next translations

### Profile Screen (`app/(tabs)/profile.tsx`)
- **Design**: Clean, modern vertical layout
- **User Data**: Name, phone, bio, avatar from Unsplash
- **Menu Structure**: Single unified card with all settings
- **RTL Support**: Icons and layout adapt to Hebrew reading direction

### Authentication Flow
- **Supabase Auth**: Email/password and social login
- **Route Protection**: Redirects unauthenticated users to login
- **User Types**: Students and Teachers with different app experiences

## Common Issues & Solutions

### TypeScript Image Styling
```tsx
// Issue: Image style type conflicts
<Image style={styles.avatarImage as any} />
// Solution: Use type assertion for ImageStyle compatibility
```

### Missing Assets for Build
```bash
# If prebuild fails due to missing notification-icon.png:
cp assets/icon.png assets/notification-icon.png
```

### RTL Layout Debugging
```tsx
// Use RTL context for conditional layout
const { getFlexDirection, isRTL } = useRTL();
<View style={{ flexDirection: getFlexDirection() }}>
```

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **Styling**: Gluestack UI components + custom styles
- **Translations**: All user-facing text through i18next

### RTL Best Practices
- Always use `getFlexDirection()` for layout containers
- Test both Hebrew and English layouts
- Icons may need horizontal flip: `scaleX: isRTL ? -1 : 1`
- Text alignment should respect reading direction

### File Naming
- **Pages**: kebab-case (e.g., `teacher-profile.tsx`)
- **Components**: PascalCase (e.g., `UserCard.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)

### State Management
- **Server State**: TanStack Query for API data
- **Client State**: Zustand stores for app state
- **Component State**: useState/useReducer for local state

## App Configuration

### Bundle Identifiers
- **iOS**: `com.skillup.teachers`
- **Android**: `com.skillup.teachers`

### Required Permissions
- **Calendar**: Read/write for lesson scheduling
- **Camera**: Profile photo capture
- **Photo Library**: Image selection
- **Face ID**: Biometric authentication

### Environment Variables
Create `.env` file with:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## Debugging & Testing

### Common Debug Commands
```bash
# View Metro bundler logs
npx expo start --dev-client

# Clear all caches
npx expo start --clear
rm -rf node_modules && npm install

# Reset Expo cache
npx expo install --fix
```

### Testing on Device
- **iOS**: Use Expo Go app or development build
- **Android**: Use Expo Go app or development build
- **Physical Device**: Recommended for testing RTL layouts

## Deployment Checklist

1. **Assets**: Ensure all required icons and splash screens exist
2. **Translations**: Complete Hebrew and English translations
3. **RTL Testing**: Verify layout in both directions
4. **Build**: Run `npx expo prebuild` successfully
5. **Environment**: Set production environment variables
6. **Store Listings**: Prepare Hebrew and English app store descriptions

---

*This documentation was generated for Claude Code instances working on the SkillUp Teachers application. Keep this file updated as the project evolves.*