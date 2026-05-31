import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';

export default function OfferCard({ offer }) {
  return (
    <View className="mb-4 rounded-3xl bg-slate-950 p-4 shadow-sm shadow-black/10">
      <View className="flex-row items-center gap-2">
        <View className="rounded-full bg-purple-500 p-2">
          <Star color="#fff" size={14} />
        </View>
        <Text className="text-base font-semibold text-white">{offer.title || offer.name || 'Special offer'}</Text>
      </View>
      <Text className="mt-3 text-sm leading-6 text-slate-400">{offer.description || 'Limited-time promotion available now.'}</Text>
      <TouchableOpacity
        className="mt-4 rounded-full bg-slate-800 px-4 py-3"
        activeOpacity={0.8}
        onPress={() => {
          if (offer.link) {
            // In React Native, Linking.openURL can be added if desired.
          }
        }}
      >
        <Text className="text-sm font-semibold uppercase text-white">{offer.cta || 'View offer'}</Text>
      </TouchableOpacity>
    </View>
  );
}
