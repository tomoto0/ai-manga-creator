import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Sparkles, Newspaper, Image, Share2, ArrowRight, Zap, Palette, Download } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-purple flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl">AI Manga Creator</span>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/gallery">
                  <Button variant="ghost">Gallery</Button>
                </Link>
                <Link href="/studio">
                  <Button className="gradient-purple text-white border-0">
                    Create Manga
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="gradient-purple text-white border-0">
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden gradient-purple-radial">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-8">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Powered by AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Transform News into
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Stunning Manga
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              AI-powered manga creation from the latest news. Select a story, generate panels, 
              add dialogue, and share your unique manga with the world.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link href="/studio">
                  <Button size="lg" className="gradient-purple text-white border-0 px-8 py-6 text-lg glow-purple">
                    Start Creating
                    <Sparkles className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="gradient-purple text-white border-0 px-8 py-6 text-lg glow-purple">
                    Get Started Free
                    <Sparkles className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              )}
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                  View Gallery
                </Button>
              </Link>
            </div>
          </div>


        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Create professional manga in minutes with our AI-powered workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Newspaper,
                title: "Select News",
                description: "Browse the latest news from multiple sources and pick a story that inspires you",
                step: 1,
              },
              {
                icon: Sparkles,
                title: "Generate Story",
                description: "AI analyzes the news and creates unique manga plot proposals for you to choose",
                step: 2,
              },
              {
                icon: Palette,
                title: "Create Panels",
                description: "Generate stunning manga panels with AI, maintaining visual consistency",
                step: 3,
              },
              {
                icon: Share2,
                title: "Share & Download",
                description: "Export your manga as JPEG and share directly to X (Twitter)",
                step: 4,
              },
            ].map((feature, index) => (
              <div key={index} className="relative group">
                <div className="card-hover p-6 rounded-2xl bg-card border border-border h-full">
                  <div className="step-indicator mb-4">
                    {feature.step}
                  </div>
                  <feature.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-purple-radial opacity-50" />
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Create Your First Manga?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands of creators using AI to transform news into art
            </p>
            {isAuthenticated ? (
              <Link href="/studio">
                <Button size="lg" className="gradient-purple text-white border-0 px-10 py-6 text-lg glow-purple">
                  Open Studio
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="gradient-purple text-white border-0 px-10 py-6 text-lg glow-purple">
                  Start Creating Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">AI Manga Creator</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Powered by Manus AI Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
