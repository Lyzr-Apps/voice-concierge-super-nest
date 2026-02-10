import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';

const HomeClient = dynamicImport(() => import('@/components/HomeClient'), { ssr: false });

export default function Page() {
  return <HomeClient />;
}
