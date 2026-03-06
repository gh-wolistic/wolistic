import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OpenAuthButton } from '@/components/auth/OpenAuthButton';
import {
  Building2,
  Users,
  Heart,
  Brain,
  Activity,
  TrendingUp,
  CheckCircle2,
  Target,
  Sparkles,
  BarChart3,
  Headphones,
  Award
} from 'lucide-react';
import { ImageWithFallback } from '@/components/public/ImageWithFallback';

export default function CorporateWellnessPage() {
  const benefits = [
    {
      icon: <TrendingUp size={32} />,
      title: 'Stronger Performance',
      description: 'Support consistent energy, focus, and sustainable productivity across teams.'
    },
    {
      icon: <Heart size={32} />,
      title: 'Healthier Habits',
      description: 'Encourage preventive care and daily routines that reduce long-term strain.'
    },
        {
      icon: <Heart size={32} />,
      title: 'Healthier Habits',
      description: 'Encourage preventive care and daily routines that reduce long-term strain.'
    },
    {
      icon: <Sparkles size={32} />,
      title: 'Positive Culture',
      description: 'Build connection, morale, and a shared commitment to healthier work life.'
    }
  ];

  const features = [
    {
      icon: <Brain size={24} />,
      title: 'Mental Wellness Programs',
      description: 'Stress management, counseling services, and mindfulness workshops',
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-200'
    },
    {
      icon: <Activity size={24} />,
      title: 'Physical Fitness',
      description: 'On-site fitness classes, group dance fitness, group yoga sessions, gym partnerships, and personal training',
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200'
    },
    {
      icon: <Target size={24} />,
      title: 'Nutrition Coaching',
      description: 'Meal planning, dietary consultations, and healthy eating workshops',
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-200'
    }
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      employees: '10-50',
      price: '₹20,000',
      period: '/month',
      features: [
        'Monthly wellness workshops',
        'Digital wellness resources',
        'Basic health assessments',
        'Email support',
        'Quarterly progress reports'
      ],
      popular: false
    },
    {
      name: 'Mid-Enterprise',
      employees: '51-200',
      price: '₹79,900',
      period: '/month',
      features: [
        'Everything in Starter',
        'Weekly fitness classes',
        'Mental health counseling',
        'Nutrition consultations',
        'Dedicated account manager',
        'Monthly progress reports'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      employees: '200+',
      price: 'Custom',
      period: 'pricing',
      features: [
        'Everything in Mid-Enterprise',
        '24/7 telehealth services',
        'Executive health programs',
        'Fully customizable solutions',
        'Advanced analytics dashboard',
        'Dedicated wellness team'
      ],
      popular: false
    }
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-linear-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white py-12 lg:py-20 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-700">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjB0ZWFtJTIwd29ya3xlbnwxfHx8fDE3NjY3MTA5MDd8MA&ixlib=rb-4.1.0&q=80&w=1080')] opacity-10 bg-cover bg-center" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-white/20 text-white border-white/30 dark:bg-white/10 dark:text-white">
                <Building2 size={16} className="mr-2" />
                Corporate Wellness Solutions
              </Badge>
              <h1 className="text-4xl lg:text-6xl">
                Invest in Your Team&apos;s Well-being
              </h1>
              <p className="text-xl text-white/90">
                Create a healthier, happier, and more productive workplace with our comprehensive 
                corporate wellness programs designed for modern organizations.
              </p>
              <p className="text-xl text-white/90">
                Reach us for group dance fitness, mindfulness workshops, group yoga sessions, counseling and more.
              </p>
              <div className="flex flex-wrap gap-4">
                <OpenAuthButton 
                  size="lg" 
                  className="bg-white text-emerald-600 hover:bg-white/90"
                >
                  Get Started
                </OpenAuthButton>
                <OpenAuthButton 
                  size="lg" 
                  variant="outline" 
                  className="border-white/70 text-white bg-white/10 hover:bg-white/20"
                >
                  Contact Sales
                </OpenAuthButton>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjB0ZWFtJTIwd29ya3xlbnwxfHx8fDE3NjY3MTA5MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Corporate wellness"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Benefits Section */}
      <section className="py-16 lg:py-20 bg-linear-to-br from-emerald-50 to-teal-50 dark:from-slate-950 dark:to-emerald-950/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">Why Corporate Wellness?</Badge>
            <h2 className="mb-4">Wellness that supports your people and your mission</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto dark:text-slate-200/70">
              Build resilient teams with programs that prioritize physical, mental, and lifestyle health.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow dark:bg-slate-950/60 dark:border-slate-800">
                <div className="text-emerald-600 dark:text-emerald-300 mb-4">{benefit.icon}</div>
                <h3 className="mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground dark:text-slate-200/70">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">Comprehensive Solutions</Badge>
            <h2 className="mb-4">What We Offer</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto dark:text-slate-200/70">
              Holistic wellness programs covering all aspects of employee health
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:border-emerald-300 transition-colors dark:bg-slate-950/60 dark:border-slate-800">
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground dark:text-slate-200/70">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-20 bg-accent/30 dark:bg-slate-900/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">Simple Process</Badge>
            <h2 className="mb-4">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Assessment', desc: 'Contact our sales and We analyze your organization\'s needs and goals' },
              { step: '02', title: 'Customization', desc: 'Design a tailored wellness program for your team' },
              { step: '03', title: 'Implementation', desc: 'Launch programs with dedicated support' },
              { step: '04', title: 'Optimization', desc: 'Track results and continuously improve' }
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl font-semibold mx-auto mb-4">
                  {item.step}
                </div>
                {index < 3 && (
                  <div className="pointer-events-none hidden md:block absolute top-8 -right-14 text-emerald-400/85 drop-shadow-sm">
                    {index % 2 === 0 ? (
                      <svg width="92" height="40" viewBox="0 0 92 40" fill="none" aria-hidden="true">
                        <path
                          d="M4 30C24 8 58 8 82 28"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray="5 5"
                        />
                        <path
                          d="M74 21L82 28L72 33"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="92" height="40" viewBox="0 0 92 40" fill="none" aria-hidden="true">
                        <path
                          d="M4 10C26 32 58 32 82 12"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray="5 5"
                        />
                        <path
                          d="M74 7L82 12L72 19"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                )}
                <h3 className="mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground dark:text-slate-200/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">Flexible Pricing</Badge>
            <h2 className="mb-4">Choose the Right Plan for Your Team</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto dark:text-slate-200/70">
              Scalable solutions for organizations of all sizes
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <Card
                key={index}
                className={`p-8 relative dark:bg-slate-950/60 dark:border-slate-800 ${tier.popular ? 'border-emerald-500 border-2 shadow-lg' : ''}`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white">
                    Most Popular
                  </Badge>
                )}
                <div className="text-center mb-6">
                  <h3 className="mb-2">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 dark:text-slate-200/70">
                    <Users size={16} className="inline mr-1" />
                    {tier.employees} employees
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-semibold">{tier.price}</span>
                    <span className="text-muted-foreground dark:text-slate-200/70">{tier.period}</span>
                  </div>
                </div>
                <Separator className="mb-6" />
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <OpenAuthButton 
                  className={`w-full ${tier.popular ? 'bg-linear-to-r from-emerald-500 to-teal-600' : ''}`}
                  variant={tier.popular ? 'default' : 'outline'}
                >
                  {tier.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                </OpenAuthButton>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground dark:text-slate-200/70">
              All plans include a 30-day money-back guarantee.
            </p>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 lg:py-20 bg-white border-t border-border dark:bg-slate-950/60 dark:border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="p-6 text-center dark:bg-slate-950/60 dark:border-slate-800">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">
                <Headphones size={32} />
              </div>
              <h3 className="mb-2">Dedicated Support</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-200/70">
                Account managers available to help every step of the way
              </p>
            </Card>
            <Card className="p-6 text-center dark:bg-slate-950/60 dark:border-slate-800">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">
                <BarChart3 size={32} />
              </div>
              <h3 className="mb-2">AI powered Analytics</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-200/70">
                Track engagement, progress and more with detailed dashboards
              </p>
            </Card>
            <Card className="p-6 text-center dark:bg-slate-950/60 dark:border-slate-800">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">
                <Award size={32} />
              </div>
              <h3 className="mb-2">Certified Professionals</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-200/70">
                All wellness experts are fully certified and background-checked
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-16 lg:py-20 bg-accent/30 dark:bg-slate-900/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 lg:p-10 border border-border bg-white shadow-sm dark:bg-slate-950/70 dark:border-slate-800">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/3">
                  <Badge className="mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">Case Study</Badge>
                  <h3 className="text-2xl font-medium mb-2">Orbit Labs</h3>
                  <p className="text-sm text-muted-foreground dark:text-slate-200/70">200-person product & engineering team</p>
                </div>
                <div className="lg:w-2/3">
                  <p className="text-muted-foreground leading-relaxed dark:text-slate-200/70">
                    “Within 90 days, participation hit 78%. Burnout markers dropped, and teams reported
                    higher focus and morale. The Wolistic program felt tailored, not templated.”
                  </p>
                  <div className="mt-6 grid sm:grid-cols-3 gap-4 text-sm">
                    <div className="bg-accent/40 rounded-xl p-4 text-center dark:bg-slate-900/70">
                      <div className="text-lg font-semibold text-emerald-600">78%</div>
                      <div className="text-muted-foreground dark:text-slate-200/70">Program participation</div>
                    </div>
                    <div className="bg-accent/40 rounded-xl p-4 text-center dark:bg-slate-900/70">
                      <div className="text-lg font-semibold text-emerald-600">32%</div>
                      <div className="text-muted-foreground dark:text-slate-200/70">Stress reduction</div>
                    </div>
                    <div className="bg-accent/40 rounded-xl p-4 text-center dark:bg-slate-900/70">
                      <div className="text-lg font-semibold text-emerald-600">4.8/5</div>
                      <div className="text-muted-foreground dark:text-slate-200/70">Employee rating</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-linear-to-r from-emerald-600 to-teal-600 text-white dark:from-emerald-700 dark:to-teal-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="mb-4 text-white">Ready to Transform Your Workplace?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of companies creating healthier, more productive teams with Wolistic
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <OpenAuthButton 
              size="lg" 
              className="bg-white text-emerald-600 hover:bg-white/90"
            >
              Start Free
            </OpenAuthButton>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/70 text-white bg-white/10 hover:bg-white/20"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}