"use client";

export function HowItWorks() {
  return (
      <section className="py-10 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-lg dark:hover:shadow-black/30">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="mb-4 text-3xl lg:text-4xl">How Your Wolistic Journey Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl font-semibold mx-auto mb-6">
                1
              </div>
              <h3 className="mb-3">Share your goals</h3>
              <p className="text-muted-foreground">
                Tell us about your wellness goals, lifestyle, and challenges across body, mind, and diet so we can help you find the right professionals.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center text-2xl font-semibold mx-auto mb-6">
                2
              </div>
              <h3 className="mb-3">Connect with Experts</h3>
              <p className="text-muted-foreground">
                Engage with Experts, Follow personalized routines and wellness programs tailored to your needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center text-2xl font-semibold mx-auto mb-6">
                3
              </div>
              <h3 className="mb-3">Track Progress</h3>
              <p className="text-muted-foreground">
                Track your wellness journey and stay consistent while experts guide your routines and progress.
              </p>
            </div>
          </div>
        </div>
        </div>
      </section>


  );
}