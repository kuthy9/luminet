
import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-8xl font-bold text-coral-200 mb-4">404</h1>
            <h2 className="text-3xl font-semibold text-heading mb-4">
              Page Not Found
            </h2>
            <p className="text-xl text-muted max-w-md mx-auto">
              The page you're looking for seems to have wandered off into the creative ether.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="border-warm-200 hover:border-coral-300 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="bg-coral-500 hover:bg-coral-600 text-white flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
