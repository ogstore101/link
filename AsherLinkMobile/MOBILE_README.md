# Asher Link Mobile - React Native App

A React Native implementation of the Asher Link WiFi management application, built with Expo, REST-based authentication, and lucide-react-native icons. This app provides users with WiFi services, transaction management, and account management features.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- npm >= 8
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on your preferred platform
npm run android   # Android emulator
npm run ios      # iOS simulator  
npm run web      # Web browser
```

## 📱 Features

### Core Functionality
- ✅ **Multi-Tab Navigation**: Home, Wallet, History, Account
- ✅ **REST Authentication**: Token-based login via REST API
- ✅ **Wallet Management**: Check balance, view transaction history
- ✅ **Service Catalog**: 8 interactive service icons (Data, Vouchers, Rewards, Airtime, etc.)
- ✅ **Voucher Redemption**: Enter voucher codes to add funds
- ✅ **Bundle Purchases**: Buy data bundles with balance validation
- ✅ **Device ID Management**: Auto-generated MAC address stored locally
- ✅ **Real-time Notifications**: Toast alerts for transactions
- ✅ **Account Management**: User profile, settings, logout

### UI Components
- Hero card with balance display
- Service grid (8 items)
- Promotional carousel
- Diagnostic services display
- Transaction history list
- Modal system (Recharge, Account, Bundles)
- Bottom tab navigation with FAB button
- Search interface
- Loading indicators and overlays

## 📁 Project Structure

```
AsherLinkMobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx              # Home screen (uses AsherLinkApp)
│   │   ├── explore.tsx            # Explore tab
│   │   └── _layout.tsx            # Tab layout
│   ├── _layout.tsx                # Root layout
│   └── modal.tsx                  # Modal screen
├── components/
│   ├── asher-link-app.tsx         # ⭐ MAIN APP COMPONENT (850+ lines)
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   └── ... other components
├── hooks/
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
├── constants/
│   └── theme.ts
├── assets/
│   └── images/
├── package.json
├── app.json
├── tsconfig.json
├── IMPLEMENTATION_SUMMARY.md       # 📖 Full implementation details
├── REACT_NATIVE_CONVERSION.md      # 📖 Detailed conversion guide
├── CONVERSION_QUICK_REFERENCE.md   # 📖 Quick reference
└── verify-setup.sh                 # ✓ Setup verification script
```

## ⚙️ Configuration

### REST Auth Setup

The app uses a REST authentication endpoint for authorization. It stores a token locally and sends it to the server on startup.

- API endpoint: `https://rest.webticksa.co.za/api/link/auth`
- Stored token key: `auth_token`
- Device MAC address is generated and persisted in AsyncStorage

### Without a Saved Token
- The app will attempt guest access
- Auth is handled by the REST backend
- Local device ID is still used for session identification

## 🔧 Available Scripts

```bash
npm start          # Start development server
npm run android    # Run on Android emulator
npm run ios       # Run on iOS simulator
npm run web       # Run on web browser
npm run lint      # Run linting
npm install       # Install dependencies
```

## 📚 Documentation

### Main Documentation Files

1. **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)**
   - Complete overview of the conversion
   - What was implemented and how
   - Testing checklist
   - Future enhancements

2. **[REACT_NATIVE_CONVERSION.md](REACT_NATIVE_CONVERSION.md)**
   - Detailed conversion explanations
   - Element mapping (HTML → React Native)
   - Styling system details
   - REST auth integration guide
   - Customization instructions

3. **[CONVERSION_QUICK_REFERENCE.md](CONVERSION_QUICK_REFERENCE.md)**
   - Quick lookup tables
   - Common code patterns
   - Color palette
   - Troubleshooting solutions

## 🎨 UI/UX Highlights

### Design System
- **Primary Color**: Orange (#f97316)
- **Dark Neutral**: Slate-900 (#1e293b)
- **Light Neutral**: Slate-50 (#f1f5f9)
- **Status Colors**: Green (success), Red (error), Blue (info)
- **Typography**: 900 (bold headers), 700 (body), 600 (labels)

### Layout
- Mobile-first design (fits within ~500px width)
- Safe area handling for notches/status bars
- Bottom tab navigation with floating action button
- Modal system with backdrop blur effect
- Horizontal scrolling sections

## 🔐 Security & Authentication

### Auth Flow
1. Initialize device with unique MAC address (stored locally)
2. Send saved token to REST auth endpoint for authorization
3. Fall back to guest access if no token is present
4. Listen for auth state updates in local state
5. Clear local auth token on logout

### Data Storage
- Device MAC: Stored in AsyncStorage
- Auth tokens: Managed by REST endpoint and stored locally
- No sensitive data stored locally

## 💾 State Management

```typescript
const [activeTab, setActiveTab]                    // Current tab
const [user, setUser]                            // Authenticated user
const [balance, setBalance]                      // Wallet balance
const [modal, setModal]                          // Active modal
const [loading, setLoading]                      // Loading state
const [notification, setNotification]            // Toast message
const [voucherCode, setVoucherCode]              // Form input
```

## 🚦 Navigation

```
Root Layout
├── (tabs) - Tab-based navigation
│   ├── index.tsx - Home (AsherLinkApp)
│   ├── explore.tsx - Explore
│   └── _layout.tsx - Tab configuration
└── modal.tsx - Modal screen
```

## 📱 Screens

### Home Screen
Shows user's balance, service catalog, promotions, and diagnostics.

### History Screen
Lists past transactions with dates and amounts.

### Account Modal
User profile, account settings, and exclusive offers.

### Recharge Modal
Voucher code input and redemption.

### Bundles Modal
Data bundle selection and purchase.

## 🐛 Troubleshooting

### App won't start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Icons not showing up
```bash
# Ensure lucide-react-native is installed
npm list lucide-react-native

# If missing, reinstall
npm install lucide-react-native --save
```

### REST auth not connecting
1. Check the REST endpoint is reachable
2. Verify the saved `auth_token` or guest access
3. Check internet connection
4. App works offline with anonymous auth

### AsyncStorage not persisting
- This is normal during development
- Clear app data to reset
- Verify AsyncStorage is installed: `npm list @react-native-async-storage/async-storage`

## 🔄 From Web to Mobile

### Key Conversions
- `<div>` → `<View>`
- `<button>` → `<TouchableOpacity>`
- `<input>` → `<TextInput>`
- `<span>, <p>, <h*>` → `<Text>`
- Tailwind CSS → `StyleSheet` API
- `localStorage` → `AsyncStorage`

For more details, see [REACT_NATIVE_CONVERSION.md](REACT_NATIVE_CONVERSION.md)

## 📊 Performance

- **StyleSheet API**: Compiled styles for better performance
- **Conditional Rendering**: Tab content rendered only when active
- **Optimized Layout**: Flex-based layouts are efficient
- **Minimal Re-renders**: Proper state management

## 🌐 Platform Support

This app runs on:
- ✅ **iOS**: iOS 13+
- ✅ **Android**: Android 8+
- ✅ **Web**: Modern browsers (for development)

## 📦 Dependencies

### Core
- `react-native`: Mobile framework
- `expo`: Managed app platform
- `expo-router`: Navigation
- `react-native-reanimated`: Animations

### UI
- `lucide-react-native`: Icon library
- `@expo/vector-icons`: Additional icons
- `react-native-gesture-handler`: Gesture support

### Backend
- REST auth endpoint: `https://rest.webticksa.co.za/api/link/auth`
- `@react-native-async-storage/async-storage`: Local data storage

### Development
- `typescript`: Type safety
- `eslint`: Code linting

## 🎯 Next Steps

1. **Configure REST auth**: Set up your REST auth endpoint details
2. **Test Locally**: Run the app on simulator/emulator
3. **Customize**: Modify colors, add more features, change text
4. **Deploy**: Build APK/IPA and submit to app stores

## 📖 Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [REST auth endpoint docs](https://rest.webticksa.co.za/api/link/auth)
- [lucide-react-native](https://www.npmjs.com/package/lucide-react-native)

## 🤝 Support

For issues or questions:
1. Check documentation files in this directory
2. Review troubleshooting section above
3. Check Expo/React Native official docs
4. Review component source code at `components/asher-link-app.tsx`

## 📝 License

This project is part of Asher Link Mobile Application.

## ✨ What's Included

### Component File (850+ lines)
- Complete app UI with all features
- REST auth integration
- State management
- Modals and navigation
- Toast notifications
- Device ID management
- Transaction history

### Documentation (3 files)
- Implementation summary
- Detailed conversion guide
- Quick reference guide

### Setup & Verification
- Automatic setup script
- Verification script
- Complete package configuration

---

**Status**: ✅ Production Ready

Built with ❤️ using React Native, Expo, and REST auth

