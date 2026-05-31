# React Native Conversion - Quick Reference

## Key Conversion Map

### HTML to React Native

| Web (HTML/Tailwind) | React Native | Example |
|---|---|---|
| `<div>` | `<View>` | `<View style={styles.container}>` |
| `<button>` | `<TouchableOpacity>` | `<TouchableOpacity onPress={handlePress}>` |
| `<input>` | `<TextInput>` | `<TextInput placeholder="..." />` |
| `<span>, <p>, <h1-h6>` | `<Text>` | `<Text style={styles.text}>` |
| `className="..."` | `style={styles.xxx}` | StyleSheet-based styling |
| `onClick` | `onPress` | `onPress={() => {}}` |
| `<form onSubmit>` | `<View>` + Button press | Handle in TouchableOpacity |

### Styling Conversions

| Tailwind | React Native | Example |
|---|---|---|
| `flex flex-row` | `flexDirection: 'row'` | |
| `gap-4` | `gap: 16` | |
| `p-4` | `padding: 16` | |
| `rounded-2xl` | `borderRadius: 16` | |
| `bg-white` | `backgroundColor: '#fff'` | |
| `text-sm` | `fontSize: 14` | |
| `overflow-x-auto` | `<ScrollView horizontal>` | |
| `absolute inset-0` | `position: 'absolute', inset: 0` | |

### Icon Conversions

**Before (Web):**
```jsx
import { Zap } from 'lucide-react';
<Zap size={24} className="text-orange-500" />
```

**After (React Native):**
```jsx
import { Zap } from 'lucide-react-native';
<Zap size={24} color="#f59e0b" strokeWidth={1.5} />
```

## Common Patterns

### Button with Icon
```jsx
<TouchableOpacity
  style={[styles.btn, styles.btnPrimary]}
  onPress={() => setModal('recharge')}
>
  <Plus size={14} color="#fff" />
  <Text style={styles.btnText}>Recharge</Text>
</TouchableOpacity>
```

### Scrollable List
```jsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  style={styles.promotionsList}
>
  {/* Items */}
</ScrollView>
```

### Modal
```jsx
<Modal
  visible={modal === 'recharge'}
  transparent
  animationType="fade"
  onRequestClose={() => setModal(null)}
>
  <View style={styles.modalBackdrop}>
    {/* Modal content */}
  </View>
</Modal>
```

### Conditional Styling
```jsx
<Text style={[
  styles.baseText,
  { color: activeTab === 'home' ? '#f97316' : '#cbd5e1' }
]}>
  Home
</Text>
```

## Color Palette

```javascript
// Primary Colors
primary: '#f97316'      // Orange
dark: '#1e293b'         // Slate-900
light: '#f1f5f9'        // Slate-50

// Status Colors
success: '#22c55e'      // Green
error: '#ef4444'        // Red
info: '#1e40af'         // Blue
warning: '#eab308'      // Yellow

// Neutral Colors
gray50: '#f9fafb'
gray100: '#f3f4f6'
gray400: '#9ca3af'
gray600: '#4b5563'
```

## REST Auth Configuration

The mobile app uses the fixed REST auth endpoint and stores the auth token locally in AsyncStorage. No legacy auth configuration is required.

- API URL: `https://rest.webticksa.co.za/api/link/auth`
- Token storage key: `auth_token`
- Device identifier: stored MAC address

## State Management Pattern

```typescript
// Read-only state access
const [value, setValue] = useState(initialValue);

// Async operations
const handleAction = async () => {
  setLoading(true);
  try {
    // Async work
    setValue(newValue);
  } catch (error) {
    notify('Error message', 'error');
  } finally {
    setLoading(false);
  }
};
```

## Common Issues & Solutions

### Problem: Text not wrapping
```jsx
// Solution:
<Text style={{ flex: 1 }}>Long text...</Text>
```

### Problem: Icon color not applying
```jsx
// Solution: Use color prop, not className
<Icon color="#f59e0b" />  // ✓ Correct
// NOT: <Icon className="text-orange-500" />  // ✗ Wrong
```

### Problem: Button not responding
```jsx
// Solution: Use TouchableOpacity or Pressable
<TouchableOpacity onPress={handler}>  // ✓ Correct
// NOT: <Button onPress={handler} />  // ✗ Limited styling
```

### Problem: Modal not visible
```jsx
// Solution: Ensure Modal is rendered AND visible prop is true
<Modal visible={modal === 'name'} transparent>
  {/* Content */}
</Modal>
```

## File Locations

- **Main Component**: `components/asher-link-app.tsx`
- **Home Screen**: `app/(tabs)/index.tsx`
- **Documentation**: `REACT_NATIVE_CONVERSION.md`

## Development Commands

```bash
# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web

# List installed packages
npm list

# Add new package
npm install package-name --save

# Update AsyncStorage data
async function setData(key, value) {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error(e);
  }
}
```

## Performance Tips

1. Use `StyleSheet.create()` outside components
2. Memoize expensive functions with `useCallback()`
3. Use `FlatList` for long lists instead of `ScrollView`
4. Minimize inline object creation in styles
5. Use `React.memo()` for child components if needed
6. Profile with React DevTools

## Testing Tips

1. Test on actual device for best experience
2. Test modals with different screen sizes
3. Verify REST auth flow
4. Check AsyncStorage persistence across app restarts
5. Test network calls with slow/offline conditions

