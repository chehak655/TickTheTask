# TaskFlow Mobile Application

Cross-platform mobile client built with React Native and Expo.

## Features
- Expo managed workflow
- React Navigation (Native Stack and Bottom Tabs)
- Encrypted JWT persistence via `expo-secure-store`
- Configured Axios client for FastAPI backend integration

## Setup & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   copy .env.example .env
   ```

3. **Start Development Server**:
   ```bash
   npx expo start
   ```

4. **Running on Devices**:
   - Press `a` to open in Android emulator / connected device
   - Press `i` to open in iOS simulator
   - Scan QR code with the **Expo Go** app on your physical iOS or Android device
