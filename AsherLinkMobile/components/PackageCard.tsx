import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

export default function PackageCard({ pkg, onPurchase }) {
  return (
    <View className="mb-4 rounded-3xl border border-slate-800 bg-slate-950 p-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-semibold text-white">{pkg.name}</Text>
          <Text className="mt-1 text-sm text-slate-400">{pkg.description || pkg.name}</Text>
        </View>
        <Text className="text-xl font-bold text-white">R {pkg.price || '0.00'}</Text>
      </View>
      <Text className="mt-3 text-sm text-slate-500">{pkg.validity || 'Valid for 24 hours'}</Text>
      <TouchableOpacity
        className="mt-4 flex-row items-center justify-center rounded-full bg-purple-500 py-3"
        activeOpacity={0.8}
        onPress={() => onPurchase(pkg.name)}
      >
        <CheckCircle2 color="#fff" size={18} />
        <Text className="ml-2 text-sm font-bold uppercase text-white">Buy package</Text>
      </TouchableOpacity>
    </View>
  );
}
