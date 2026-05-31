import React from 'react';
import { View, Text } from 'react-native';

const colors = {
  success: 'bg-emerald-500 border-emerald-300',
  error: 'bg-rose-500 border-rose-300',
  info: 'bg-sky-500 border-sky-300'
};

export default function NotificationToast({ message, type = 'info' }) {
  return (
    <View className={`absolute bottom-6 left-4 right-4 rounded-3xl border px-4 py-3 ${colors[type]}`}>
      <Text className="text-sm font-semibold text-white">{message}</Text>
    </View>
  );
}
