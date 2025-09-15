
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Lightbulb, 
  Network, 
  Palette, 
  Brain, 
  Rocket, 
  Users,
  ArrowRight 
} from 'lucide-react';
import { useI18n } from '@/components/providers/I18nProvider';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  React.useEffect(() => {
    if (user && !localStorage.getItem('luminet_onboarded')) {
      localStorage.setItem('luminet_onboarded', '1');
      navigate('/onboarding');
    }
  }, [user]);
  const { t } = useI18n();

  const features = [
    {
      icon: Lightbulb,
      title: 'Spark Ideas',
      description: 'Capture and visualize your creative thoughts as interactive nodes',
      color: 'bg-peach-100',
      action: () => navigate('/spark')
    },
    {
      icon: Network,
      title: 'Explore Networks',
      description: 'Discover connections between ideas in your thought mesh',
      color: 'bg-coral-100',
      action: () => navigate('/mesh')
    },
    {
      icon: Palette,
      title: 'Co-Create',
      description: 'Collaborate with others in real-time on the creative canvas',
      color: 'bg-mint-100',
      action: () => navigate('/canvas')
    },
    {
      icon: Brain,
      title: 'AI Assistant',
      description: 'Get personalized help expanding and structuring your ideas',
      color: 'bg-pink-100',
      action: () => navigate('/muse')
    },
    {
      icon: Rocket,
      title: 'Incubate Projects',
      description: 'Transform your ideas into structured, collaborative projects',
      color: 'bg-orange-grey-100',
      action: () => navigate('/incubator')
    },
    {
      icon: Users,
      title: 'Build Community',
      description: 'Connect with like-minded creators and collaborators',
      color: 'bg-cream-100',
      action: () => navigate('/mesh')
    }
  ];

  return (
    <Layout>
      <div className="page-content">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-heading">
            {t('landing.title')}
          </h1>
          <p className="text-xl text-body max-w-3xl mx-auto mb-8 leading-relaxed">
            {t('landing.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Button
              onClick={() => navigate('/spark')}
              className="btn-primary px-8 py-4 text-lg"
            >
              {t('landing.cta.start')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => navigate('/mesh')}
              className="btn-secondary px-8 py-4 text-lg"
            >
              {t('landing.cta.explore')}
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={index} 
                className="card card-hover group"
                onClick={feature.action}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110`}>
                    <IconComponent className="w-6 h-6 text-heading" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-heading group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-body leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-4 text-primary flex items-center group-hover:translate-x-1 transition-transform">
                    <span className="text-sm font-medium">Learn more</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <div className="bg-peach-100 rounded-2xl p-8 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-heading">
              Ready to Transform Your Ideas?
            </h2>
            <p className="text-body mb-6">
              Join thousands of creators building networks of inspiration
            </p>
            <Button
              onClick={() => navigate('/spark')}
              className="btn-primary px-8 py-4 text-lg"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
