#!/bin/bash

# Asher Link Mobile - React Native Conversion Verification Script
# This script verifies that all components are properly set up

echo "=========================================="
echo "Asher Link Mobile - Verification Script"
echo "=========================================="
echo ""

# Check Node.js
echo "✓ Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "  Node.js: $NODE_VERSION"
else
    echo "  ✗ Node.js not found!"
    exit 1
fi

# Check npm
echo "✓ Checking npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "  npm: $NPM_VERSION"
else
    echo "  ✗ npm not found!"
    exit 1
fi

echo ""
echo "=========================================="
echo "Checking Project Structure"
echo "=========================================="
echo ""

# Check key files
FILES_TO_CHECK=(
    "components/asher-link-app.tsx"
    "app/_layout.tsx"
    "app/(tabs)/index.tsx"
    "package.json"
    "tsconfig.json"
    "REACT_NATIVE_CONVERSION.md"
    "CONVERSION_QUICK_REFERENCE.md"
    "IMPLEMENTATION_SUMMARY.md"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ Found: $file"
    else
        echo "✗ Missing: $file"
    fi
done

echo ""
echo "=========================================="
echo "Checking Dependencies"
echo "=========================================="
echo ""

# Check package.json for required dependencies
echo "✓ Checking package.json for required packages..."

if grep -q '"firebase"' package.json; then
    echo "  ✓ Firebase found"
else
    echo "  ✗ Firebase not found in package.json"
fi

if grep -q '"@react-native-async-storage/async-storage"' package.json; then
    echo "  ✓ AsyncStorage found"
else
    echo "  ✗ AsyncStorage not found in package.json"
fi

if grep -q '"lucide-react-native"' package.json; then
    echo "  ✓ lucide-react-native found"
else
    echo "  ✗ lucide-react-native not found in package.json"
fi

if grep -q '"react-native"' package.json; then
    echo "  ✓ React Native found"
else
    echo "  ✗ React Native not found in package.json"
fi

if grep -q '"expo-router"' package.json; then
    echo "  ✓ Expo Router found"
else
    echo "  ✗ Expo Router not found in package.json"
fi

echo ""
echo "=========================================="
echo "Checking Main Component"
echo "=========================================="
echo ""

# Check asher-link-app.tsx for key elements
if [ -f "components/asher-link-app.tsx" ]; then
    echo "✓ Checking AsherLinkApp component..."
    
    # Check for imports
    if grep -q "View" components/asher-link-app.tsx; then
        echo "  ✓ React Native imports found"
    fi
    
    if grep -q "lucide-react-native" components/asher-link-app.tsx; then
        echo "  ✓ lucide-react-native imports found"
    fi
    
    if grep -q "firebase" components/asher-link-app.tsx; then
        echo "  ✓ Firebase imports found"
    fi
    
    if grep -q "AsyncStorage" components/asher-link-app.tsx; then
        echo "  ✓ AsyncStorage imports found"
    fi
    
    # Check for key functions
    if grep -q "renderHomeTab" components/asher-link-app.tsx; then
        echo "  ✓ Home tab implementation found"
    fi
    
    if grep -q "renderHistoryTab" components/asher-link-app.tsx; then
        echo "  ✓ History tab implementation found"
    fi
    
    if grep -q "handleRecharge" components/asher-link-app.tsx; then
        echo "  ✓ Recharge handler found"
    fi
    
    if grep -q "StyleSheet.create" components/asher-link-app.tsx; then
        echo "  ✓ StyleSheet styles found"
    fi
fi

echo ""
echo "=========================================="
echo "Checking Entry Point"
echo "=========================================="
echo ""

if [ -f "app/(tabs)/index.tsx" ]; then
    echo "✓ Checking entry point (index.tsx)..."
    
    if grep -q "AsherLinkApp" "app/(tabs)/index.tsx"; then
        echo "  ✓ AsherLinkApp import found"
    fi
    
    if grep -q "export default function HomeScreen" "app/(tabs)/index.tsx"; then
        echo "  ✓ HomeScreen export found"
    fi
fi

echo ""
echo "=========================================="
echo "npm Modules Status"
echo "=========================================="
echo ""

if [ -d "node_modules" ]; then
    echo "✓ node_modules directory found"
    MODULE_COUNT=$(ls -1 node_modules | wc -l)
    echo "  Installed modules: $MODULE_COUNT"
else
    echo "✗ node_modules directory not found"
    echo "  Run 'npm install' to install dependencies"
fi

echo ""
echo "=========================================="
echo "Verification Complete!"
echo "=========================================="
echo ""

echo "Next Steps:"
echo "1. Run 'npm install' if you haven't already"
echo "2. Run 'npm start' to start the development server"
echo "3. Select your platform (Android/iOS/Web)"
echo ""
echo "Environment Variables (Optional):"
echo "  export __firebase_config='{...}'"
echo "  export __app_id='asher-link-mobile'"
echo "  export __initial_auth_token='your-token'"
echo ""
echo "For more information, see:"
echo "  - IMPLEMENTATION_SUMMARY.md"
echo "  - REACT_NATIVE_CONVERSION.md"
echo "  - CONVERSION_QUICK_REFERENCE.md"
echo ""
