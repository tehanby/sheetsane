'use client';

import Link from 'next/link';

export default function MarketingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 md:py-32 text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Trusted by data professionals worldwide
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 text-foreground leading-tight">
            Find spreadsheet errors
            <br />
            <span className="text-primary">before they find you</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-foreground/70 max-w-3xl mx-auto mb-8 leading-relaxed">
            Stop wasting hours manually checking spreadsheets. Get instant, comprehensive analysis 
            that catches formula errors, data inconsistencies, and quality issues in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/" className="btn-primary text-lg px-8 py-4">
              Analyze Your Spreadsheet
              <svg className="w-5 h-5 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a href="#features" className="btn-secondary text-lg px-8 py-4">
              See How It Works
            </a>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm text-foreground/50">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              No account required
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Instant results
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              PDF report included
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Secure & private
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="card bg-gradient-to-br from-red-500/10 to-amber-500/5 border-red-500/20">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Spreadsheet errors cost you time and money
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              One broken formula or duplicate key can derail your entire project
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '⏰',
                title: 'Hours of manual checking',
                desc: 'You spend days reviewing spreadsheets line by line, missing critical errors',
              },
              {
                icon: '💸',
                title: 'Costly mistakes',
                desc: 'Bad data leads to wrong decisions, wasted resources, and lost revenue',
              },
              {
                icon: '😰',
                title: 'Last-minute surprises',
                desc: 'Discover errors right before deadlines, causing stress and delays',
              },
            ].map((problem, i) => (
              <div key={problem.title} className="bg-surface-light rounded-lg p-6 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="text-4xl mb-3">{problem.icon}</div>
                <h3 className="font-semibold text-foreground mb-2">{problem.title}</h3>
                <p className="text-sm text-foreground/60">{problem.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Get instant, comprehensive analysis
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            SheetSane finds errors, inconsistencies, and data quality issues automatically
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: '🔍',
              title: 'Deep Formula Analysis',
              desc: 'Detects #REF!, #DIV/0!, #VALUE! and other Excel errors across all sheets',
              color: 'text-red-400',
            },
            {
              icon: '📊',
              title: 'Data Quality Checks',
              desc: 'Finds missing headers, empty rows, type mismatches, and hidden sheets',
              color: 'text-amber-400',
            },
            {
              icon: '🔑',
              title: 'Duplicate Detection',
              desc: 'Identifies duplicate keys in ID columns that could break your data integrity',
              color: 'text-blue-400',
            },
            {
              icon: '⚡',
              title: 'Lightning Fast',
              desc: 'Analyze spreadsheets with thousands of rows in seconds, not hours',
              color: 'text-primary',
            },
            {
              icon: '📄',
              title: 'Professional PDF Report',
              desc: 'Get a shareable report with detailed findings, scores, and actionable suggestions',
              color: 'text-purple-400',
            },
            {
              icon: '🔒',
              title: '100% Private',
              desc: 'Files are automatically deleted after 30 minutes. No data stored, no tracking',
              color: 'text-green-400',
            },
          ].map((feature, i) => (
            <div key={feature.title} className="card hover:border-primary/50 transition-all animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`text-4xl mb-4 ${feature.color}`}>{feature.icon}</div>
              <h3 className="font-semibold text-lg text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple as 1-2-3
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Get your comprehensive sanity report in minutes
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Upload Your Spreadsheet',
              desc: 'Drag and drop your Excel file (.xlsx or .xls) up to 10MB. We\'ll show you a preview instantly.',
            },
            {
              step: '2',
              title: 'Secure Payment',
              desc: 'One-time $19 payment via Stripe. No subscription, no hidden fees. Your report is ready immediately.',
            },
            {
              step: '3',
              title: 'Get Your Report',
              desc: 'View detailed findings online and download a professional PDF report to share with your team.',
            },
          ].map((step, i) => (
            <div key={step.step} className="relative animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="card text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {step.step}
                </div>
                <h3 className="font-semibold text-xl text-foreground mb-3">{step.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{step.desc}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <svg className="w-8 h-8 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Perfect for teams who care about data quality
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              title: 'Data Analysts',
              desc: 'Validate datasets before analysis. Catch errors before they corrupt your insights.',
            },
            {
              title: 'Financial Teams',
              desc: 'Audit financial spreadsheets. Ensure formulas are correct and data is consistent.',
            },
            {
              title: 'Project Managers',
              desc: 'Review project data exports. Find duplicates and missing information quickly.',
            },
            {
              title: 'Quality Assurance',
              desc: 'Verify data integrity in spreadsheets. Generate reports for compliance and audits.',
            },
          ].map((useCase, i) => (
            <div key={useCase.title} className="card bg-surface-light animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <h3 className="font-semibold text-lg text-foreground mb-2">{useCase.title}</h3>
              <p className="text-sm text-foreground/60">{useCase.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="card bg-gradient-to-br from-primary/20 to-accent/10 border-primary/30 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            One-time payment. No subscriptions.
          </h2>
          <div className="flex items-baseline justify-center gap-3 mb-6">
            <span className="font-display text-6xl font-bold text-foreground">$19</span>
            <span className="text-xl text-foreground/60">per report</span>
          </div>
          <p className="text-lg text-foreground/70 mb-8 max-w-2xl mx-auto">
            Get comprehensive analysis, detailed findings, and a professional PDF report. 
            No monthly fees, no credit card required for preview.
          </p>
          <Link href="/" className="btn-primary text-lg px-10 py-4 inline-flex items-center">
            Start Analyzing Now
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-sm text-foreground/50 mt-6">
            Secure payment via Stripe • Files deleted after 30 minutes • No account required
          </p>
        </div>
      </section>

      {/* Trust Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {[
            {
              icon: '🔒',
              title: 'Secure & Private',
              desc: 'All files are processed securely and automatically deleted after 30 minutes. We never store your data.',
            },
            {
              icon: '⚡',
              title: 'Fast & Reliable',
              desc: 'Built on modern infrastructure. Get your results in seconds, even for large spreadsheets.',
            },
            {
              icon: '💳',
              title: 'Simple Pricing',
              desc: 'One-time $19 payment. No subscriptions, no hidden fees, no surprises.',
            },
          ].map((trust, i) => (
            <div key={trust.title} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="text-5xl mb-4">{trust.icon}</div>
              <h3 className="font-semibold text-lg text-foreground mb-2">{trust.title}</h3>
              <p className="text-sm text-foreground/60">{trust.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="animate-fade-in">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to find those hidden errors?
          </h2>
          <p className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto">
            Upload your spreadsheet and get instant, comprehensive analysis in seconds.
          </p>
          <Link href="/" className="btn-primary text-lg px-10 py-4 inline-flex items-center">
            Get Started Free Preview
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
