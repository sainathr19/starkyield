import MainLayout from "@/components/layout/MainLayout";

export default function History() {
  return (
    <MainLayout className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">History is coming soon</h1>
        <p className="text-sm text-gray-500">
          Previous pool-driven history data has been removed from the frontend.
        </p>
      </div>
    </MainLayout>
  );
}
