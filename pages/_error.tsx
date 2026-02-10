import { NextPageContext } from 'next';

interface ErrorProps {
  statusCode: number | undefined;
}

function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', backgroundColor: '#1a1a2e', color: '#ffffff' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          {statusCode || 'Error'}
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#a0a0b0', marginBottom: '2rem' }}>
          {statusCode === 404
            ? 'Page not found'
            : 'An unexpected error occurred'}
        </p>
        <a
          href="/"
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ffffff', color: '#1a1a2e', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '500' }}
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
