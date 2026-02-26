import MainLayout from '@/components/layout/MainLayout';
import LandingPage from '@/features/landing/LandingPage';

export default function Home() {
  return (
    <MainLayout className='px-4 sm:px-6 lg:px-8'>
      <LandingPage />
    </MainLayout>
  );
}
