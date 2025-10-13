# CLAUDE.md - SkillUp Teachers App

A modern React Native/Expo application for connecting students with teachers in Israel, featuring Hebrew language support and RTL layout.

---

## 📋 תוכן עניינים

1. [Project Overview](#project-overview)
2. [Quick Start Commands](#quick-start-commands)
3. [Project Structure](#project-structure)
4. [Core Technologies](#core-technologies)
5. [Teacher Interface](#teacher-interface)
6. [Student Interface](#student-interface)
7. [RTL Support](#rtl-support)
8. [Authentication Flow](#authentication-flow)
9. [Common Issues & Solutions](#common-issues--solutions)
10. [Development Guidelines](#development-guidelines)
11. [Testing Guide](#testing-guide)
12. [Deployment](#deployment)

---

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

## Additional Features & Updates

### Teacher Interface - Detailed Features

#### Dashboard Home
- **Notifications Banner**: Auto-rotating teacher alerts (10s interval)
- **Activity Stats Cards**:
  - Clean, minimal design
  - Right-aligned text (RTL)
  - No icons (professional look)
  - Consistent height (96px)
  - Subtle borders and shadows
- **Growth Chart**: 12-month revenue/lessons visualization with toggle

#### Calendar Features
- **Responsive Grid**: Dynamic cell sizing (minimum 44px)
- **Separated Layers**: Date numbers (top-right), lesson dots (bottom-center)
- **No Overlap**: Proper spacing between elements
- **Safe Area**: Proper padding on all devices
- **Accessibility**: Full labels and hints for screen readers

#### Navigation Enhancements
- **Dynamic Padding**: 12-34px based on device safe area
- **RTL Order**: Home | Calendar | Profile (right-to-left)
- **Shadow/Elevation**: Platform-specific depth effects
- **Min Height**: 64px for AA accessibility

### Authentication

The app uses Supabase Auth for user authentication:

**Login/Signup Flow**:
- Email/password authentication via Supabase
- Social logins: Apple (iOS), Google (cross-platform)
- Biometric authentication (Face ID / Touch ID) support
- Profile creation on signup with role selection (teacher/student)

**Role-based Access**:
- `role='teacher'` → Teacher interface (dashboard, calendar, profile)
- `role='student'` → Student interface (home, search, lessons, profile)
- Automatic routing based on user role after login

### RTL Implementation Details

**Key Patterns**:
```typescript
// Container with RTL flow
<View style={{ flexDirection: 'row-reverse', justifyContent: 'flex-start' }}>
  {/* flex-start = right side in row-reverse */}
</View>

// Text alignment (always use style, not prop)
<Typography style={{ textAlign: 'right' }}>Hebrew Text</Typography>

// Horizontal scrolling
<FlatList horizontal inverted={isRTL} data={items} />
```

**Common Mistakes to Avoid**:
- ❌ Using `align` prop on Typography components
- ❌ Using `justifyContent: 'flex-end'` with `row-reverse` (use `flex-start`)
- ❌ Forgetting `width: '100%'` on section titles
- ❌ Not using `inverted` on horizontal FlatLists

### Authentication Flow - Technical Details

**Login Process**:
1. User submits credentials
2. Double-tap prevention: `if (isLoading) return`
3. DEV check: `if (IS_DEV_MODE && isDevUser(email))`
4. Mock auth or Supabase auth
5. Profile fetch with role
6. `redirectPostLogin(profile)` function
7. Role-based navigation:
   - Teacher: `router.replace('/(teacher)')`
   - Student/Default: `router.replace('/(tabs)')`
8. Fallback on error: Always redirect to student interface

**Security Features**:
- Role verification in teacher layout guard
- Session validation on app resume
- Auto-logout on role mismatch
- Secure session storage (Supabase JWT or mock)

### Testing Checklist

#### Pre-Deployment Tests
- [ ] Login as teacher → correct interface
- [ ] Login as student → correct interface
- [ ] Wrong password → error alert
- [ ] Double-tap login → prevented
- [ ] Logout → returns to login
- [ ] Calendar responsive on all devices
- [ ] Nav bar safe area on iPhone X+
- [ ] RTL layout on all screens
- [ ] All tap targets ≥44px
- [ ] Dark mode (if enabled)

#### Device-Specific Tests
- **iPhone SE**: Min cells 44px, readable text
- **iPhone 14 Pro**: Proper safe area, ~48px cells
- **iPad**: Scales properly, maintains aspect ratio
- **Android**: Gesture bar spacing, elevation visible

### File Changes Summary

**New Files (16)**:
- Teacher app: 5 files (~1,100 lines)
- Data layer: 2 files (~340 lines)
- Components: 1 file (~200 lines)
- Documentation: 8+ files (~2,700 lines)

**Modified Files (6)**:
- `app/_layout.tsx`: +4 lines (teacher route)
- `app/index.tsx`: +30 lines (role routing)
- `src/lib/i18n.ts`: +8 lines (translations)
- `app/(auth)/login.tsx`: +70 lines (redirect + DEV UI)
- `src/features/auth/auth-context.tsx`: +50 lines (DEV support)
- `app/(teacher)/_layout.tsx`: Updated (safe area)

**Total Code**: ~2,800 lines
**Total Docs**: ~2,700 lines
**Linter Errors**: 0 ✅

---

## Troubleshooting Reference

### Issue: "DEV users not accessible"
**Solution**: Ensure `npm start` (not production build). Check `console.log('DEV:', __DEV__)`.

### Issue: "Calendar cells overlapping"
**Solution**: Verify `justifyContent: 'space-between'` in cell content and `alignSelf: 'flex-end'` for date.

### Issue: "Text not right-aligned in RTL"
**Solution**: Use `textAlign: 'right'` in style object, not `align` prop.

### Issue: "Nav bar stuck to bottom edge"
**Solution**: Check `useSafeAreaInsets()` returns correct values. Should be 0-34px.

### Issue: "Role redirect not working"
**Solution**: Verify `signIn()` returns profile object. Check console logs.

---

*This comprehensive documentation consolidates all implementation details, testing procedures, and troubleshooting guides for the SkillUp Teachers application. Keep this file updated as the project evolves.*