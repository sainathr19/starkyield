"use client";

import MainLayout from "@/components/layout/MainLayout";

export default function PoolDetailPage() {
  return (
    <MainLayout className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">Pool details unavailable</h1>
        <p className="text-sm text-gray-500">
          Pool-specific flows are temporarily disabled during the staking migration.
        </p>
      </div>
    </MainLayout>
  );
}
